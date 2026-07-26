import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://legrsdmjstoxcoxvumgg.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_hd9EH0RxaXIdGXpfR-bcxg_2ZwlbLko'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)