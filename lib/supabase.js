import { createClient } from "@supabase/supabase-js";

// The publishable key is public by design. Row Level Security (see
// supabase/migrations) is what keeps everyone to their own rows.
// On web the session lives in localStorage. We sign in with a typed code,
// never a link, so there's nothing to pick up from the URL.
export const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
