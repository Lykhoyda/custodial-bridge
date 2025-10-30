import type { Address, Hash } from 'viem';

export type CreateDepositRequest = {
	destinationAddress: Address;
	amount: string;
	nonce?: number;
};

export type CreateDepositResponse = {
	index: number;
	nonce: number;
	depositAddress: Address;
	destinationAddress: Address;
};

export type DepositStatus = 'waiting' | 'confirming' | 'confirmed' | 'failed';

export type DepositStatusResponse = {
	amount?: string;
	txHash?: Hash;
	blockNumber?: number;
	status: DepositStatus;
};

export type PayoutStatus = 'pending' | 'sent' | 'failed';

export type PayoutResponse = {
	status: PayoutStatus;
	txHash?: Hash;
	amount?: string;
	fee?: string;
};

export type DepositsApiResponse = {
	deposit: DepositStatusResponse;
	payout: PayoutResponse;
};
