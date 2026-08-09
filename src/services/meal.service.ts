import { supabase } from '@/lib/supabase'
import { ActivityService } from './activity.service'

export const MealService = {
  async addMeal(sessionId: string, userId: string, date: string, count: number, createdBy: string) {
    const { error } = await supabase
      .from('daily_meals')
      .insert([
        { 
          session_id: sessionId, 
          user_id: userId, 
          date: date, 
          meal_count: count,
          created_by: createdBy
        }
      ])
      
    if (error) throw new Error(error.message)
    
    await ActivityService.logActivity('ADD', 'MEAL', `Added ${count} meal(s) on ${date}`)
  },

  async saveMealsForDate(sessionId: string, date: string, mealsData: any[]) {
    const { data: userData } = await supabase.auth.getUser()
    const { data: userDetails } = await supabase.from('users').select('name').eq('id', userData?.user?.id).maybeSingle()
    const editorName = userDetails?.name || 'Unknown'

    // mealsData: [{ user_id, meal_count, breakfast, lunch, dinner, created_by }]
    for (const meal of mealsData) {
      const { data } = await supabase
        .from('daily_meals')
        .select('id, created_at, edit_history, meal_count, breakfast, lunch, dinner')
        .eq('session_id', sessionId)
        .eq('user_id', meal.user_id)
        .eq('date', date)
        .maybeSingle()
        
      if (meal.meal_count === 0) {
        if (data) {
           await supabase.from('daily_meals').delete().eq('id', data.id)
        }
      } else {
        if (data) {
           const changes = []
           if (data.breakfast !== meal.breakfast) changes.push(`Breakfast: ${data.breakfast}->${meal.breakfast}`)
           if (data.lunch !== meal.lunch) changes.push(`Lunch: ${data.lunch}->${meal.lunch}`)
           if (data.dinner !== meal.dinner) changes.push(`Dinner: ${data.dinner}->${meal.dinner}`)
           
           let history = data.edit_history || []
           if (changes.length > 0) {
             history.push({
               edited_at: new Date().toISOString(),
               edited_by: editorName,
               changes: changes.join(', ')
             })
             
             await supabase.from('daily_meals').update({
               meal_count: meal.meal_count,
               breakfast: meal.breakfast,
               lunch: meal.lunch,
               dinner: meal.dinner,
               edit_history: history,
               updated_at: new Date().toISOString()
             }).eq('id', data.id)
           }
        } else {
           await supabase.from('daily_meals').insert({
             session_id: sessionId,
             date: date,
             user_id: meal.user_id,
             meal_count: meal.meal_count,
             breakfast: meal.breakfast,
             lunch: meal.lunch,
             dinner: meal.dinner,
             created_by: meal.created_by,
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString()
           })
        }
      }
    }
    
    await ActivityService.logActivity('EDIT', 'MEAL', `Updated meals for ${date}`)
  },

  async deleteMealsByDate(sessionId: string, date: string) {
    const { error } = await supabase
      .from('daily_meals')
      .delete()
      .eq('session_id', sessionId)
      .eq('date', date)
      
    if (error) throw new Error(error.message)
    
    await ActivityService.logActivity('DELETE', 'MEAL', `Deleted all meals for ${date}`)
  },

  async getMealHistory(sessionId: string) {
    const { data, error } = await supabase
      .from('daily_meals')
      .select('*')
      .eq('session_id', sessionId)
      .order('date', { ascending: false })
      
    if (error) throw new Error(error.message)
    return data || []
  },

  async getTotalMeals(sessionId: string) {
    const { data, error } = await supabase
      .from('daily_meals')
      .select('meal_count')
      .eq('session_id', sessionId)
      
    if (error) throw new Error(error.message)
    
    // Sum the meals
    return data.reduce((acc, curr) => acc + Number(curr.meal_count), 0)
  }
}
