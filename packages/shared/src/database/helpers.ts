import type { SupabaseClient } from '@supabase/supabase-js';
import type { Address } from 'viem';
import type { Database } from './database.types.ts';

type CreateDepositParams = {
	destination_address: Address;
	amount: string;
	nonce: number;
	index: number;
	deposit_address: Address;
	depositCreatedBlockNumber: number;
};

async function createDeposit(
	supabase: SupabaseClient<Database>,
	{
		destination_address,
		deposit_address,
		amount,
		nonce,
		index,
		depositCreatedBlockNumber
	}: CreateDepositParams
): Promise<string> {
	const { data, error } = await supabase
		.from('deposits')
		.insert({
			deposit_address,
			destination_address,
			index,
			nonce,
			deposit_created_block_number: depositCreatedBlockNumber,
			deposit_status: 'waiting',
			deposit_amount: amount,
			payout_status: 'pending'
		})
		.select();

	if (error) throw error;
	if (!data || data.length === 0) throw new Error('Failed to create deposit');

	return data[0].id;
}

export { createDeposit };
