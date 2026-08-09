'use client'
import { useEffect, useState } from 'react'
import { UserPlus, Mail, ShieldCheck, Star, Power, PowerOff, Crown } from 'lucide-react'
import { MemberService } from '@/services/member.service'
import { AuthService } from '@/services/auth.service'
import Swal from 'sweetalert2'

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const authSession = await AuthService.getSession()
        if (authSession?.user?.id) {
          const membersData = await MemberService.getAllMembers()
          setMembers(membersData)
          
          const current = membersData.find(m => m.id === authSession.user.id)
          setCurrentUser(current)
        }
      } catch (error) {
        console.error("Error loading members:", error)
      } finally {
        setLoading(false)
      }
    }
    loadMembers()
  }, [])

  const handleAddMember = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Add New Member',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Member Name" style="width: 80%; font-size: 1rem;">
        <input id="swal-input2" type="email" class="swal2-input" placeholder="Email Address" style="width: 80%; font-size: 1rem;">
        <input id="swal-input3" type="password" class="swal2-input" placeholder="Password (min 6 chars)" style="width: 80%; font-size: 1rem;">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: 'var(--primary)',
      confirmButtonText: 'Add Member',
      preConfirm: () => {
        const name = (document.getElementById('swal-input1') as HTMLInputElement).value
        const email = (document.getElementById('swal-input2') as HTMLInputElement).value
        const password = (document.getElementById('swal-input3') as HTMLInputElement).value
        
        if (!name || !email || !password) {
          Swal.showValidationMessage('Please fill out all fields')
          return false
        }
        if (password.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters')
          return false
        }
        return { name, email, password }
      }
    })

    if (formValues) {
      try {
        Swal.showLoading()
        const response = await fetch('/api/add-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formValues)
        })
        
        const data = await response.json()
        
        if (!response.ok) throw new Error(data.error)
        
        await Swal.fire('Success!', `${formValues.name} has been added.`, 'success')
        
        // Reload members
        const updatedMembers = await MemberService.getAllMembers()
        setMembers(updatedMembers)
        
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error')
      }
    }
  }

  const handleToggleStatus = async (member: any) => {
    const action = member.status === 'active' ? 'Deactivate' : 'Activate'
    const confirmResult = await Swal.fire({
      title: `${action} Member?`,
      text: `Are you sure you want to ${action.toLowerCase()} ${member.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: member.status === 'active' ? '#ef4444' : '#10b981',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: `Yes, ${action}`
    })

    if (confirmResult.isConfirmed) {
      try {
        Swal.showLoading()
        await MemberService.toggleMemberStatus(member.id, member.status || 'active')
        
        const updatedMembers = await MemberService.getAllMembers()
        setMembers(updatedMembers)
        
        Swal.fire('Success', `${member.name} is now ${member.status === 'active' ? 'inactive' : 'active'}.`, 'success')
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error')
      }
    }
  }

  const handleMakeManager = async (member: any) => {
    if (!currentUser) return
    const confirmResult = await Swal.fire({
      title: 'Transfer Manager Role?',
      text: `Are you sure you want to make ${member.name} the new Manager? You will be demoted to a regular member and lose manager privileges.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Yes, Make Manager'
    })

    if (confirmResult.isConfirmed) {
      try {
        Swal.showLoading()
        await MemberService.transferManagerRole(currentUser.id, member.id)
        Swal.fire('Success', `${member.name} is now the Manager. Please log in again.`, 'success')
        await AuthService.logout()
        window.location.href = '/login'
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error')
      }
    }
  }

  const handleResetPassword = async (member: any) => {
    const confirmResult = await Swal.fire({
      title: 'Reset Password?',
      text: `Are you sure you want to reset ${member.name}'s password to '123456'?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Yes, Reset Password'
    })

    if (confirmResult.isConfirmed) {
      try {
        Swal.showLoading()
        const response = await fetch('/api/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: member.id, newPassword: '123456' })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        
        Swal.fire('Success', `${member.name}'s password has been reset to '123456'`, 'success')
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error')
      }
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading members...</div>
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.2rem' }}>Members</h1>
          <p style={{ color: 'var(--text-muted)' }}>{members.length} people in the mess</p>
        </div>
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
          <button onClick={handleAddMember} className="btn btn-primary quick-action-btn" style={{ padding: '0.8rem 1.25rem' }}>
            <UserPlus size={16} style={{ marginRight: '0.4rem' }} /> Add Member
          </button>
        )}
      </div>

      <div className="members-grid">
        {members.map((member) => (
          <div key={member.id} className="minimal-card" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
            
            <div style={{
              width: '45px',
              height: '45px',
              minWidth: '45px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.2rem',
              boxShadow: '0 2px 8px rgba(12, 173, 121, 0.3)'
            }}>
              {member.name.charAt(0).toUpperCase()}
            </div>
            
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {member.name}
                </h3>
                {member.status !== 'active' && (
                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#fee2e2', color: '#ef4444', fontWeight: 600 }}>
                    INACTIVE
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                <Mail size={12} />
                <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</span>
              </div>
            </div>

            {(member.role === 'manager' || member.role === 'admin') && (
              <div 
                title="Manager" 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottomLeftRadius: '8px',
                  borderTopRightRadius: 'inherit',
                  boxShadow: '-2px 2px 8px rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Crown size={14} fill="currentColor" /> Manager
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'center', marginLeft: 'auto' }}>
              <button 
                onClick={() => window.location.href = `/dashboard/members/${member.id}`}
                className="action-btn action-btn-view"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: '100%' }}
              >
                View Profile
              </button>

              {currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager') && currentUser.id !== member.id && (
                <>
                  <button 
                    onClick={() => handleToggleStatus(member)}
                    className="action-btn"
                    style={{ 
                      padding: '0.4rem 0.8rem', 
                      fontSize: '0.8rem', 
                      width: '100%',
                      background: member.status === 'active' ? '#fee2e2' : '#d1fae5',
                      color: member.status === 'active' ? '#ef4444' : '#10b981',
                      border: 'none'
                    }}
                  >
                    {member.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <button 
                    onClick={() => handleMakeManager(member)}
                    className="action-btn"
                    style={{ 
                      padding: '0.4rem 0.8rem', 
                      fontSize: '0.8rem', 
                      width: '100%',
                      background: '#fef3c7',
                      color: '#d97706',
                      border: 'none'
                    }}
                  >
                    Make Manager
                  </button>

                  <button 
                    onClick={() => handleResetPassword(member)}
                    className="action-btn"
                    style={{ 
                      padding: '0.4rem 0.8rem', 
                      fontSize: '0.8rem', 
                      width: '100%',
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: 'none'
                    }}
                  >
                    Reset Password
                  </button>
                </>
              )}
            </div>
            
          </div>
        ))}
      </div>

    </div>
  )
}
