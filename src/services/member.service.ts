import { supabase } from '@/lib/supabase'
import { ActivityService } from './activity.service'
import { AuthService } from './auth.service'

export const MemberService = {
  async getAllMembers() {
    const currentUser = await AuthService.getCurrentUser()
    if (!currentUser || !currentUser.mess_id) return []

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('mess_id', currentUser.mess_id)
      .order('created_at', { ascending: true })
      
    if (error) {
      throw new Error(error.message)
    }
    
    const members = data || []
    
    // Sort so that manager always appears first
    return members.sort((a, b) => {
      if (a.role === 'manager' && b.role !== 'manager') return -1
      if (a.role !== 'manager' && b.role === 'manager') return 1
      return 0
    })
  },

  async getMembersForSession(session: any) {
    if (!session) return []

    const allMembers = await this.getAllMembers()
    
    const sessionDate = new Date(session.start_date)
    const endOfMonth = new Date(sessionDate.getFullYear(), sessionDate.getMonth() + 1, 0, 23, 59, 59, 999)

    // Fetch all user IDs with activity in this session
    const [mealsRes, bazarRes, depositsRes, fixedRes] = await Promise.all([
      supabase.from('daily_meals').select('user_id').eq('session_id', session.id),
      supabase.from('bazar_expenses').select('user_id').eq('session_id', session.id),
      supabase.from('deposits').select('user_id').eq('session_id', session.id),
      supabase.from('fixed_expenses').select('user_id').eq('session_id', session.id)
    ])

    const activeInSessionIds = new Set([
      ...(mealsRes.data?.map((m: any) => m.user_id) || []),
      ...(bazarRes.data?.map((b: any) => b.user_id) || []),
      ...(depositsRes.data?.map((d: any) => d.user_id) || []),
      ...(fixedRes.data?.map((f: any) => f.user_id) || [])
    ])

    const filtered = allMembers.filter((m: any) => {
      const memberCreatedDate = new Date(m.created_at)
      // Member must have been created on or before the end of the session month
      if (memberCreatedDate > endOfMonth) {
        return false
      }

      // If member has any activity in this session, always include (even if currently inactive)
      if (activeInSessionIds.has(m.id)) {
        return true
      }

      // If session is closed, only include members with activity
      if (session.status === 'closed') {
        return false
      }

      // In open sessions, include currently active members
      return m.status === 'active'
    })

    return filtered.sort((a: any, b: any) => {
      if (a.role === 'manager' && b.role !== 'manager') return -1
      if (a.role !== 'manager' && b.role === 'manager') return 1
      return 0
    })
  },

  async toggleMemberStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId)
      
    if (error) {
      throw new Error(error.message)
    }
    
    await ActivityService.logActivity('EDIT', 'MEMBER', `Changed member status to ${newStatus}`)
    return newStatus
  },

  async transferManagerRole(currentManagerId: string, newManagerId: string) {
    // 1. Demote current manager
    const { error: error1 } = await supabase
      .from('users')
      .update({ role: 'member' })
      .eq('id', currentManagerId)
      
    if (error1) throw new Error(error1.message)
    
    // 2. Promote new manager
    const { error: error2 } = await supabase
      .from('users')
      .update({ role: 'manager' })
      .eq('id', newManagerId)
      
    if (error2) throw new Error(error2.message)
    
    await ActivityService.logActivity('EDIT', 'MEMBER', 'Manager role transferred')
  }
}
