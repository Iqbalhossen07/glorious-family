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
