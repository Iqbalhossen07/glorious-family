import { supabase } from '@/lib/supabase'
import { ActivityService } from './activity.service'

export const DepositService = {
  async addDeposit(sessionId: string, userId: string, date: string, amount: number, createdBy: string) {
    const { error } = await supabase
      .from('deposits')
      .insert([
        { 
          session_id: sessionId, 
          user_id: userId,
          date: date,
          amount: amount,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      
    if (error) throw new Error(error.message)
    await ActivityService.logActivity('ADD', 'DEPOSIT', `Added deposit (৳${amount})`)
  },

  async updateDeposit(id: string, date: string, userId: string, amount: number) {
    const { data: userData } = await supabase.auth.getUser()
    const { data: userDetails } = await supabase.from('users').select('name').eq('id', userData?.user?.id).maybeSingle()
    const editorName = userDetails?.name || 'Unknown'

    const { data: existing } = await supabase.from('deposits').select('*').eq('id', id).single()
    if (!existing) throw new Error("Deposit not found")

    let history = existing.edit_history || []
    
    const changes = []
    if (existing.amount !== amount) changes.push(`Amount: ${existing.amount} -> ${amount}`)
    if (existing.date !== date) changes.push(`Date: ${existing.date} -> ${date}`)
    if (existing.user_id !== userId) changes.push(`Member changed`)

    if (changes.length > 0) {
      history.push({
        edited_at: new Date().toISOString(),
        edited_by: editorName,
        changes: changes.join(', ')
      })
    }

    const { error } = await supabase
      .from('deposits')
      .update({
        date: date,
        user_id: userId,
        amount: amount,
        edit_history: history,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      
    if (error) throw new Error(error.message)
    await ActivityService.logActivity('EDIT', 'DEPOSIT', `Updated deposit (৳${amount})`)
  },

  async deleteDeposit(id: string) {
    const { error } = await supabase
      .from('deposits')
      .delete()
      .eq('id', id)
      
    if (error) throw new Error(error.message)
    await ActivityService.logActivity('DELETE', 'DEPOSIT', `Deleted a deposit`)
  },

  async getDepositHistory(sessionId: string) {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('session_id', sessionId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      
    if (error) throw new Error(error.message)
    return data || []
  },

  async getDepositById(id: string) {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) throw new Error(error.message)
    return data
  },

  async getTotalDeposit(sessionId: string) {
    const { data, error } = await supabase
      .from('deposits')
      .select('amount')
      .eq('session_id', sessionId)
      
    if (error) return 0
    
    return data.reduce((acc, curr) => acc + Number(curr.amount), 0)
  }
}
