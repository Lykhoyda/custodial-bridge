export type { Deposit } from './db';

export type CreateDepositRequest = {
	destinationAddress: `0x${string}`;
	amount: string;
	nonce?: number;
};

export type CreateDepositResponse = {
	index: number;
	nonce: number;
	depositAddress: `0x${string}`;
	destinationAddress: `0x${string}`;
};

export type DepositStatus = 'waiting' | 'confirming' | 'confirmed' | 'failed';

export type DepositStatusResponse = {
	amount?: string;
	txHash?: `0x${string}`;
	confirmations?: number;
	status: DepositStatus;
};

export type PayoutStatus = 'pending' | 'sent' | 'failed';

export type PayoutResponse = {
	status: PayoutStatus;
	txHash?: `0x${string}`;
	amount?: string;
	fee?: string;
};

export type DepositsApiResponse = {
	deposit: DepositStatusResponse;
	payout: PayoutResponse;
};
