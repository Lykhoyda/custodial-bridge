import type { Address, Hash } from 'viem';
import type { DepositStatus, PayoutStatus } from './index';

export type Deposit = {
	id: string;
	depositAddress: Address;
	destinationAddress: Address;
	index: number;
	nonce: number; // (NOT nullable - defaults to 0)

	depositStatus: DepositStatus;
	depositTxHash?: Hash;
	depositBlockNumber?: number;
	depositAmount?: string;

	payoutStatus: PayoutStatus;
	payoutTxHash?: Hash;
	payoutAmount?: string;
	fee?: string;

	depositError?: string;
	payoutError?: string;

	createdAt: string;
	updatedAt: string;
};
