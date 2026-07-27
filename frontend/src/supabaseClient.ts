import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseEnabled = (import.meta.env.VITE_ENABLE_SUPABASE || '').toLowerCase() === 'true';

const hasValidSupabaseUrl = (() => {
	if (!supabaseUrl) return false;
	try {
		const parsed = new URL(supabaseUrl);
		return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
	} catch {
		return false;
	}
})();

const hasValidAnonKey = Boolean(
	supabaseAnonKey &&
	supabaseAnonKey.length > 20 &&
	!supabaseAnonKey.toLowerCase().includes('placeholder')
);

export const isSupabaseConfigured = supabaseEnabled && hasValidSupabaseUrl && hasValidAnonKey;

export const supabase: any = isSupabaseConfigured
	? createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
	})
	: null;
