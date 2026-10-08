'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Save, ArrowLeft } from 'lucide-react'
import { SessionService } from '@/services/session.service'
import { MemberService } from '@/services/member.service'
import { MealService } from '@/services/meal.service'
import { AuthService } from '@/services/auth.service'
import Swal from 'sweetalert2'

const MealInput = ({ value, onChange }: { value: number, onChange: (val: string) => void }) => {
  const handleDec = () => {
    let num = Number(value || 0)
    if (num >= 0.5) onChange((num - 0.5).toString())
  }
  const handleInc = () => {
    let num = Number(value || 0)
    onChange((num + 0.5).toString())
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
      <button onClick={handleDec} disabled={Number(value || 0) <= 0} type="button" style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: 'none', cursor: Number(value || 0) <= 0 ? 'not-allowed' : 'pointer', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem', opacity: Number(value || 0) <= 0 ? 0.3 : 1 }}>-</button>
      <input type="number" step="0.5" min="0" value={value === 0 ? '' : value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', textAlign: 'center', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', fontWeight: 600, WebkitAppearance: 'none', margin: 0, padding: 0 }} placeholder="0" className="meal-input-hide-arrows" />
      <button onClick={handleInc} type="button" style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>+</button>
    </div>
  )
}

type MealState = {
  [userId: string]: { breakfast: number, lunch: number, dinner: number }
}

export default function MealsPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [mealData, setMealData] = useState<MealState>({})

  useEffect(() => {
    const loadData = async () => {
      try {
        const authSession = await AuthService.getSession()
        const currentUser = await AuthService.getCurrentUser()
        if (currentUser?.status === 'inactive') {
          Swal.fire('Access Denied', 'Inactive members cannot modify data.', 'error')
          router.push('/dashboard')
          return
        }

        setUser(authSession?.user)

        const currentSession = await SessionService.getCurrentSession()
        setSession(currentSession)

        if (currentSession) {
          const membersData = await MemberService.getAllMembers()
          const activeMembers = membersData.filter(m => m.status === 'active')
          setMembers(activeMembers)

          // Fetch existing meals to auto-increment the date
          const existingMeals = await MealService.getMealHistory(currentSession.id)
          if (existingMeals && existingMeals.length > 0) {
            const latestMealDate = existingMeals[0].date
            const [yyyy, mm, dd] = latestMealDate.split('-')
            const nextDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
            nextDate.setDate(nextDate.getDate() + 1)
            
            const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`
            setDate(nextDateStr)
          }

          // Initialize meal data with defaults
          const initialMeals: MealState = {}
          activeMembers.forEach((m) => {
            initialMeals[m.id] = { breakfast: 0.5, lunch: 1, dinner: 1 }
          })
          setMealData(initialMeals)
        }
      } catch (error) {
        console.error("Error loading members:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleInputChange = (userId: string, field: 'breakfast' | 'lunch' | 'dinner', value: string) => {
    let numValue = value === '' ? 0 : parseFloat(value)
    if (numValue < 0) {
       Swal.fire({
         icon: 'error',
         title: 'Invalid Input',
         text: 'Values cannot be negative.'
       })
       return
    }
    
    setMealData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: numValue
      }
    }))
  }

  const handleSaveAll = async () => {
    if (!session || !user) return

    const mealsToInsert: any[] = []

    Object.keys(mealData).forEach(userId => {
      const { breakfast, lunch, dinner } = mealData[userId]
      const totalCount = breakfast + lunch + dinner
      
      mealsToInsert.push({
        user_id: userId,
        meal_count: totalCount,
        breakfast: breakfast,
        lunch: lunch,
        dinner: dinner,
        created_by: user.id
      })
    })

    try {
      Swal.showLoading()

      const targetSession = await SessionService.getSessionForDate(date)
      if (!targetSession) throw new Error("No session found for this date")

      await MealService.saveMealsForDate(targetSession.id, date, mealsToInsert)
      await Swal.fire('Success!', 'All meals saved successfully.', 'success')
      router.push('/dashboard/meals')
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error')
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
  }

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h2>No Active Session</h2>
        <button onClick={() => router.push('/dashboard')} className="btn btn-primary submit-btn" style={{ marginTop: '1rem' }}>Go Back</button>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/dashboard/meals')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '0.5rem' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.2rem' }}> Add Meals</h1>
          <p style={{ color: 'var(--text-muted)' }}>Add all meals at once</p>
        </div>
      </div>

      <div className="minimal-card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="icon-floating" style={{ border: 'none', background: 'rgba(12, 173, 121, 0.1)', color: 'var(--primary)', padding: '0.75rem' }}>
          <Calendar size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Select Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: 'none',
              background: 'transparent',
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              outline: 'none'
            }} 
          />
        </div>
      </div>

      <>
        {/* Desktop View */}
        <div className="hide-on-mobile" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Name</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>Breakfast</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>Lunch</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>Dinner</div>
          </div>

          {/* Member Rows */}
          {members.map((member) => (
            <div key={member.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {member.name}
              </div>
              <div>
                <MealInput 
                  value={mealData[member.id]?.breakfast} 
                  onChange={(val) => handleInputChange(member.id, 'breakfast', val)} 
                />
              </div>
              <div>
                <MealInput 
                  value={mealData[member.id]?.lunch} 
                  onChange={(val) => handleInputChange(member.id, 'lunch', val)} 
                />
              </div>
              <div>
                <MealInput 
                  value={mealData[member.id]?.dinner} 
                  onChange={(val) => handleInputChange(member.id, 'dinner', val)} 
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="hide-on-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {members.map((member) => (
            <div key={member.id} className="minimal-card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.4)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.8rem' }}>
                {member.name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.4rem', fontWeight: 600 }}>Breakfast</div>
                  <MealInput 
                    value={mealData[member.id]?.breakfast} 
                    onChange={(val) => handleInputChange(member.id, 'breakfast', val)} 
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.4rem', fontWeight: 600 }}>Lunch</div>
                  <MealInput 
                    value={mealData[member.id]?.lunch} 
                    onChange={(val) => handleInputChange(member.id, 'lunch', val)} 
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.4rem', fontWeight: 600 }}>Dinner</div>
                  <MealInput 
                    value={mealData[member.id]?.dinner} 
                    onChange={(val) => handleInputChange(member.id, 'dinner', val)} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button onClick={handleSaveAll} className="btn btn-primary submit-btn" >
          <Save size={20} /> Save All Meals
        </button>
      </div>

    </div>
  )
}
