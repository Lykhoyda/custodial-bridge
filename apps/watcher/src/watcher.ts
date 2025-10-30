import { createDbClient } from '@bridge/shared';
import { config } from './config';
import { checkConfirmingDeposits, checkWaitingDeposits, processConfirmedDeposits } from './lib';
import { createClients } from './utils/createClients';

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startWatcher() {
	const db = createDbClient(config.supabaseUrl, config.supabaseAnonKey);
	const clients = createClients();

	console.log('👀 Bridge watcher started');
	while (true) {
		try {
			await checkWaitingDeposits(clients, db);
			await checkConfirmingDeposits(clients, db);
			await processConfirmedDeposits(clients, db);
		} catch (error) {
			console.error('Error in watcher loop:', error);
		}

		await sleep(config.pollInterval);
	}
}
