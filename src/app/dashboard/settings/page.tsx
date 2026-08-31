'use client'
import { useEffect, useState } from 'react'
import { User, Mail, Lock, Save, Building, MapPin, Key } from 'lucide-react'
import { AuthService } from '@/services/auth.service'
import { MemberService } from '@/services/member.service'
import { MessService } from '@/services/mess.service'
import Swal from 'sweetalert2'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Profile State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Password State
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [dbUser, setDbUser] = useState<any>(null)
  
  // Mess Settings State
  const [messName, setMessName] = useState('')
  const [messAddress, setMessAddress] = useState('')
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const authSession = await AuthService.getSession()
        const currentUserData = await AuthService.getCurrentUser()
        
        if (authSession?.user && currentUserData) {
          setUser(authSession.user)
          setDbUser(currentUserData)
          setName(currentUserData.name)
          setEmail(currentUserData.email)
          
          if (currentUserData.role === 'manager' && currentUserData.messes) {
            setMessName(currentUserData.messes.name || '')
            setMessAddress(currentUserData.messes.address || '')
            setJoinCode(currentUserData.messes.join_code || '')
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!name || !email) {
      Swal.fire('Error', 'Name and Email are required.', 'error')
      return
    }

    try {
      Swal.showLoading()
      await AuthService.updateProfile(user.id, name, email)
      Swal.fire('Success', 'Profile updated successfully. If you changed your email, you may need to verify it.', 'success')
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error')
    }
  }

  const handleUpdateMess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messName) {
      Swal.fire('Error', 'Mess Name is required.', 'error')
      return
    }

    try {
      Swal.showLoading()
      await MessService.updateMess(dbUser.mess_id, { name: messName, address: messAddress })
      Swal.fire('Success', 'Mess settings updated successfully.', 'success')
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error')
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || password !== confirmPassword) {
      Swal.fire('Error', 'Passwords do not match.', 'error')
      return
    }
    if (password.length < 6) {
      Swal.fire('Error', 'Password must be at least 6 characters.', 'error')
      return
    }

    try {
      Swal.showLoading()
      await AuthService.updatePassword(password)
      Swal.fire('Success', 'Password updated successfully.', 'success')
      setPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error')
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading settings...</div>
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem', maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal information</p>
      </div>

      {/* Mess Settings Section (Manager Only) */}
      {dbUser?.role === 'manager' && (
        <div style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={20} color="var(--primary)" /> Mess Settings
          </h2>
          
          <div style={{ background: 'rgba(12, 173, 121, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px dashed var(--primary)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Your Mess Join Code (Share with members)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={20} /> {joinCode}
            </div>
          </div>

          <form onSubmit={handleUpdateMess}>
            <div className="input-group">
              <label className="input-label">Mess Name</label>
              <div style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '0 1rem' }}>
                <Building size={18} color="var(--text-muted)" />
                <input 
                  type="text" 
                  className="input-field"
                  value={messName} 
                  onChange={(e) => setMessName(e.target.value)}
                  placeholder="e.g. Super Boys Hostel"
                  style={{ border: 'none', boxShadow: 'none' }}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Address (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '0 1rem' }}>
                <MapPin size={18} color="var(--text-muted)" />
                <input 
                  type="text" 
                  className="input-field"
                  value={messAddress} 
                  onChange={(e) => setMessAddress(e.target.value)}
                  placeholder="e.g. Dhanmondi, Dhaka"
                  style={{ border: 'none', boxShadow: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary submit-btn" style={{ padding: '0.7rem 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} /> Save Mess Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Update Section */}
      <div style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={20} color="var(--primary)" /> Profile Details
        </h2>
        
        <form onSubmit={handleUpdateProfile}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '0 1rem' }}>
              <User size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                className="input-field"
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                style={{ border: 'none', boxShadow: 'none' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '0 1rem' }}>
              <Mail size={18} color="var(--text-muted)" />
              <input 
                type="email" 
                className="input-field"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={{ border: 'none', boxShadow: 'none' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary submit-btn" style={{ padding: '0.7rem 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> Update Profile
            </button>
          </div>
        </form>
      </div>

      {/* Password Update Section */}
      <div style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={20} color="var(--primary)" /> Change Password
        </h2>
        
        <form onSubmit={handleUpdatePassword}>
          <div className="input-group">
            <label className="input-label">New Password</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '0 1rem' }}>
              <Lock size={18} color="var(--text-muted)" />
              <input 
                type="password" 
                className="input-field"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                style={{ border: 'none', boxShadow: 'none' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '0 1rem' }}>
              <Lock size={18} color="var(--text-muted)" />
              <input 
                type="password" 
                className="input-field"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{ border: 'none', boxShadow: 'none' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary submit-btn" style={{ padding: '0.7rem 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> Update Password
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}
