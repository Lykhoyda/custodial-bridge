// From database
export {
	createDeposit,
	type Database,
	getUnprocessedDeposits,
	markAsProcessing,
	markPayoutSent,
	recordPayoutHash,
	supabase
} from './database';

// From hd-wallet
export {
	calculateIndex,
	deriveAddressFromXpub,
	deriveDepositAddress,
	getXpub
} from './hd-wallet';

// From types
export type {
	CreateDepositRequest,
	CreateDepositResponse,
	Deposit,
	DepositStatus,
	DepositsApiResponse,
	PayoutStatus
} from './types';
