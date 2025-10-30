import type { SupabaseClient } from '@supabase/supabase-js';
import { createPublicClient, createWalletClient, http } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { arbitrumSepolia, baseSepolia } from 'viem/chains';
import { config } from './config';

function createClients() {
	const baseClient = createPublicClient({
		chain: baseSepolia,
		transport: http(config.baseRpcUrl)
	});

	const arbitrumClient = createPublicClient({
		chain: arbitrumSepolia,
		transport: http(config.arbitrumRpcUrl)
	});

	return { base: baseClient, arbitrum: arbitrumClient };
}

async function checkWaitingDeposits(clients: ReturnType<typeof createClients>, db: SupabaseClient) {
	const { data: deposits, error } = await db
		.from('deposits')
		.select('*')
		.eq('deposit_status', 'waiting');

	if (error) {
		console.error('Failed to load waiting deposits', error);
		return;
	}
	if (!deposits?.length) return;

	const latestBlock = await clients.base.getBlockNumber();

	for (const deposit of deposits) {
		try {
			const expectedAmount = BigInt(deposit.deposit_amount);

			// Check current balance
			const balance = await clients.base.getBalance({
				address: deposit.deposit_address as `0x${string}`
			});

			if (balance === 0n) continue;

			const SAFETY_MARGIN = 10n; // Reorg protection
			const startBlock = deposit.deposit_created_block_number
				? BigInt(deposit.deposit_created_block_number) - SAFETY_MARGIN
				: latestBlock - 1000n; // Fallback: scan last ~1000 blocks

			// Ensure we don't scan blocks that don't exist yet
			const scanFrom = startBlock > latestBlock ? latestBlock : startBlock;

			console.log(`Scanning blocks ${latestBlock} -> ${scanFrom} for deposit ${deposit.id}`);

			// Scan backward from latest block to creation block
			for (let blockNumber = latestBlock; blockNumber >= scanFrom; blockNumber = blockNumber - 1n) {
				const block = await clients.base.getBlock({
					blockNumber,
					includeTransactions: true
				});

				// Find transaction to this deposit address
				const tx = block.transactions.find(
					(t) =>
						typeof t === 'object' && t.to?.toLowerCase() === deposit.deposit_address.toLowerCase()
				);

				if (!tx || typeof tx !== 'object') continue;

				// ✅ Validate amount matches expected
				const txValue = tx.value;

				if (txValue !== expectedAmount) {
					console.warn(
						`Amount mismatch for ${deposit.deposit_address}: expected ${expectedAmount}, got ${txValue}`
					);
					continue;
				}

				console.log('✅ Found matching transaction! Update to confirming');
				const { error: updateError } = await db
					.from('deposits')
					.update({
						deposit_status: 'confirming',
						deposit_tx_hash: tx.hash,
						deposit_block_number: Number(block.number),
						updated_at: new Date().toISOString()
					})
					.eq('id', deposit.id);

				if (updateError) {
					console.error(`Failed to update deposit ${deposit.id}:`, updateError);
				} else {
					console.log(
						`✅ Deposit ${deposit.id} moved to confirming: ${tx.hash} at block ${block.number}`
					);
				}

				break; // Stop scanning once we found the transaction
			}
		} catch (depositError) {
			console.error(`Failed to process deposit ${deposit.id}:`, depositError);
			// Continue to next deposit instead of crashing entire loop
		}
	}
}

async function checkConfirmingDeposits(
	clients: ReturnType<typeof createClients>,
	db: SupabaseClient
) {
	const REQUIRED_CONFIRMATIONS = config.requiredConfirmations;

	const { data: deposits, error } = await db
		.from('deposits')
		.select('*')
		.eq('deposit_status', 'confirming');

	if (error) {
		console.error('Failed to load confirming deposits', error);
		return;
	}
	if (!deposits?.length) return;

	const latestBlock = await clients.base.getBlockNumber();

	for (const deposit of deposits) {
		try {
			if (!deposit.deposit_block_number) {
				console.error(`Deposit ${deposit.id} is confirming but has no block number`);
				continue;
			}

			const depositBlock = BigInt(deposit.deposit_block_number);
			const confirmations = latestBlock - depositBlock;

			console.log(
				`Deposit ${deposit.id}: ${confirmations}/${REQUIRED_CONFIRMATIONS} confirmations`
			);

			if (confirmations >= BigInt(REQUIRED_CONFIRMATIONS)) {
				const { error: updateError } = await db
					.from('deposits')
					.update({
						deposit_status: 'confirmed',
						updated_at: new Date().toISOString()
					})
					.eq('id', deposit.id);

				if (updateError) {
					console.error(`Failed to update deposit ${deposit.id}:`, updateError);
				} else {
					console.log(`✅ Deposit ${deposit.id} confirmed after ${confirmations} blocks`);
				}
			}
		} catch (depositError) {
			console.error(`Failed to process deposit ${deposit.id}:`, depositError);
		}
	}
}

async function processConfirmedDeposits(
	clients: ReturnType<typeof createClients>,
	db: SupabaseClient
) {
	const { data: deposits, error } = await db
		.from('deposits')
		.select('*')
		.eq('deposit_status', 'confirmed');

	if (error) {
		console.error('Failed to load confirmed deposits', error);
		return;
	}
	if (!deposits?.length) return;

	for (const deposit of deposits) {
		try {
			console.log(`Attempting to process confirmed deposit ${deposit.id}...`);

			// 1. Try to claim this deposit (idempotent locking)
			const { data: claimed } = await db.rpc('claim_deposit_for_processing', {
				deposit_id: deposit.id
			});

			if (!claimed) {
				console.log(`Deposit ${deposit.id} already claimed by another watcher`);
				continue;
			}

			console.log(`✅ Successfully claimed deposit ${deposit.id}, sending payout...`);

			// 2. Derive the account that controls this deposit address
			const account = mnemonicToAccount(config.mnemonic, {
				addressIndex: deposit.index
			});

			// 3. Check if bridge has sufficient balance on Arbitrum
			const bridgeBalance = await clients.arbitrum.getBalance({
				address: account.address
			});

			const payoutAmount = BigInt(deposit.deposit_amount);

			if (bridgeBalance < payoutAmount) {
				console.error(
					`❌ Insufficient balance for deposit ${deposit.id}: ` +
						`need ${payoutAmount} wei, have ${bridgeBalance} wei ` +
						`(${account.address})`
				);

				// Rollback to 'confirmed' status so it can be retried
				await db
					.from('deposits')
					.update({
						deposit_status: 'confirmed',
						updated_at: new Date().toISOString()
					})
					.eq('id', deposit.id);

				console.log(`⏸️  Deposit ${deposit.id} rolled back to 'confirmed', will retry later`);
				continue;
			}

			// 4. Create wallet client with this specific account
			const walletClient = createWalletClient({
				account,
				chain: arbitrumSepolia,
				transport: http(config.arbitrumRpcUrl)
			});

			// 5. Send the payout transaction on Arbitrum
			const txHash = await walletClient.sendTransaction({
				to: deposit.destination_address as `0x${string}`,
				value: payoutAmount
			});

			console.log(`📤 Payout transaction sent: ${txHash}`);

			// 6. Record the transaction hash immediately
			const { error: recordError } = await db
				.from('deposits')
				.update({
					payout_tx_hash: txHash,
					payout_amount: deposit.deposit_amount,
					updated_at: new Date().toISOString()
				})
				.eq('id', deposit.id);

			if (recordError) {
				console.error(`Failed to record payout hash for ${deposit.id}:`, recordError);
				// Transaction is sent but not recorded - manual intervention needed
				continue;
			}

			// 7. Wait for transaction to be mined
			const receipt = await clients.arbitrum.waitForTransactionReceipt({
				hash: txHash
			});

			if (receipt.status === 'success') {
				// 8. Mark as sent
				const { error: updateError } = await db
					.from('deposits')
					.update({
						deposit_status: 'confirmed', // Keep as confirmed
						payout_status: 'sent',
						updated_at: new Date().toISOString()
					})
					.eq('id', deposit.id);

				if (updateError) {
					console.error(`Failed to mark payout as sent for ${deposit.id}:`, updateError);
				} else {
					console.log(`✅ Payout complete for deposit ${deposit.id}`);
				}
			} else {
				// Transaction reverted
				const { error: failError } = await db
					.from('deposits')
					.update({
						payout_status: 'failed',
						payout_error: 'Transaction reverted',
						updated_at: new Date().toISOString()
					})
					.eq('id', deposit.id);

				if (failError) {
					console.error(`Failed to mark payout as failed for ${deposit.id}:`, failError);
				}
			}
		} catch (depositError) {
			console.error(`Failed to process deposit ${deposit.id}:`, depositError);

			// Try to record the error in the database
			// Important: Roll back to 'confirmed' if we claimed but failed to send
			await db
				.from('deposits')
				.update({
					deposit_status: 'confirmed', // Rollback so it can be retried
					payout_status: 'failed',
					payout_error: depositError instanceof Error ? depositError.message : 'Unknown error',
					updated_at: new Date().toISOString()
				})
				.eq('id', deposit.id);
		}
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startWatcher(db: SupabaseClient) {
	console.log('👀 Bridge watcher started');
	const clients = createClients();

	while (true) {
		try {
			await checkWaitingDeposits(clients, db);
			await checkConfirmingDeposits(clients, db);
			await processConfirmedDeposits(clients, db);
		} catch (error) {
			console.error('Error in watcher loop:', error);
		}

		await sleep(config.pollInterval);
	}
}
