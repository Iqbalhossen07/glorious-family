import { supabase } from '@/lib/supabase'

export const AnalyticsService = {
  /**
   * Get comprehensive analytics for a single member in a specific month
   */
  async getMemberAnalytics(sessionId: string, memberId: string, monthStr: string) {
    // monthStr is expected to be in "YYYY-MM" format
    const [year, month] = monthStr.split('-').map(Number)
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString()
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()

    // 1. Fetch total active members (for shared expenses)
    const { count: totalMembers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // 2. Fetch all meals for the mess in this month
    const { data: allMeals } = await supabase
      .from('daily_meals')
      .select('meal_count, breakfast, lunch, dinner, user_id, date, created_at')
      .eq('session_id', sessionId)
      .gte('date', startDate.split('T')[0])
      .lte('date', endDate.split('T')[0])
      .order('date', { ascending: false })

    // 3. Fetch all bazar for the mess in this month
    const { data: allBazar } = await supabase
      .from('bazar_expenses')
      .select('amount, user_id, date, item_name, created_at')
      .eq('session_id', sessionId)
      .gte('date', startDate.split('T')[0])
      .lte('date', endDate.split('T')[0])
      .order('date', { ascending: false })

    // 4. Fetch all fixed expenses for the mess in this month
    const { data: allFixedExpenses } = await supabase
      .from('fixed_expenses')
      .select('amount, user_id, date, item_name, created_at')
      .eq('session_id', sessionId)
      .gte('date', startDate.split('T')[0])
      .lte('date', endDate.split('T')[0])
      .order('date', { ascending: false })

    // 5. Fetch member deposits in this month
    const { data: memberDeposits } = await supabase
      .from('deposits')
      .select('amount, date, created_at')
      .eq('session_id', sessionId)
      .eq('user_id', memberId)
      .gte('date', startDate.split('T')[0])
      .lte('date', endDate.split('T')[0])
      .order('date', { ascending: false })

    // --- Calculations ---
    const totalMessMeals = allMeals?.reduce((sum, item) => sum + Number(item.meal_count), 0) || 0
    const totalMessBazar = allBazar?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
    const totalMessFixedExpense = allFixedExpenses?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
    const numMembers = totalMembers || 1

    const mealRate = totalMessMeals > 0 ? (totalMessBazar / totalMessMeals) : 0
    const sharedExpensePerMember = totalMessFixedExpense / numMembers

    // Member specific calculations and lists
    const memberMealsList = allMeals?.filter(m => m.user_id === memberId) || []
    const memberBazarList = allBazar?.filter(m => m.user_id === memberId) || []
    const memberFixedExpensesList = allFixedExpenses?.filter(m => m.user_id === memberId) || []
    const memberDepositList = memberDeposits || []

    const memberMeals = memberMealsList.reduce((sum, item) => sum + Number(item.meal_count), 0)
    const memberBazar = memberBazarList.reduce((sum, item) => sum + Number(item.amount), 0)
    const memberFixedExpensesPaid = memberFixedExpensesList.reduce((sum, item) => sum + Number(item.amount), 0)
    const memberTotalDeposit = memberDepositList.reduce((sum, item) => sum + Number(item.amount), 0)

    const memberTotalGiven = memberTotalDeposit + memberBazar + memberFixedExpensesPaid
    
    const memberMealCost = memberMeals * mealRate
    const memberTotalCost = memberMealCost + sharedExpensePerMember
    
    const balance = memberTotalGiven - memberTotalCost

    return {
      totalMessMeals,
      totalMessBazar,
      totalMessFixedExpense,
      mealRate,
      sharedExpensePerMember,
      member: {
        totalMeals: memberMeals,
        totalDeposit: memberTotalDeposit,
        totalBazarPaid: memberBazar,
        totalFixedExpensesPaid: memberFixedExpensesPaid,
        totalGiven: memberTotalGiven,
        mealCost: memberMealCost,
        totalCost: memberTotalCost,
        balance: balance,
        lists: {
          meals: memberMealsList,
          bazar: memberBazarList,
          deposits: memberDepositList,
          fixedExpenses: memberFixedExpensesList
        }
      }
    }
  },

  /**
   * Get activity logs for a specific member in a specific month
   */
  async getMemberActivityLogs(memberId: string, monthStr: string) {
    const [year, month] = monthStr.split('-').map(Number)
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString()
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, users(name, email)')
      .eq('user_id', memberId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  }
}
