'use client'
import { useEffect, useState } from 'react'
import { Activity, Clock, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { ActivityService } from '@/services/activity.service'

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination and Filtering state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20
  
  // Default to current month (YYYY-MM format)
  const [monthStr, setMonthStr] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  })

  const loadLogs = async (currentPage: number, currentMonthStr: string) => {
    setLoading(true)
    try {
      const { data, count } = await ActivityService.getActivities(currentPage, pageSize, currentMonthStr)
      setLogs(data)
      setTotalPages(Math.ceil(count / pageSize) || 1)
    } catch (error) {
      console.error("Failed to load activity logs", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs(page, monthStr)
  }, [page, monthStr])

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonthStr(e.target.value)
    setPage(1) // Reset to page 1 when month changes
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Activity Log
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor actions performed by members</p>
        </div>
        
        {/* Month Filter */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '8px', padding: '0.4rem 0.8rem', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <Calendar size={18} color="var(--primary)" style={{ marginRight: '0.5rem' }} />
          <input 
            type="month" 
            value={monthStr}
            onChange={handleMonthChange}
            style={{ 
              border: 'none', 
              background: 'transparent', 
              outline: 'none', 
              color: 'var(--text-main)', 
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          />
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading activity logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
          <Activity size={48} color="var(--border-light)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No activities found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Try selecting a different month.</p>
        </div>
      ) : (
        <>
          <div style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {logs.map((log) => {
                const logDate = new Date(log.created_at)
                const formattedDate = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                const formattedTime = logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                
                let actionColor = 'var(--text-muted)'
                let badgeBg = 'transparent'
                
                if (log.action_type === 'ADD') { actionColor = 'var(--primary)'; badgeBg = 'rgba(12, 173, 121, 0.1)' }
                else if (log.action_type === 'EDIT') { actionColor = '#3b82f6'; badgeBg = 'rgba(59, 130, 246, 0.1)' }
                else if (log.action_type === 'DELETE') { actionColor = '#ef4444'; badgeBg = 'rgba(239, 68, 68, 0.1)' }
                else if (log.action_type === 'LOGIN') { actionColor = '#8b5cf6'; badgeBg = 'rgba(139, 92, 246, 0.1)' }

                return (
                  <div key={log.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Activity size={18} color={actionColor} />
                    </div>
                    
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          {log.users?.name ? `${log.users.name} (${log.users.email})` : 'Unknown User'}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontSize: '0.8rem' }}>
                          <Clock size={12} />
                          {formattedDate} at {formattedTime}
                        </div>
                      </div>
                      
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                        {log.details}
                      </p>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: badgeBg, color: actionColor, fontWeight: 700 }}>
                          {log.action_type}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.1)', color: '#64748b', fontWeight: 700 }}>
                          {log.entity_type}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="action-btn"
                style={{ padding: '0.5rem', borderRadius: '8px', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={20} />
              </button>
              
              <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>
                Page {page} of {totalPages}
              </span>
              
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="action-btn"
                style={{ padding: '0.5rem', borderRadius: '8px', opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
