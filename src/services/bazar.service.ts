import { supabase } from '@/lib/supabase'
import { ActivityService } from './activity.service'

export const BazarService = {
  async addBazar(sessionId: string, userId: string, date: string, itemName: string, amount: number, createdBy: string) {
    const { error } = await supabase
      .from('bazar_expenses')
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
    
    await ActivityService.logActivity('ADD', 'BAZAR', `Added bazar item: ${itemName} (৳${amount})`)
  },

  async updateBazar(id: string, date: string, userId: string, itemName: string, amount: number) {
    const { error } = await supabase
      .from('bazar_expenses')
      .update({
        date: date,
        user_id: userId,
        item_name: itemName,
        amount: amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      
    if (error) throw new Error(error.message)
    
    await ActivityService.logActivity('EDIT', 'BAZAR', `Updated bazar item: ${itemName} (৳${amount})`)
  },

  async deleteBazar(id: string) {
    const { error } = await supabase
      .from('bazar_expenses')
      .delete()
      .eq('id', id)
      
    if (error) throw new Error(error.message)
    
    await ActivityService.logActivity('DELETE', 'BAZAR', `Deleted a bazar expense`)
  },

  async getBazarHistory(sessionId: string) {
    const { data, error } = await supabase
      .from('bazar_expenses')
      .select('*')
      .eq('session_id', sessionId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      
    if (error) throw new Error(error.message)
    return data || []
  },

  async getBazarById(id: string) {
    const { data, error } = await supabase
      .from('bazar_expenses')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) throw new Error(error.message)
    return data
  },

  async getTotalBazar(sessionId: string) {
    const { data, error } = await supabase
      .from('bazar_expenses')
      .select('amount')
      .eq('session_id', sessionId)
      
    if (error) throw new Error(error.message)
    
    return data.reduce((acc, curr) => acc + Number(curr.amount), 0)
  }
}
