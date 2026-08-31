'use client'
import { useState, useEffect } from 'react'
import { Settings, User, Lock, Mail, Save } from 'lucide-react'
import { AuthService } from '@/services/auth.service'
import { supabase } from '@/lib/supabase'
import Swal from 'sweetalert2'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setFullName(user.user_metadata?.full_name || 'Iqbal Hossen')
      }
    } catch (err) {}
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updates: any = {
        data: { full_name: fullName }
      }
      
      if (password) {
        updates.password = password
      }

      const { error } = await supabase.auth.updateUser(updates)
      if (error) throw error
      
      Swal.fire('Success', 'Settings updated successfully!', 'success')
      setPassword('') // clear password field
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <Settings size={32} color="#64748b" />
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Admin Settings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your super admin account</p>
        </div>
      </div>

      <div className="minimal-card" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '600px' }}>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="input-group">
            <label className="input-label"><Mail size={16} /> Admin Email (Read Only)</label>
            <input 
              type="email" 
              className="input-field" 
              value={user?.email || 'iqbalhossen0711@gmail.com'} 
              disabled 
              style={{ background: 'var(--bg-main)', cursor: 'not-allowed', color: 'var(--text-muted)' }} 
            />
          </div>

          <div className="input-group">
            <label className="input-label"><User size={16} /> Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Iqbal Hossen"
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label"><Lock size={16} /> New Password (Optional)</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
          >
            {loading ? 'Saving Changes...' : <><Save size={18} /> Save Settings</>}
          </button>
        </form>
      </div>

    </div>
  )
}
