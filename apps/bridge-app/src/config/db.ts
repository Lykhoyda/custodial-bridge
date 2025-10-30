import { createDbClient } from '@bridge/shared';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
	throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY not set in environment');
}

const supabase = createDbClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export { supabase };
