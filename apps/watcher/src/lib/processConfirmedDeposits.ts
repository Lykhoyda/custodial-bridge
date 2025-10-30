import type { SupabaseClient } from '@supabase/supabase-js';
import { createWalletClient, http } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { config } from '../config';
import type { createClients } from '../utils/createClients';

async function processConfirmedDeposits(
	clients: ReturnType<typeof createClients>,
	db: SupabaseClient
) {
	const { data: deposits, error } = await db
		.from('deposits')
		.select('*')
		.eq('deposit_status', 'confirmed')
		.eq('payout_status', 'pending');

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
				to: deposit.destination_address,
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
				// Set payout as sent
				const { error: updateError } = await db
					.from('deposits')
					.update({
						payout_status: 'sent',
						deposit_status: 'confirmed',
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

export { processConfirmedDeposits };
