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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const messId = searchParams.get('id')
    
    if (!messId) throw new Error("Mess ID is required")

    // We must manually delete all related records because the foreign keys 
    // don't have ON DELETE CASCADE setup.

    // Get all users in this mess to clean up their activity logs
    const { data: messUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('mess_id', messId)

    if (messUsers && messUsers.length > 0) {
      const userIds = messUsers.map(u => u.id)
      await supabaseAdmin.from('activity_logs').delete().in('user_id', userIds)
    }

    // Also delete any activity logs directly tied to this mess
    await supabaseAdmin.from('activity_logs').delete().eq('mess_id', messId)

    // 1. Delete all expenses, meals, deposits, etc.
    const tablesToDelete = [
      'sessions', // MUST delete sessions before users because of created_by FK!
      'bazar_expenses',
      'other_expenses',
      'meals',
      'deposits',
      'mess_info',
      'settlements',
      'room_rents',
      'users'
    ]

    for (const table of tablesToDelete) {
      try {
        await supabaseAdmin.from(table).delete().eq('mess_id', messId)
      } catch (e) {
        console.log(`Skipping ${table}: ${e}`)
      }
    }

    // 2. Finally, delete the mess itself
    const { error } = await supabaseAdmin
      .from('messes')
      .delete()
      .eq('id', messId)

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
