import { supabase } from '@/lib/supabase'
import { ActivityService } from './activity.service'

export const FixedExpenseService = {
  async addFixedExpense(sessionId: string, userId: string | null, date: string, itemName: string, amount: number, createdBy: string) {
    const { error } = await supabase
      .from('fixed_expenses')
      .insert([
        { 
          session_id: sessionId, 
          user_id: userId,
          date: date,
          item_name: itemName,
          amount: amount,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      
    if (error) throw new Error(error.message)
    await ActivityService.logActivity('ADD', 'EXPENSE', `Added other expense: ${itemName} (৳${amount})`)
  },

  async updateFixedExpense(id: string, date: string, userId: string | null, itemName: string, amount: number) {
    const { error } = await supabase
      .from('fixed_expenses')
      .update({
        date: date,
        user_id: userId,
        item_name: itemName,
        amount: amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      
    if (error) throw new Error(error.message)
    await ActivityService.logActivity('EDIT', 'EXPENSE', `Updated other expense: ${itemName} (৳${amount})`)
  },

  async deleteFixedExpense(id: string) {
    const { error } = await supabase
      .from('fixed_expenses')
      .delete()
      .eq('id', id)
      
    if (error) throw new Error(error.message)
    await ActivityService.logActivity('DELETE', 'EXPENSE', `Deleted an expense`)
  },

  async getFixedExpenseHistory(sessionId: string) {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('session_id', sessionId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      
    if (error) throw new Error(error.message)
    return data || []
  },

  async getFixedExpenseById(id: string) {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) throw new Error(error.message)
    return data
  }
}
