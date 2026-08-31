import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  try {
    const { data: messes, error: messesError } = await supabaseAdmin
      .from('messes')
      .select('*')
      .order('created_at', { ascending: false })

    if (messesError) throw new Error(messesError.message)

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, mess_id, role')

    if (usersError) throw new Error(usersError.message)

    const messStats = messes.map(mess => {
      const messUsers = users.filter(u => u.mess_id === mess.id)
      const manager = messUsers.find(u => u.id === mess.manager_id) || messUsers.find(u => u.role === 'manager')
      
      return {
        ...mess,
        memberCount: messUsers.length,
        managerName: manager?.name || 'Unknown',
        managerEmail: manager?.email || 'N/A'
      }
    })

    return NextResponse.json({ messes: messStats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { messId, is_active } = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('messes')
      .update({ is_active })
      .eq('id', messId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ mess: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
