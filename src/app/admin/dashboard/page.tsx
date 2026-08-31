'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Building, Users, AlertTriangle, CheckCircle, Ban, Trash2 } from 'lucide-react'
import { AuthService } from '@/services/auth.service'
import Swal from 'sweetalert2'

export default function SuperAdminPage() {
  const [loading, setLoading] = useState(true)
  const [messes, setMesses] = useState<any[]>([])
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [adminName, setAdminName] = useState('Iqbal Hossen')

  const router = useRouter()

  useEffect(() => {
    checkAccessAndLoadData()
  }, [])

  const checkAccessAndLoadData = async () => {
    try {
      const user = await AuthService.getCurrentUser()
      // Hardcode Iqbal's email for super admin access
      if (user?.email === 'iqbalhossen0711@gmail.com') {
        setIsAuthorized(true)
        setAdminName(user?.user_metadata?.full_name || 'Iqbal Hossen')
        await fetchMesses()
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error(error)
      router.push('/admin/login')
    }
  }

  const fetchMesses = async () => {
    try {
      const res = await fetch('/api/admin/messes')
      const data = await res.json()
      if (data.messes) {
        setMesses(data.messes)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (messId: string, currentStatus: boolean, messName: string) => {
    const actionText = currentStatus ? 'Suspend' : 'Activate'
    
    const result = await Swal.fire({
      title: `${actionText} ${messName}?`,
      text: currentStatus ? "Members of this mess will not be able to log in." : "Members will regain access to this mess.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#ef4444' : '#10b981',
      confirmButtonText: `Yes, ${actionText}`
    })

    if (result.isConfirmed) {
      try {
        Swal.showLoading()
        const res = await fetch('/api/admin/messes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messId, is_active: !currentStatus })
        })
        
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        
        Swal.fire('Success', `Mess ${actionText}d Successfully`, 'success')
        fetchMesses() // Reload data
      } catch (error: any) {
        Swal.fire('Error', error.message || 'Failed to update status', 'error')
      }
    }
  }

  const handleDeleteMess = async (messId: string, messName: string) => {
    const { value: typedName } = await Swal.fire({
      title: 'Delete Mess Permanently?',
      text: `This action cannot be undone. All users, expenses, meals, and deposits for this mess will be destroyed. Type "${messName}" to confirm.`,
      input: 'text',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Permanently Delete',
      inputValidator: (value) => {
        if (value !== messName) {
          return 'You must type the exact mess name to confirm!'
        }
      }
    })

    if (typedName === messName) {
      try {
        Swal.showLoading()
        const res = await fetch(`/api/admin/messes?id=${messId}`, {
          method: 'DELETE'
        })
        const data = await res.json()
        
        if (data.error) throw new Error(data.error)

        await fetchMesses()
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'The mess has been completely removed from the database.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        })
      } catch (error: any) {
        Swal.fire('Error', error.message || 'Failed to delete mess', 'error')
      }
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading Super Admin Panel...</div>

  if (!isAuthorized) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <AlertTriangle size={64} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Access Denied</h1>
        <p style={{ color: 'var(--text-muted)' }}>This area is restricted to Super Administrators only.</p>
      </div>
    )
  }

  const totalMesses = messes.length
  const activeMesses = messes.filter(m => m.is_active).length
  const totalUsers = messes.reduce((acc, curr) => acc + curr.memberCount, 0)

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      {/* Welcome Banner */}
      <div className="minimal-card" style={{ 
        marginBottom: '2rem', 
        padding: '2rem', 
        borderRadius: '16px', 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <Shield size={36} color="var(--primary)" />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Welcome back, {adminName}!
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0, paddingLeft: '3.25rem' }}>
          Here's what's happening across all your SaaS tenants today.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="minimal-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Messes</span>
            <Building size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalMesses}</div>
          <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, marginTop: '0.2rem' }}>{activeMesses} Active</div>
        </div>

        <div className="minimal-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Users</span>
            <Users size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalUsers}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Across all messes</div>
        </div>
      </div>

      {/* Mess List */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>All Registered Messes</h2>
      
      <div className="minimal-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>MESS DETAILS</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>MANAGER</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>MEMBERS</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {messes.map((mess) => (
                <tr key={mess.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem', fontSize: '1.05rem' }}>{mess.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code: <strong>{mess.join_code}</strong></div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{mess.managerName}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{mess.managerEmail}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                    {mess.memberCount}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    {mess.is_active ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                        <CheckCircle size={14} /> Active
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                        <Ban size={14} /> Suspended
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleToggleStatus(mess.id, mess.is_active, mess.name)}
                        className={mess.is_active ? "btn btn-outline" : "btn btn-primary"}
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                      >
                        {mess.is_active ? 'Suspend' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => handleDeleteMess(mess.id, mess.name)}
                        className="btn"
                        style={{ padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        title="Delete Mess"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
