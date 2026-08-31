'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock } from 'lucide-react'
import { AuthService } from '@/services/auth.service'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Restrict login to the super admin email only
    if (email !== 'iqbalhossen0711@gmail.com') {
      setError('Access Denied. Only Super Admin can login here.')
      setLoading(false)
      return
    }

    try {
      const { user } = await AuthService.login(email, password)
      if (user?.email === 'iqbalhossen0711@gmail.com') {
        router.push('/admin/dashboard')
      } else {
        await AuthService.logout()
        setError('Unauthorized')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '1.5rem' }}>
      
      <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <Shield size={48} color="#ef4444" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111827' }}>Super Admin Portal</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>Log in to manage the SaaS platform</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          {error && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ fontSize: '0.85rem' }}>Admin Email</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '12px', background: 'var(--bg-main)', padding: '0 1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
              <Mail size={18} color="var(--text-muted)" />
              <input 
                type="email" 
                className="input-field"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bdmess.com"
                required
                style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ fontSize: '0.85rem' }}>Password</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '12px', background: 'var(--bg-main)', padding: '0 1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
              <Lock size={18} color="var(--text-muted)" />
              <input 
                type="password" 
                className="input-field"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '1rem', background: '#ef4444', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
            }}
          >
            {loading ? 'Authenticating...' : <><Shield size={18} /> Login as Admin</>}
          </button>
        </form>
      </div>

    </div>
  )
}
