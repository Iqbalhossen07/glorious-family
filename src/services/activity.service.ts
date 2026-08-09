import { supabase } from '@/lib/supabase'

export const ActivityService = {
  async logActivity(
    actionType: 'ADD' | 'EDIT' | 'DELETE' | 'LOGIN' | 'REGISTER',
    entityType: 'MEAL' | 'BAZAR' | 'MEMBER' | 'MESS_INFO' | 'DEPOSIT' | 'EXPENSE' | 'AUTH',
    details: string
  ) {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) return // If no user, silently ignore (e.g. during logout)

      const { error } = await supabase
        .from('activity_logs')
        .insert([
          {
            user_id: userData.user.id,
            action_type: actionType,
            entity_type: entityType,
            details: details,
            created_at: new Date().toISOString()
          }
        ])

      if (error) {
        console.error("Failed to log activity:", error)
      }
    } catch (e) {
      console.error("Error in logActivity:", e)
    }
  },

  async getActivities(page = 1, pageSize = 20, monthStr?: string) {
    let query = supabase
      .from('activity_logs')
      .select('*, users(name, email)', { count: 'exact' })

    if (monthStr) {
      // monthStr is expected to be in "YYYY-MM" format
      const [year, month] = monthStr.split('-').map(Number)
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString()
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()
      
      query = query.gte('created_at', startDate).lte('created_at', endDate)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) throw new Error(error.message)
    return { data: data || [], count: count || 0 }
  }
}
