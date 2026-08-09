import { supabase } from '@/lib/supabase'
import { ActivityService } from './activity.service'

export const MessInfoService = {
  async addInfo(title: string, description: string, userId: string) {
    const { error } = await supabase
      .from('mess_info')
      .insert([
        { 
          title: title,
          description: description,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      
    if (error) throw new Error(error.message)
    await ActivityService.logActivity('ADD', 'MESS_INFO', `Added mess info: ${title}`)
  },

  async updateInfo(id: string, title: string, description: string) {
    const { error } = await supabase
      .from('mess_info')
      .update({
        title: title,
        description: description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      
    if (error) throw new Error(error.message)
    await ActivityService.logActivity('EDIT', 'MESS_INFO', `Updated mess info: ${title}`)
  },

  async deleteInfo(id: string) {
    const { error } = await supabase
      .from('mess_info')
      .delete()
      .eq('id', id)
      
    if (error) throw new Error(error.message)
    await ActivityService.logActivity('DELETE', 'MESS_INFO', `Deleted mess info`)
  },

  async getAllInfo() {
    const { data, error } = await supabase
      .from('mess_info')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) throw new Error(error.message)
    return data || []
  },

  async getInfoById(id: string) {
    const { data, error } = await supabase
      .from('mess_info')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) throw new Error(error.message)
    return data
  }
}
