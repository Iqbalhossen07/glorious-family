import { supabase } from '@/lib/supabase'
import { MemberService } from './member.service'

export const AnalyticsService = {
  /**
   * Get comprehensive analytics for a single member in a specific month
   */
  async getMemberAnalytics(sessionId: string, memberId: string, monthStr: string) {
    // monthStr is expected to be in "YYYY-MM" format
    const [year, month] = monthStr.split('-').map(Number)
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString()
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()

    // 1. Fetch session status and ALL members in the mess
    const [sessionRes, allUsers] = await Promise.all([
      supabase.from('sessions').select('status').eq('id', sessionId).single(),
      MemberService.getAllMembers()
    ])
    const sessionStatus = sessionRes.data?.status || 'open'

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
      .select('amount, user_id, item_name, date, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    // 5. Fetch ALL deposits in this month (not just member's)
    const { data: allDeposits } = await supabase
      .from('deposits')
      .select('amount, user_id, date, created_at')
      .eq('session_id', sessionId)
      .gte('date', startDate.split('T')[0])
      .lte('date', endDate.split('T')[0])
      .order('date', { ascending: false })

    // --- Calculations ---
    const allOtherExpenses = allFixedExpenses?.filter(f => f.item_name !== 'Room Rent') || []
    const roomRents = allFixedExpenses?.filter(f => f.item_name === 'Room Rent') || []

    const totalMessMeals = allMeals?.reduce((sum, item) => sum + Number(item.meal_count), 0) || 0
    const totalMessBazar = allBazar?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
    const totalSharedFixedExpense = allOtherExpenses.reduce((sum, item) => sum + Number(item.amount), 0)
    
    // Determine number of relevant members (same logic as Summary)
    let relevantUsers = (allUsers || []).map(u => {
      const hasMeals = allMeals?.some(m => m.user_id === u.id)
      const hasBazar = allBazar?.some(m => m.user_id === u.id)
      const hasDeposits = allDeposits?.some(m => m.user_id === u.id)
      const hasRoomRent = roomRents?.some(m => m.user_id === u.id)
      const hasPaidFixed = allOtherExpenses?.some(m => m.user_id === u.id)
      
      const hasActivity = hasMeals || hasBazar || hasDeposits || hasRoomRent || hasPaidFixed
      return { ...u, hasActivity }
    })
    
    if (sessionStatus === 'closed') {
      relevantUsers = relevantUsers.filter(u => u.hasActivity)
    } else {
      relevantUsers = relevantUsers.filter(u => u.status === 'active' || u.hasActivity)
    }
    
    const numMembers = relevantUsers.length || 1

    const mealRate = totalMessMeals > 0 ? (totalMessBazar / totalMessMeals) : 0
    const sharedExpensePerMember = totalSharedFixedExpense / numMembers

    // Member specific calculations and lists
    const memberMealsList = allMeals?.filter(m => m.user_id === memberId) || []
    const memberBazarList = allBazar?.filter(m => m.user_id === memberId) || []
    const memberDepositList = allDeposits?.filter(m => m.user_id === memberId) || []
    
    const memberRoomRentList = roomRents.filter(m => m.user_id === memberId)
    const memberPaidFixedList = allOtherExpenses.filter(m => m.user_id === memberId)

    const memberMeals = memberMealsList.reduce((sum, item) => sum + Number(item.meal_count), 0)
    const memberBazar = memberBazarList.reduce((sum, item) => sum + Number(item.amount), 0)
    const memberTotalDeposit = memberDepositList.reduce((sum, item) => sum + Number(item.amount), 0)
    
    const memberRoomRentCost = memberRoomRentList.reduce((sum, item) => sum + Number(item.amount), 0)
    const memberPaidFixedCost = memberPaidFixedList.reduce((sum, item) => sum + Number(item.amount), 0)

    const memberTotalGiven = memberTotalDeposit + memberBazar + memberPaidFixedCost
    
    const memberMealCost = memberMeals * mealRate
    const memberTotalCost = memberMealCost + sharedExpensePerMember + memberRoomRentCost
    
    const balance = memberTotalGiven - memberTotalCost

    return {
      totalMessMeals,
      totalMessBazar,
      totalMessFixedExpense: totalSharedFixedExpense,
      mealRate,
      sharedExpensePerMember,
      member: {
        totalMeals: memberMeals,
        totalDeposit: memberTotalDeposit,
        totalBazarPaid: memberBazar,
        memberRoomRentCost,
        memberPaidFixedCost,
        totalGiven: memberTotalGiven,
        mealCost: memberMealCost,
        totalCost: memberTotalCost,
        balance: balance,
        lists: {
          meals: memberMealsList,
          bazar: memberBazarList,
          deposits: memberDepositList,
          fixedExpenses: memberPaidFixedList
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
