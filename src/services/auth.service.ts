import { supabase } from '@/lib/supabase'
import { ActivityService } from './activity.service'

export const AuthService = {
  /**
   * Register a new user
   */
  async register(name: string, email: string, password: string) {
    // 1. Create user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
        }
      }
    })

    if (authError) throw new Error(authError.message)

    if (authData.user) {
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        
      const role = (count === 0) ? 'manager' : 'member'

      const { error: dbError } = await supabase
        .from('users')
        .insert([
          { id: authData.user.id, name: name, email: email, role: role }
        ])
      
      if (dbError && dbError.code !== '23505') {
        throw new Error(dbError.message)
      }
    }

    return authData
  },

  /**
   * Login a user
   */
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) throw new Error(error.message)
    
    // Fire and forget log
    await ActivityService.logActivity('LOGIN', 'AUTH', `Logged in to the system`)
    
    return data
  },

  /**
   * Logout current user
   */
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },

  /**
   * Send reset password email
   */
  async resetPasswordForEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) throw new Error(error.message)
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw new Error(error.message)
    return data.session
  },

  /**
   * Get current user profile with mess info
   */
  async getCurrentUser() {
    const session = await this.getSession()
    if (!session?.user) return null
    
    const { data, error } = await supabase
      .from('users')
      .select('*, messes(*)')
      .eq('id', session.user.id)
      .single()
      
    if (error) throw new Error(error.message)
    return data
  },

  async updateProfile(userId: string, name: string, email: string) {
    const response = await fetch('/api/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name, email })
    })
    
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)

    await ActivityService.logActivity('EDIT', 'AUTH', `Updated profile (Name: ${name})`)
  },

  /**
   * Update Password
   */
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    
    if (error) throw new Error(error.message)
    
    await ActivityService.logActivity('EDIT', 'AUTH', `Updated password`)
  }
}
