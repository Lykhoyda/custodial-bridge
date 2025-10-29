import type { Address, Hash } from 'viem';
import { supabase } from './client.ts';
import type { Database } from './database.types.ts';

type Deposit = Database['public']['Tables']['deposits']['Row'];

type CreateDepositParams = {
	destination_address: Address;
	amount: string;
	nonce: number;
	index: number;
	deposit_address: Address;
};

async function createDeposit({
	destination_address,
	deposit_address,
	amount,
	nonce,
	index
}: CreateDepositParams): Promise<string> {
	const { data, error } = await supabase
		.from('deposits')
		.insert({
			deposit_address,
			destination_address,
			index,
			nonce,
			deposit_status: 'waiting',
			deposit_amount: amount,
			payout_status: 'pending'
		})
		.select();

	if (error) throw error;
	if (!data || data.length === 0) throw new Error('Failed to create deposit');

	return data[0].id;
}

async function getUnprocessedDeposits(): Promise<Deposit[]> {
	const { data, error } = await supabase
		.from('deposits')
		.select('*')
		.eq('deposit_status', 'confirmed')
		.eq('payout_status', 'pending')
		.is('payout_tx_hash', null);

	if (error) throw error;
	if (!data) throw new Error('Failed to fetch unprocessed deposits');

	return data;
}

async function markAsProcessing(depositId: string): Promise<boolean> {
	const { data, error } = await supabase.rpc('claim_deposit_for_processing', {
		deposit_id: depositId
	});

	if (error) throw error;
	return data as boolean;
}

async function recordPayoutHash(depositId: string, txHash: Hash): Promise<void> {
	const { error } = await supabase
		.from('deposits')
		.update({ payout_tx_hash: txHash, updated_at: new Date().toISOString() })
		.eq('id', depositId);

	if (error) throw error;
}

async function markPayoutSent(depositId: string): Promise<void> {
	const { error } = await supabase
		.from('deposits')
		.update({ payout_status: 'sent', updated_at: new Date().toISOString() })
		.eq('id', depositId);

	if (error) throw error;
}

export {
	createDeposit,
	getUnprocessedDeposits,
	markAsProcessing,
	recordPayoutHash,
	markPayoutSent
};
