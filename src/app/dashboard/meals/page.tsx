'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Utensils, PlusCircle, Edit, Trash2 } from 'lucide-react'
import { MemberService } from '@/services/member.service'
import { MealService } from '@/services/meal.service'
import { useSessionContext } from '@/context/SessionContext'
import Swal from 'sweetalert2'

export default function MealHistoryPage() {
  const router = useRouter()
  const { selectedSession: session, isLoading: isSessionLoading } = useSessionContext()
  const [members, setMembers] = useState<any[]>([])
  const [historyByDate, setHistoryByDate] = useState<any[]>([])
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
      const [membersData, mealsData] = await Promise.all([
        MemberService.getAllMembers(),
        MealService.getMealHistory(session.id)
      ])
      
      setMembers(membersData)
      
      // Group meals by date
      const grouped: { [date: string]: any[] } = {}
      mealsData.forEach((meal: any) => {
        if (!grouped[meal.date]) grouped[meal.date] = []
        grouped[meal.date].push(meal)
      })

      // Convert to array and sort by date descending
      const historyArray = Object.keys(grouped).map(date => {
        const meals = grouped[date]
        const totalForDate = meals.reduce((sum: number, m: any) => sum + Number(m.meal_count), 0)
        return {
          date,
          meals: meals,
          totalForDate
        }
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const gTotal = historyArray.reduce((sum, day) => sum + day.totalForDate, 0)
      setGrandTotal(gTotal)
      setHistoryByDate(historyArray)
    } catch (error) {
      console.error("Error loading meal history:", error)
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
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const handleEditDate = (date: string) => {
    router.push(`/dashboard/meals/edit/${date}`)
  }

  const handleDeleteDate = async (date: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete all meals for ${formatDate(date)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        Swal.showLoading()
        await MealService.deleteMealsByDate(session.id, date)
        await loadData() // refresh table
        Swal.fire('Deleted!', 'Meals have been deleted.', 'success')
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error')
      }
    }
  }

  const handleViewDate = (day: any) => {
    const formatTimeBD = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('en-US', { 
        timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      })
    }
    
    let addedBy = 'System'
    if (day.meals.length > 0 && day.meals[0].created_by) {
      const member = members.find(m => m.id === day.meals[0].created_by)
      if (member) addedBy = `${member.name} (${member.email})`
    }
    
    const createdAtDates = day.meals.map((m: any) => m.created_at ? new Date(m.created_at).getTime() : 0).filter(Boolean)
    const firstAddedTimestamp = createdAtDates.length > 0 ? Math.min(...createdAtDates) : null
    
    const addedTime = firstAddedTimestamp 
      ? new Date(firstAddedTimestamp).toLocaleString('en-US', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
      : 'N/A';
      
    let fieldsHtml = day.meals.map((m: any) => {
      const user = members.find((x: any) => x.id === m.user_id)
      const name = user ? user.name : 'Unknown'
      return `
        <div style="padding-bottom: 0.5rem; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between;">
          <strong style="font-size: 0.8rem; color: var(--text-muted);">${name}</strong>
          <span style="font-size: 0.95rem; font-weight: 700; color: #f59e0b;">${m.meal_count} meals</span>
        </div>
      `
    }).join('');

    let allEdits: any[] = []
    day.meals.forEach((m: any) => {
      if (m.edit_history && m.edit_history.length > 0) {
        const user = members.find((x: any) => x.id === m.user_id)
        const name = user ? user.name : 'Unknown'
        m.edit_history.forEach((edit: any) => {
           allEdits.push({
             ...edit,
             member_name: name
           })
        })
      }
    })
    
    // Sort by edited_at ascending
    allEdits.sort((a, b) => new Date(a.edited_at).getTime() - new Date(b.edited_at).getTime())

    let editHistoryHtml = ''
    if (allEdits.length > 0) {
      editHistoryHtml += `<div style="margin-top: 1.5rem; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 1rem;">
        <strong style="font-size: 0.85rem; color: var(--primary); display: block; margin-bottom: 0.8rem;">EDIT HISTORY</strong>`
      
      allEdits.forEach((edit: any, index: number) => {
        const suffix = index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'
        editHistoryHtml += `
          <div style="background: rgba(0,0,0,0.02); padding: 0.8rem; border-radius: 6px; margin-bottom: 0.5rem; font-size: 0.8rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
              <strong style="color: var(--text-main);">${index + 1}${suffix} Edit (${edit.member_name})</strong>
              <span style="color: var(--text-muted); font-size: 0.75rem;">${formatTimeBD(edit.edited_at)}</span>
            </div>
            <div style="color: var(--text-muted); margin-bottom: 0.3rem;">By: <strong>${edit.edited_by}</strong></div>
            <div style="color: var(--text-main); font-style: italic;">${edit.changes}</div>
          </div>
        `
      })
      editHistoryHtml += `</div>`
    }

    Swal.fire({
      title: '<h3 style="margin:0; font-size: 1.5rem; color: var(--primary); font-family: Merriweather, serif;">Meal Details</h3>',
      html: `
        <div style="text-align: left; margin-top: 1.5rem; font-family: inherit;">
          <div style="background: rgba(12, 173, 121, 0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(12, 173, 121, 0.1); margin-bottom: 1.5rem; text-align: center;">
            <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">ADDED ON</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700;">${addedTime}</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
            <div style="padding-bottom: 0.5rem; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between;">
              <strong style="font-size: 0.8rem; color: var(--text-muted);">LOGGED DATE</strong>
              <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${new Date(day.date).toLocaleDateString('en-GB')}</span>
            </div>
            ${fieldsHtml}
            <div style="padding-bottom: 0.5rem; display: flex; justify-content: space-between;">
              <strong style="font-size: 0.8rem; color: var(--text-muted);">ADDED BY</strong>
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">${addedBy}</span>
            </div>
          </div>
          ${editHistoryHtml}
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
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-main)' }}>Meals</h1>
        <div className="minimal-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No active session found. Please start a new month from the Dashboard.</p>
        </div>
      </div>
    )
  }

  const filteredMembers = filterUserId === 'all' ? members : members.filter(m => m.id === filterUserId)
  
  const filteredHistoryByDate = historyByDate.map(day => {
    const filteredMeals = filterUserId === 'all' ? day.meals : day.meals.filter((m: any) => m.user_id === filterUserId)
    const totalForDate = filteredMeals.reduce((sum: number, m: any) => sum + Number(m.meal_count), 0)
    return {
      ...day,
      meals: filteredMeals,
      totalForDate
    }
  }).filter(day => filterUserId === 'all' || day.totalForDate > 0)

  const filteredGrandTotal = filteredHistoryByDate.reduce((sum, day) => sum + day.totalForDate, 0)

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      
      {session?.status === 'closed' && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <strong>Notice:</strong> This month is closed. Data is read-only.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>Meal History</h1>
          <p style={{ color: 'var(--text-muted)' }}>{session?.session_name || 'No Active Session'}</p>
          <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(12, 173, 121, 0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700 }}>
            <Utensils size={18} />
            Grand Total: {filteredGrandTotal} Meals
          </div>
        </div>
        {session && session.status !== 'closed' && (
          <button onClick={() => router.push('/dashboard/meals/add')} className="btn btn-primary quick-action-btn" style={{ padding: '0.7rem 1.2rem' }}>
            <PlusCircle size={16} style={{ marginRight: '0.4rem' }} /> Add Meal
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

        {filteredHistoryByDate.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
            <Utensils size={48} color="var(--border-light)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--text-muted)' }}>No meals added yet</h3>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="responsive-table hide-on-mobile" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)', overflowX: 'auto' }}>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '1rem 0.5rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date</th>
                    {filteredMembers.map(member => (
                      <th key={member.id} style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {member.name}
                      </th>
                    ))}
                    <th style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--primary)' }}>Daily Total</th>
                    <th style={{ padding: '1rem 0.5rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistoryByDate.map((day) => (
                    <tr key={day.date} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <td data-label="Date" style={{ padding: '1rem 0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        {formatDate(day.date)}
                      </td>
                      
                      {filteredMembers.map(member => {
                        const userMeal = day.meals.find((m: any) => m.user_id === member.id)
                        const b = userMeal?.breakfast || 0
                        const l = userMeal?.lunch || 0
                        const d = userMeal?.dinner || 0
                        const display = userMeal ? `${b} + ${l} + ${d}` : '-'
                        
                        return (
                          <td data-label="Member" key={member.id} style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.9rem', color: userMeal ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: userMeal ? 500 : 400, whiteSpace: 'nowrap' }}>
                            {display}
                          </td>
                        )
                      })}

                      <td data-label="Daily Total" style={{ padding: '1rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{ background: 'rgba(12, 173, 121, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', display: 'inline-block' }}>
                          {day.totalForDate}
                        </span>
                      </td>

                      <td data-label="Action" style={{ padding: '1rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => handleViewDate(day)} className="action-btn action-btn-view" style={{ marginRight: '0.5rem' }}>
                          <Utensils size={14} /> View
                        </button>
                        {session?.status !== 'closed' && (
                          <>
                            <button onClick={() => handleEditDate(day.date)} className="action-btn action-btn-edit" style={{ marginRight: '0.5rem' }}>
                              <Edit size={14} /> Edit
                            </button>
                            <button onClick={() => handleDeleteDate(day.date)} className="action-btn action-btn-delete">
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
              {filteredHistoryByDate.map((day) => (
                <div key={day.date} className="minimal-card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.8rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-main)' }}>{formatDate(day.date)}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--primary)', background: 'rgba(12, 173, 121, 0.1)', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
                      {day.totalForDate} Meals
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
                    {filteredMembers.map(member => {
                      const userMeal = day.meals.find((m: any) => m.user_id === member.id)
                      if (!userMeal && filterUserId !== 'all') return null;
                      
                      const b = userMeal?.breakfast || 0
                      const l = userMeal?.lunch || 0
                      const d = userMeal?.dinner || 0
                      const display = userMeal ? `${b} + ${l} + ${d}` : '-'
                      
                      return (
                        <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem', color: userMeal ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: userMeal ? 500 : 400 }}>
                            {member.name}
                          </span>
                          <span style={{ fontSize: '0.9rem', color: userMeal ? 'var(--text-main)' : 'var(--text-muted)', fontFamily: 'monospace', fontWeight: userMeal ? 500 : 400 }}>
                            {display}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.8rem' }}>
                    <button onClick={() => handleViewDate(day)} className="action-btn action-btn-view" style={{ padding: '0.5rem' }}>
                      <Utensils size={14} />
                    </button>
                    {session?.status !== 'closed' && (
                      <>
                        <button onClick={() => handleEditDate(day.date)} className="action-btn action-btn-edit" style={{ padding: '0.5rem' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteDate(day.date)} className="action-btn action-btn-delete" style={{ padding: '0.5rem' }}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    )
  }
