import { createClient } from "@supabase/supabase-js";

// Client for admin operations that bypasses Row Level Security
// and does not affect the current user's session.
export const createAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
};
