import type { CreateDepositRequest, CreateDepositResponse } from '@bridge/shared';
import { calculateIndex, createDeposit, deriveDepositAddress } from '@bridge/shared';
import { type NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const baseClient = createPublicClient({
	chain: baseSepolia,
	transport: http(process.env.BASE_RPC_URL)
});

export async function POST(request: NextRequest) {
	try {
		const body: CreateDepositRequest = await request.json();
		const nonce = body.nonce ?? 0;

		const mnemonic = process.env.BRIDGE_MNEMONIC;
		if (!mnemonic) throw new Error('BRIDGE_MNEMONIC not configured');

		const index = calculateIndex(body.destinationAddress, nonce);
		const { address: depositAddress } = deriveDepositAddress(mnemonic, index);
		const currentBlock = await baseClient.getBlockNumber();

		await createDeposit({
			deposit_address: depositAddress,
			destination_address: body.destinationAddress,
			amount: body.amount,
			depositCreatedBlockNumber: Number(currentBlock),
			index,
			nonce
		});

		return NextResponse.json<CreateDepositResponse>({
			index,
			nonce,
			depositAddress,
			destinationAddress: body.destinationAddress
		});
	} catch (error) {
		console.error('Error creating deposit:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
