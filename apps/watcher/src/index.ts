import 'dotenv/config';
import { startWatcher } from './watcher';

startWatcher().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
