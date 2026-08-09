'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Save, ArrowLeft } from 'lucide-react'
import { SessionService } from '@/services/session.service'
import { MemberService } from '@/services/member.service'
import { MealService } from '@/services/meal.service'
import { AuthService } from '@/services/auth.service'
import Swal from 'sweetalert2'

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
        setUser(authSession?.user)

        const currentSession = await SessionService.getCurrentSession()
        setSession(currentSession)

        if (currentSession) {
          const membersData = await MemberService.getAllMembers()
          const activeMembers = membersData.filter(m => m.status === 'active')
          setMembers(activeMembers)

          // Initialize meal data with 0
          const initialMeals: MealState = {}
          activeMembers.forEach((m) => {
            initialMeals[m.id] = { breakfast: 0, lunch: 0, dinner: 0 }
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
    const numValue = value === '' ? 0 : parseFloat(value)
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
      await MealService.saveMealsForDate(session.id, date, mealsToInsert)
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
                <input 
                  type="number" 
                  step="0.5" 
                  min="0"
                  value={mealData[member.id]?.breakfast === 0 ? '' : mealData[member.id]?.breakfast}
                  onChange={(e) => handleInputChange(member.id, 'breakfast', e.target.value)}
                  placeholder="0"
                  className="meal-input"
                />
              </div>
              <div>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0"
                  value={mealData[member.id]?.lunch === 0 ? '' : mealData[member.id]?.lunch}
                  onChange={(e) => handleInputChange(member.id, 'lunch', e.target.value)}
                  placeholder="0"
                  className="meal-input"
                />
              </div>
              <div>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0"
                  value={mealData[member.id]?.dinner === 0 ? '' : mealData[member.id]?.dinner}
                  onChange={(e) => handleInputChange(member.id, 'dinner', e.target.value)}
                  placeholder="0"
                  className="meal-input"
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
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0"
                    value={mealData[member.id]?.breakfast === 0 ? '' : mealData[member.id]?.breakfast}
                    onChange={(e) => handleInputChange(member.id, 'breakfast', e.target.value)}
                    placeholder="0"
                    className="meal-input"
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.4rem', fontWeight: 600 }}>Lunch</div>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0"
                    value={mealData[member.id]?.lunch === 0 ? '' : mealData[member.id]?.lunch}
                    onChange={(e) => handleInputChange(member.id, 'lunch', e.target.value)}
                    placeholder="0"
                    className="meal-input"
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.4rem', fontWeight: 600 }}>Dinner</div>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0"
                    value={mealData[member.id]?.dinner === 0 ? '' : mealData[member.id]?.dinner}
                    onChange={(e) => handleInputChange(member.id, 'dinner', e.target.value)}
                    placeholder="0"
                    className="meal-input"
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
