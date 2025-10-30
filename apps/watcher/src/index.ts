import 'dotenv/config';
import { supabase } from '@bridge/shared';
import { startWatcher } from './watcher';

startWatcher(supabase).catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
