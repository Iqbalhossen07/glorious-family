import { supabase } from '@/lib/supabase'
import { AuthService } from './auth.service'

export const SessionService = {
  async getCurrentSession() {
    const user = await AuthService.getCurrentUser()
    if (!user || !user.mess_id) return null

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('mess_id', user.mess_id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching current session:', error)
      return null
    }
    
    return data
  },

  async getLatestSession() {
    const user = await AuthService.getCurrentUser()
    if (!user || !user.mess_id) return null

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('mess_id', user.mess_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching latest session:', error)
      return null
    }
    
    return data
  },

  async getAllSessions() {
    const user = await AuthService.getCurrentUser()
    if (!user || !user.mess_id) return []

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('mess_id', user.mess_id)
      .order('created_at', { ascending: false })
      
    if (error) {
      console.error('Error fetching all sessions:', error)
      return []
    }
    
    return data
  },

  async getSessionById(sessionId: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
      
    if (error) throw new Error(error.message)
    return data
  },

  async createSession(sessionName: string, userId: string) {
    const user = await AuthService.getCurrentUser()
    if (!user || !user.mess_id) throw new Error("No mess found for user")

    const { error } = await supabase
      .from('sessions')
      .insert([
        { 
          session_name: sessionName, 
          start_date: new Date().toISOString().split('T')[0],
          status: 'open',
          created_by: userId,
          mess_id: user.mess_id
        }
      ])
      
    if (error) throw new Error(error.message)
  },

  async closeSession(sessionId: string, settlements: { user_id: string, amount: number, type: 'payable' | 'receivable' }[]) {
    // 1. Insert settlements if there are any
    if (settlements.length > 0) {
      const formattedSettlements = settlements.map(s => ({
        session_id: sessionId,
        user_id: s.user_id,
        amount: s.amount,
        type: s.type,
        status: 'pending'
      }))

      const { error: settlementError } = await supabase
        .from('settlements')
        .insert(formattedSettlements)

      if (settlementError) throw new Error(settlementError.message)
    }

    // 2. Update session status to closed only if settlements inserted successfully
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ 
        status: 'closed',
        end_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', sessionId)
      
    if (sessionError) throw new Error(sessionError.message)
  },

  async reopenSession(sessionId: string) {
    // 1. Delete all settlements for this session
    const { error: deleteError } = await supabase
      .from('settlements')
      .delete()
      .eq('session_id', sessionId)

    if (deleteError) throw new Error(deleteError.message)

    // 2. Update session status back to open and clear end_date
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ 
        status: 'open',
        end_date: null
      })
      .eq('id', sessionId)
      
    if (sessionError) throw new Error(sessionError.message)
  }
}
