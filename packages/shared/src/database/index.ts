export { supabase } from './client';

export type { Database } from './database.types';

export {
	createDeposit,
	getUnprocessedDeposits,
	markAsProcessing,
	markPayoutSent,
	recordPayoutHash
} from './helpers';
