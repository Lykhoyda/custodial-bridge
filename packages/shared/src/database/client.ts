import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types.ts';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	throw new Error('Supabase URL and ANON KEY must be provided');
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
