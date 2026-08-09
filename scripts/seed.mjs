import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // MUST use service role to bypass RLS and delete users

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase URL or Service Role Key in environment")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const DUMMY_USERS = [
  { name: 'Iqbal', email: 'iqbal@gmail.com', role: 'admin' },
  { name: 'Antar', email: 'antar@gmail.com', role: 'member' },
  { name: 'Jaman', email: 'jaman@gmail.com', role: 'member' },
  { name: 'Pinak', email: 'pinak@gmail.com', role: 'member' },
  { name: 'Alom', email: 'alom@gmail.com', role: 'member' }
]

const MONTHS_TO_SEED = [
  { name: 'January 2026', start: '2026-01-01', end: '2026-01-31' },
  { name: 'February 2026', start: '2026-02-01', end: '2026-02-28' },
  { name: 'March 2026', start: '2026-03-01', end: '2026-03-31' },
  { name: 'April 2026', start: '2026-04-01', end: '2026-04-30' },
  { name: 'May 2026', start: '2026-05-01', end: '2026-05-31' },
  { name: 'June 2026', start: '2026-06-01', end: '2026-06-30' },
  { name: 'July 2026', start: '2026-07-01', end: '2026-07-31' }
]

function randomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2))
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function clearData() {
  console.log("Clearing existing data...")
  
  // Clear tables in correct order to avoid foreign key constraints
  const tables = ['activity_logs', 'settlements', 'deposits', 'fixed_expenses', 'bazar_expenses', 'daily_meals', 'sessions', 'users']
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000') // delete all
    if (error && error.code !== 'PGRST116') {
      console.log(`Error clearing ${table}:`, error.message)
    }
  }

  // Clear auth users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (users) {
    for (const u of users) {
      await supabase.auth.admin.deleteUser(u.id)
    }
  }
}

async function seed() {
  try {
    await clearData()
    
    console.log("Creating users...")
    const userIds = {} // map of email to ID
    
    for (const u of DUMMY_USERS) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: { full_name: u.name }
      })
      if (authError) throw authError

      const userId = authData.user.id
      userIds[u.email] = userId

      const { error: dbError } = await supabase.from('users').insert([{
        id: userId,
        name: u.name,
        email: u.email,
        role: u.role
      }])
      if (dbError) throw dbError
    }

    const allUserIds = Object.values(userIds)

    console.log("Creating sessions and data...")
    for (const month of MONTHS_TO_SEED) {
      console.log(`Seeding ${month.name}...`)
      
      // 1. Create session
      const { data: sessionData, error: sessionError } = await supabase.from('sessions').insert([{
        session_name: month.name,
        start_date: month.start,
        status: 'open',
        created_by: userIds['iqbal@gmail.com']
      }]).select().single()
      
      if (sessionError) throw sessionError
      const sessionId = sessionData.id

      // 2. Add random data for this session
      for (const uid of allUserIds) {
        
        // Random Deposits (1-3 deposits per user per month)
        const numDeposits = randomInt(1, 3)
        for (let i = 0; i < numDeposits; i++) {
          await supabase.from('deposits').insert([{
            session_id: sessionId,
            user_id: uid,
            amount: randomInt(1000, 3000), // 1000 to 3000
            date: month.start, // just use start date for simplicity
            created_by: userIds['iqbal@gmail.com']
          }])
        }

        // Random Bazar (0-2 bazars per user)
        const numBazars = randomInt(0, 2)
        for (let i = 0; i < numBazars; i++) {
          await supabase.from('bazar_expenses').insert([{
            session_id: sessionId,
            user_id: uid,
            amount: randomInt(500, 2000),
            date: month.start,
            description: 'Vegetables & Fish',
            created_by: userIds['iqbal@gmail.com']
          }])
        }

        // Random Meals (add grouped meals for simplicity, e.g. 15-45 meals total per person in a month)
        await supabase.from('daily_meals').insert([{
          session_id: sessionId,
          user_id: uid,
          meal_count: randomFloat(15, 45),
          date: month.start,
          created_by: userIds['iqbal@gmail.com']
        }])
        
        // Random Fixed Expenses paid by this user (0-1 per user)
        if (randomInt(0, 1) === 1) {
          await supabase.from('fixed_expenses').insert([{
            session_id: sessionId,
            user_id: uid,
            amount: randomInt(100, 500),
            description: 'Wifi Bill or Maid',
            date: month.start,
            created_by: userIds['iqbal@gmail.com']
          }])
        }
      }

      // Add a mess-fund fixed expense (no user_id)
      await supabase.from('fixed_expenses').insert([{
        session_id: sessionId,
        amount: 1500, // shared cost like Gas or Electricity
        description: 'Gas Bill',
        date: month.start,
        created_by: userIds['iqbal@gmail.com']
      }])

      // 3. Close the session (Calculate balances and insert into settlements)
      // Re-fetch all data to calculate properly
      const { data: mealsData } = await supabase.from('daily_meals').select('*').eq('session_id', sessionId)
      const { data: bazarData } = await supabase.from('bazar_expenses').select('*').eq('session_id', sessionId)
      const { data: depositsData } = await supabase.from('deposits').select('*').eq('session_id', sessionId)
      const { data: fixedData } = await supabase.from('fixed_expenses').select('*').eq('session_id', sessionId)

      const tMeals = mealsData.reduce((sum, m) => sum + Number(m.meal_count), 0)
      const tBazar = bazarData.reduce((sum, b) => sum + Number(b.amount), 0)
      const tFixed = fixedData.reduce((sum, f) => sum + Number(f.amount), 0)
      
      const mRate = tMeals > 0 ? (tBazar / tMeals) : 0
      const fixedCostPerMember = tFixed / allUserIds.length

      const settlements = []
      for (const uid of allUserIds) {
        const memberMeals = mealsData.filter(m => m.user_id === uid).reduce((sum, m) => sum + Number(m.meal_count), 0)
        const memberDeposits = depositsData.filter(d => d.user_id === uid).reduce((sum, d) => sum + Number(d.amount), 0)
        const memberBazar = bazarData.filter(b => b.user_id === uid).reduce((sum, b) => sum + Number(b.amount), 0)
        const memberPaidFixed = fixedData.filter(f => f.user_id === uid).reduce((sum, f) => sum + Number(f.amount), 0)

        const totalPaid = memberDeposits + memberBazar + memberPaidFixed
        const mealCost = memberMeals * mRate
        const totalCost = mealCost + fixedCostPerMember
        const balance = totalPaid - totalCost

        let amount = balance
        let type = 'payable' // User gets money back
        if (amount < 0) {
          amount = Math.abs(amount)
          type = 'receivable' // User owes money
        }

        settlements.push({
          session_id: sessionId,
          user_id: uid,
          amount: parseFloat(amount.toFixed(2)),
          type: type
        })
      }

      await supabase.from('settlements').insert(settlements)

      // Mark session closed
      await supabase.from('sessions').update({
        status: 'closed',
        end_date: month.end
      }).eq('id', sessionId)

    }

    console.log("Seeding complete! You can log in with any email and password 'password123'")
  } catch (error) {
    console.error("Seeding failed:", error)
  }
}

seed()
