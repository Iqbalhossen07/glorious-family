'use client'
import { useEffect, useState } from 'react'
import { Shield, Building, Users, AlertTriangle, CheckCircle, Ban } from 'lucide-react'
import { AuthService } from '@/services/auth.service'
import Swal from 'sweetalert2'

export default function SuperAdminPage() {
  const [loading, setLoading] = useState(true)
  const [messes, setMesses] = useState<any[]>([])
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    checkAccessAndLoadData()
  }, [])

  const checkAccessAndLoadData = async () => {
    try {
      const user = await AuthService.getCurrentUser()
      // Hardcode Iqbal's email for super admin access
      if (user?.email === 'iqbalhossen0711@gmail.com') {
        setIsAuthorized(true)
        await fetchMesses()
      } else {
        setIsAuthorized(false)
        setLoading(false)
      }
    } catch (error) {
      console.error(error)
      setLoading(false)
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
        Swal.fire('Error', error.message, 'error')
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
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <Shield size={32} color="var(--primary)" />
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Super Admin</h1>
          <p style={{ color: 'var(--text-muted)' }}>Control panel for all SaaS tenants</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Messes</span>
            <Building size={20} className="stat-icon" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value">{totalMesses}</div>
          <div className="stat-desc" style={{ color: '#10b981' }}>{activeMesses} Active</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Users</span>
            <Users size={20} className="stat-icon" style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-desc">Across all messes</div>
        </div>
      </div>

      {/* Mess List */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>All Registered Messes</h2>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>MESS DETAILS</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>MANAGER</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>MEMBERS</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {messes.map((mess) => (
                <tr key={mess.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>{mess.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code: <strong>{mess.join_code}</strong></div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{mess.managerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mess.managerEmail}</div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>
                    {mess.memberCount}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {mess.is_active ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                        <CheckCircle size={14} /> Active
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                        <Ban size={14} /> Suspended
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleToggleStatus(mess.id, mess.is_active, mess.name)}
                      className={mess.is_active ? "btn btn-outline" : "btn btn-primary"}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      {mess.is_active ? 'Suspend' : 'Activate'}
                    </button>
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
