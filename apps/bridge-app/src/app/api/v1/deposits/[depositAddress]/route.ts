import type { DepositStatus, DepositsApiResponse, PayoutStatus } from '@bridge/shared';
import { createDbClient } from '@bridge/shared';
import { type NextRequest, NextResponse } from 'next/server';
import { getAddress, type Hash } from 'viem';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
	throw new Error('Supabase environment variables are not set');
}

const supabase = createDbClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ depositAddress: string }> }
) {
	try {
		const { depositAddress } = await params;
		const normalizedAddress = getAddress(depositAddress);

		const { data, error } = await supabase
			.from('deposits')
			.select('*')
			.eq('deposit_address', normalizedAddress)
			.single();

		if (error || !data) {
			return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
		}

		return NextResponse.json<DepositsApiResponse>({
			payout: {
				status: data.payout_status as PayoutStatus,
				txHash: (data.payout_tx_hash as Hash) ?? undefined,
				amount: data.payout_amount ?? undefined,
				fee: data.fee ?? undefined
			},
			deposit: {
				amount: data.deposit_amount,
				txHash: (data.deposit_tx_hash as Hash) ?? undefined,
				status: data.deposit_status as DepositStatus,
				blockNumber: data.deposit_block_number ?? undefined
			}
		});
	} catch (error) {
		console.error('Error fetching deposit:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
