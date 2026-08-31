import { supabase } from '@/lib/supabase'

export const MessService = {
  async createMess(name: string, address: string, userId: string) {
    // Generate a random join code
    const joinCode = 'MESS-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const { data, error } = await supabase
      .from('messes')
      .insert([{
        name,
        address,
        join_code: joinCode,
        manager_id: userId
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)
    
    // Update user's mess_id and role
    await supabase.from('users').update({ mess_id: data.id, role: 'manager' }).eq('id', userId)
    
    return data
  },

  async joinMess(joinCode: string, userId: string) {
    // Find mess by join code
    const { data: mess, error: searchError } = await supabase
      .from('messes')
      .select('*')
      .eq('join_code', joinCode.toUpperCase())
      .single()

    if (searchError || !mess) throw new Error('Invalid Join Code. No mess found.')
    if (!mess.is_active) throw new Error('This mess is currently inactive.')

    // Update user's mess_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ mess_id: mess.id, role: 'member' })
      .eq('id', userId)

    if (updateError) throw new Error(updateError.message)
    
    return mess
  },

  async updateMess(messId: string, updates: { name?: string, address?: string }) {
    const { data, error } = await supabase
      .from('messes')
      .update(updates)
      .eq('id', messId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}
