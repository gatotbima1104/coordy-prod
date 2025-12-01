import { createClient } from "@supabase/supabase-js"
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./config"

export const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)