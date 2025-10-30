import type { SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { createClients } from '../utils/createClients';

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

export { checkConfirmingDeposits };
