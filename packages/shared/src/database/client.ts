import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types.ts';

function createDbClient(supabaseUrl: string, anonKey: string) {
	return createClient<Database>(supabaseUrl, anonKey);
}

export { createDbClient };
