import type { DepositStatus, PayoutStatus } from './index';

export type Deposit = {
	id: string;
	depositAddress: `0x${string}`;
	destinationAddress: `0x${string}`;
	index: number;
	nonce: number; // (NOT nullable - defaults to 0)

	depositStatus: DepositStatus;
	depositTxHash?: `0x${string}`;
	depositBlockNumber?: number;
	depositAmount?: string;

	payoutStatus: PayoutStatus;
	payoutTxHash?: `0x${string}`;
	payoutAmount?: string;
	fee?: string;

	depositError?: string;
	payoutError?: string;

	createdAt: string;
	updatedAt: string;
};
