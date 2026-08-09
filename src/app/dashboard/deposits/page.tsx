'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, PlusCircle, Edit, Trash2, Info } from 'lucide-react'
import { MemberService } from '@/services/member.service'
import { DepositService } from '@/services/deposit.service'
import { useSessionContext } from '@/context/SessionContext'
import Swal from 'sweetalert2'

export default function DepositHistoryPage() {
  const router = useRouter()
  const { selectedSession: session, isLoading: isSessionLoading } = useSessionContext()
  const [members, setMembers] = useState<any[]>([])
  const [depositHistory, setDepositHistory] = useState<any[]>([])
  const [filterUserId, setFilterUserId] = useState<string>('all')
  const [grandTotal, setGrandTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const loadData = async () => {
    if (!session) return
    try {
      setLoading(true)
      const [membersData, depositData] = await Promise.all([
        MemberService.getAllMembers(),
        DepositService.getDepositHistory(session.id)
      ])
      
      setMembers(membersData)
      setDepositHistory(depositData)
      
      const total = depositData.reduce((sum, item) => sum + Number(item.amount), 0)
      setGrandTotal(total)
    } catch (error) {
      console.error("Error loading deposit history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      loadData()
    }
  }, [session])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getMemberNameById = (id: string) => {
    const member = members.find(m => m.id === id)
    return member ? member.name : 'Unknown'
  }

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this deposit!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        Swal.showLoading()
        await DepositService.deleteDeposit(id)
        await loadData() // refresh table
        Swal.fire('Deleted!', 'Deposit entry has been deleted.', 'success')
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error')
      }
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/dashboard/deposits/edit/${id}`)
  }

  const handleView = (deposit: any) => {
    let addedBy = 'System'
    if (deposit.created_by) {
      const member = members.find(m => m.id === deposit.created_by)
      if (member) addedBy = `${member.name} (${member.email})`
    }
    
    let depositor = 'Unknown'
    if (deposit.user_id) {
      const user = members.find(m => m.id === deposit.user_id)
      if (user) depositor = user.name
    }

    const formatTimeBD = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('en-US', { 
        timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      })
    }

    const addedTime = deposit.created_at ? formatTimeBD(deposit.created_at) : 'N/A'
    const dateStr = new Date(deposit.date).toLocaleDateString('en-GB')

    Swal.fire({
      title: '<h3 style="margin:0; font-size: 1.5rem; color: var(--primary); font-family: Merriweather, serif;">Deposit Details</h3>',
      html: `
        <div style="text-align: left; margin-top: 1.5rem; font-family: inherit;">
          <div style="background: rgba(12, 173, 121, 0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(12, 173, 121, 0.1); margin-bottom: 1.5rem; text-align: center;">
            <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">ADDED ON</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700;">${addedTime}</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
            <div style="padding-bottom: 0.5rem; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between;">
              <strong style="font-size: 0.8rem; color: var(--text-muted);">MEMBER</strong>
              <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${depositor}</span>
            </div>
            <div style="padding-bottom: 0.5rem; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between;">
              <strong style="font-size: 0.8rem; color: var(--text-muted);">AMOUNT</strong>
              <span style="font-size: 0.95rem; font-weight: 700; color: var(--primary);">৳ ${deposit.amount}</span>
            </div>
            <div style="padding-bottom: 0.5rem; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between;">
              <strong style="font-size: 0.8rem; color: var(--text-muted);">DATE</strong>
              <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${dateStr}</span>
            </div>
            <div style="padding-bottom: 0.5rem; display: flex; justify-content: space-between;">
              <strong style="font-size: 0.8rem; color: var(--text-muted);">ADDED BY</strong>
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">${addedBy}</span>
            </div>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Close',
      confirmButtonColor: 'var(--primary)',
      customClass: { popup: 'glass-modal' }
    })
  }

  if (!isClient || isSessionLoading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
  }

  if (!session) {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-main)' }}>Deposits History</h1>
        <div className="minimal-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No active session found. Please start a new month from the Dashboard.</p>
        </div>
      </div>
    )
  }

  const isClosed = session.status === 'closed'
  const filteredDeposits = filterUserId === 'all' ? depositHistory : depositHistory.filter(d => d.user_id === filterUserId)
  const filteredTotal = filteredDeposits.reduce((sum, item) => sum + Number(item.amount), 0)

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      
      {isClosed && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <strong>Notice:</strong> This month is closed. Data is read-only.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>Deposit History</h1>
          <p style={{ color: 'var(--text-muted)' }}>{session?.session_name || 'No Active Session'}</p>
          <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(12, 173, 121, 0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700 }}>
            <Wallet size={18} />
            Total Deposit: ৳ {Number(filteredTotal).toFixed(2)}
          </div>
        </div>
        {!isClosed && (
          <button onClick={() => router.push('/dashboard/deposits/add')} className="btn btn-primary quick-action-btn" style={{ padding: '0.7rem 1.2rem' }}>
            <PlusCircle size={16} style={{ marginRight: '0.4rem' }} /> Add Deposit
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <select 
          value={filterUserId} 
          onChange={(e) => setFilterUserId(e.target.value)}
          className="input-field"
          style={{ maxWidth: '250px', background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '8px', padding: '0.6rem 1rem' }}
        >
          <option value="all">All Members</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        {filterUserId !== 'all' && (
          <button 
            onClick={() => setFilterUserId('all')} 
            style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem' }}
          >
            Clear Filter
          </button>
        )}
      </div>

      {filteredDeposits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
          <Wallet size={48} color="var(--border-light)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-muted)' }}>No deposits found</h3>
        </div>
      ) : (
        <>
          <div className="responsive-table hide-on-mobile" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)', overflowX: 'auto' }}>
            <table className="responsive-table" style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Member</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Amount (৳)</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeposits.map((deposit) => (
                  <tr key={deposit.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <td data-label="Date" style={{ padding: '1rem 0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      {formatDate(deposit.date)}
                    </td>
                    
                    <td data-label="Member" style={{ padding: '1rem 0.5rem', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      {getMemberNameById(deposit.user_id)}
                    </td>

                    <td data-label="Amount (৳)" style={{ padding: '1rem 0.5rem', textAlign: 'right', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                      {deposit.amount}
                    </td>

                    <td data-label="Action" style={{ padding: '1rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => handleView(deposit)} className="action-btn action-btn-view" style={{ marginRight: '0.5rem' }}>
                        <Wallet size={14} /> View
                      </button>
                      {session?.status !== 'closed' && (
                        <>
                          <button onClick={() => handleEdit(deposit.id)} className="action-btn action-btn-edit" style={{ marginRight: '0.5rem' }}>
                            <Edit size={14} /> Edit
                          </button>
                          <button onClick={() => handleDelete(deposit.id)} className="action-btn action-btn-delete">
                            <Trash2 size={14} /> Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="hide-on-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredDeposits.map((deposit) => (
              <div key={deposit.id} className="minimal-card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{getMemberNameById(deposit.user_id)}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>৳ {deposit.amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.8rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{formatDate(deposit.date)}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleView(deposit)} className="action-btn action-btn-view" style={{ padding: '0.5rem' }}>
                      <Wallet size={14} />
                    </button>
                    {session?.status !== 'closed' && (
                      <>
                        <button onClick={() => handleEdit(deposit.id)} className="action-btn action-btn-edit" style={{ padding: '0.5rem' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(deposit.id)} className="action-btn action-btn-delete" style={{ padding: '0.5rem' }}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  )
}
