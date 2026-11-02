import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lccomphvhmsjuechhvnx.supabase.co';
const supabaseAnonKey = 'sb_publishable_AAVL1JfRQ30Io0iWhEKVfQ_NW4MI463';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

