'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, Eye, EyeOff, Key } from 'lucide-react'
import { AuthService } from '@/services/auth.service'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

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
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at top, #1f2235 0%, #0f111a 100%)', 
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(239, 68, 68, 0.15)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(59, 130, 246, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.03)', 
        width: '100%', 
        maxWidth: '420px', 
        borderRadius: '24px', 
        padding: '2.5rem', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ 
          display: 'inline-flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.05) 100%)',
          padding: '1rem',
          borderRadius: '20px',
          border: '1px solid rgba(239,68,68,0.2)'
        }}>
          <Shield size={42} color="#ef4444" style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' }} />
        </div>
        
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff', letterSpacing: '-0.5px' }}>Super Admin</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>Secure SaaS Management Portal</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          {error && (
            <div style={{ 
              color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', 
              padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', 
              textAlign: 'center', fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)' 
            }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, paddingLeft: '0.2rem' }}>Admin Email</label>
            <div style={{ 
              display: 'flex', alignItems: 'center', borderRadius: '12px', 
              background: 'rgba(0,0,0,0.3)', padding: '0 1rem', 
              border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s ease',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <Mail size={18} color="rgba(255,255,255,0.4)" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bdmess.com"
                required
                style={{ 
                  border: 'none', boxShadow: 'none', background: 'transparent', 
                  color: '#fff', padding: '0.8rem 1rem', width: '100%', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, paddingLeft: '0.2rem' }}>Master Password</label>
            <div style={{ 
              display: 'flex', alignItems: 'center', borderRadius: '12px', 
              background: 'rgba(0,0,0,0.3)', padding: '0 1rem', 
              border: '1px solid rgba(255,255,255,0.1)', position: 'relative',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <Key size={18} color="rgba(255,255,255,0.4)" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ 
                  border: 'none', boxShadow: 'none', background: 'transparent', 
                  color: '#fff', padding: '0.8rem 1rem', width: '100%', outline: 'none',
                  letterSpacing: showPassword ? 'normal' : '2px'
                }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
              >
                {showPassword ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.4)" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '1.5rem', 
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
              color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', 
              fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', 
              transition: 'all 0.2s', opacity: loading ? 0.8 : 1, 
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
            }}
          >
            {loading ? 'Authenticating...' : <><Shield size={18} /> Authenticate as Admin</>}
          </button>
        </form>
      </div>
    </div>
  )
}
