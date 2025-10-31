import type { CreateDepositRequest, CreateDepositResponse } from '@bridge/shared';
import { calculateIndex, createDeposit, deriveDepositAddress } from '@bridge/shared';
import { type NextRequest, NextResponse } from 'next/server';
import { createPublicClient, getAddress, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { supabase } from '@/config/db';

const baseClient = createPublicClient({
	chain: baseSepolia,
	transport: http(process.env.BASE_RPC_URL)
});

export async function POST(request: NextRequest) {
	try {
		const body: CreateDepositRequest = await request.json();
		const nonce = body.nonce ?? 0;
		const destinationAddress = getAddress(body.destinationAddress);

		const mnemonic = process.env.BRIDGE_MNEMONIC;
		if (!mnemonic) throw new Error('BRIDGE_MNEMONIC not configured');

		const index = calculateIndex(destinationAddress, nonce);
		const { address: depositAddress } = deriveDepositAddress(mnemonic, index);
		const currentBlock = await baseClient.getBlockNumber();

		await createDeposit(supabase, {
			deposit_address: depositAddress,
			destination_address: destinationAddress,
			amount: body.amount,
			depositCreatedBlockNumber: Number(currentBlock),
			index,
			nonce
		});

		return NextResponse.json<CreateDepositResponse>({
			index,
			nonce,
			depositAddress,
			destinationAddress
		});
	} catch (error) {
		// @ts-expect-error
		if (error.code && error?.code === '23505') {
			console.error('Duplicate deposit address error:', error);
			return NextResponse.json(
				{
					error:
						'This combination of destination Address and nonce already exist. Please use a different nonce.'
				},
				{ status: 409 }
			);
		}

		console.error('Error creating deposit:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
