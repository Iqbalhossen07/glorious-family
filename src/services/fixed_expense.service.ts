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
    const { data: userData } = await supabase.auth.getUser()
    const { data: userDetails } = await supabase.from('users').select('name').eq('id', userData?.user?.id).maybeSingle()
    const editorName = userDetails?.name || 'Unknown'

    const { data: existing } = await supabase.from('fixed_expenses').select('*').eq('id', id).single()
    if (!existing) throw new Error("Expense not found")

    let history = existing.edit_history || []
    
    const changes = []
    if (existing.amount !== amount) changes.push(`Amount: ${existing.amount} -> ${amount}`)
    if (existing.item_name !== itemName) changes.push(`Item: ${existing.item_name} -> ${itemName}`)
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
      .from('fixed_expenses')
      .update({
        date: date,
        user_id: userId,
        item_name: itemName,
        amount: amount,
        edit_history: history,
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
