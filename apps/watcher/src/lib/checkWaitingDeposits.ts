import type { SupabaseClient } from '@supabase/supabase-js';
import type { Address } from 'viem';
import type { createClients } from '../utils/createClients';

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
				address: deposit.deposit_address as Address
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

export { checkWaitingDeposits };
