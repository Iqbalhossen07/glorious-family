import { supabase } from '@/lib/supabase'

export const SettlementService = {
  async getSettlementsBySession(sessionId: string) {
    const { data, error } = await supabase
      .from('settlements')
      .select('*, user:users(name)')
      .eq('session_id', sessionId)
      .order('type', { ascending: false }) // Group payables/receivables
      
    if (error) throw new Error(error.message)
    return data || []
  },

  async getMySettlements(userId: string) {
    const { data, error } = await supabase
      .from('settlements')
      .select('*, session:sessions(session_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      
    if (error) throw new Error(error.message)
    return data || []
  },

  async clearSettlement(id: string) {
    const { error } = await supabase
      .from('settlements')
      .update({ 
        status: 'cleared',
        cleared_at: new Date().toISOString()
      })
      .eq('id', id)
      
    if (error) throw new Error(error.message)
  }
}
