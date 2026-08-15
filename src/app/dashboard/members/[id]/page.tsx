'use client'
import { useEffect, useState, use } from 'react'
import { Activity, Calendar, Wallet, ShoppingCart, Utensils, Receipt, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react'
import { AnalyticsService } from '@/services/analytics.service'
import { MemberService } from '@/services/member.service'
import { SessionService } from '@/services/session.service'
import { useRouter } from 'next/navigation'

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  // Unwrap params using React.use()
  const resolvedParams = use(params)
  const memberId = resolvedParams.id
  
  const [member, setMember] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Default to current month
  const [monthStr, setMonthStr] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    const fetchMember = async () => {
      const allMembers = await MemberService.getAllMembers()
      const m = allMembers.find(x => x.id === memberId)
      if (m) setMember(m)
    }
    fetchMember()
  }, [memberId])

  const loadData = async (currentMonthStr: string) => {
    setLoading(true)
    try {
      const allSessions = await SessionService.getAllSessions()
      const dateObj = new Date(currentMonthStr + '-01')
      const targetSessionName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      let targetSession = allSessions.find(s => s.session_name === targetSessionName)
      if (!targetSession && allSessions.length > 0) {
        targetSession = allSessions[0]
      }
      
      setSession(targetSession)

      if (targetSession) {
        const [analyticsData, activityData] = await Promise.all([
          AnalyticsService.getMemberAnalytics(targetSession.id, memberId, currentMonthStr),
          AnalyticsService.getMemberActivityLogs(memberId, currentMonthStr)
        ])
        setAnalytics(analyticsData)
        setActivities(activityData)
      } else {
        setAnalytics(null)
        setActivities([])
      }
    } catch (error) {
      console.error("Failed to load analytics", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(monthStr)
  }, [monthStr, memberId])

  if (loading && !analytics) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading member profile...</div>
  }

  if (!member) {
    return <div style={{ color: 'var(--text-muted)' }}>Member not found.</div>
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.push('/dashboard/members')} className="action-btn" style={{ padding: '0.5rem', borderRadius: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
              {member.name}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>{member.name} • {member.role === 'manager' ? 'Manager' : 'Member'}</p>
          </div>
        </div>
        
        {/* Month Filter */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '8px', padding: '0.4rem 0.8rem', border: '1px solid rgba(0,0,0,0.1)' }}>
          <Calendar size={18} color="var(--primary)" style={{ marginRight: '0.5rem' }} />
          <input 
            type="month" 
            value={monthStr}
            onChange={(e) => setMonthStr(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {analytics && (
        <>
          {/* Main Balance Card */}
          <div style={{ 
            background: analytics.member.balance >= 0 ? 'linear-gradient(135deg, #0cad79 0%, #059669 100%)' : 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', 
            borderRadius: '16px', padding: '2rem', color: '#fff', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                  {analytics.member.balance >= 0 ? 'Refundable Amount (Pabe)' : 'Due Amount (Dibe)'}
                </p>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
                  ৳ {Math.abs(analytics.member.balance).toFixed(2)}
                </h2>
              </div>
              <div>
                {analytics.member.balance >= 0 ? <TrendingUp size={36} opacity={0.8} /> : <TrendingDown size={36} opacity={0.8} />}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div>
                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Given</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>৳ {analytics.member.totalGiven.toFixed(2)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Cost</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>৳ {analytics.member.totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Calculation Formula</h4>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Meal Cost ({analytics.member.totalMeals} * ৳{analytics.mealRate.toFixed(2)})</span>
                <span>৳ {analytics.member.mealCost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shared Other Cost</span>
                <span>৳ {analytics.sharedExpensePerMember.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Room Rent</span>
                <span>৳ {analytics.member.memberRoomRentCost?.toFixed(2) || '0.00'}</span>
              </div>
              {analytics.member.memberPersonalCost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Personal Other Cost</span>
                  <span>৳ {analytics.member.memberPersonalCost?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '0.5rem', color: 'var(--text-main)' }}>
                <span>Total Cost</span>
                <span>৳ {analytics.member.totalCost.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <span>Total Bazar Done</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>- ৳ {Number(analytics.member.totalBazarPaid).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Deposit Given</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>- ৳ {Number(analytics.member.totalDeposit).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px dashed rgba(0,0,0,0.2)', paddingTop: '0.8rem', fontSize: '1.05rem', color: analytics.member.balance >= 0 ? 'var(--primary)' : '#ef4444' }}>
                <span>{analytics.member.balance >= 0 ? 'Receivable (Pabe)' : 'Payable (Dibe)'}</span>
                <span>৳ {Math.abs(analytics.member.balance).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Detailed Breakdowns */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Detailed Breakdown</h3>
          
          <div className="masonry-grid">
            
            {/* Deposits */}
            <div className="minimal-card masonry-item" style={{ padding: '1.5rem', maxHeight: '350px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6' }}>
                  <Wallet size={18} />
                  <span style={{ fontWeight: 600 }}>Deposits (৳ {analytics.member.totalDeposit})</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {analytics.member.lists.deposits.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No deposits this month.</p> : null}
                {analytics.member.lists.deposits.map((d: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>{new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.created_at ? new Date(d.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <strong style={{ fontSize: '0.9rem', color: '#3b82f6' }}>৳ {d.amount}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Bazar */}
            <div className="minimal-card masonry-item" style={{ padding: '1.5rem', maxHeight: '350px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                  <ShoppingCart size={18} />
                  <span style={{ fontWeight: 600 }}>Bazar (৳ {Number(analytics.member.totalBazarPaid).toFixed(2)})</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {analytics.member.lists.bazar.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No bazar this month.</p> : null}
                {analytics.member.lists.bazar.map((b: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <span style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block', fontWeight: 500 }}>{b.item_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(b.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <strong style={{ fontSize: '0.9rem', color: '#10b981' }}>৳ {b.amount}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Others Paid */}
            <div className="minimal-card masonry-item" style={{ padding: '1.5rem', maxHeight: '350px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
                  <Receipt size={18} />
                  <span style={{ fontWeight: 600 }}>Others (৳ {Number(analytics.member.totalFixedExpensesPaid).toFixed(2)})</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {analytics.member.lists.fixedExpenses.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No other expenses this month.</p> : null}
                {analytics.member.lists.fixedExpenses.map((e: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <span style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block', fontWeight: 500 }}>{e.item_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <strong style={{ fontSize: '0.9rem', color: '#8b5cf6' }}>৳ {e.amount}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Meals */}
            <div className="minimal-card masonry-item" style={{ padding: '1.5rem', maxHeight: '350px', overflowY: 'auto', background: 'rgba(245, 158, 11, 0.02)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
                  <Utensils size={18} />
                  <span style={{ fontWeight: 600 }}>Meals ({Number(analytics.member.totalMeals).toFixed(2)})</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#f59e0b', display: 'block' }}>৳ {analytics.member.mealCost.toFixed(2)}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rate: {analytics.mealRate.toFixed(2)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {analytics.member.lists.meals.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No meals eaten this month.</p> : null}
                {analytics.member.lists.meals.map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', fontWeight: 500 }}>{new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Breakfast: {m.breakfast || 0} • Lunch: {m.lunch || 0} • Dinner: {m.dinner || 0}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#f59e0b', display: 'block' }}>{m.meal_count} meals</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.breakfast || 0} + {m.lunch || 0} + {m.dinner || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}

      {/* Activity Logs */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Activity History ({monthStr})</h3>
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
          <Activity size={32} color="var(--border-light)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No activities recorded for this month.</p>
        </div>
      ) : (
        <div style={{ background: 'rgba(255, 255, 255, 0.3)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activities.map((log) => {
              const logDate = new Date(log.created_at)
              const formattedDate = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const formattedTime = logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              
              let actionColor = 'var(--text-muted)'
              let badgeBg = 'transparent'
              
              if (log.action_type === 'ADD') { actionColor = 'var(--primary)'; badgeBg = 'rgba(12, 173, 121, 0.1)' }
              else if (log.action_type === 'EDIT') { actionColor = '#3b82f6'; badgeBg = 'rgba(59, 130, 246, 0.1)' }
              else if (log.action_type === 'DELETE') { actionColor = '#ef4444'; badgeBg = 'rgba(239, 68, 68, 0.1)' }

              return (
                <div key={log.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Activity size={14} color={actionColor} />
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: '0.9rem', margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>{log.details}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formattedDate} {formattedTime}</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.1)', color: '#64748b', fontWeight: 700 }}>
                      {log.entity_type}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
