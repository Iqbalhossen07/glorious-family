import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // MUST use service role to bypass RLS and delete users

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase URL or Service Role Key in environment")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function clearData() {
  console.log("Clearing all data from the database...")
  
  // Clear tables in correct order to avoid foreign key constraints
  const tables = ['activity_logs', 'settlements', 'deposits', 'fixed_expenses', 'bazar_expenses', 'daily_meals', 'sessions', 'users']
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000') // delete all
    if (error && error.code !== 'PGRST116') {
      console.log(`Error clearing ${table}:`, error.message)
    } else {
      console.log(`Cleared table: ${table}`)
    }
  }

  // Clear auth users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (users) {
    for (const u of users) {
      await supabase.auth.admin.deleteUser(u.id)
    }
    console.log(`Cleared ${users.length} auth users.`)
  }

  console.log("Database reset complete! You can now register a new manager account.")
}

clearData()
