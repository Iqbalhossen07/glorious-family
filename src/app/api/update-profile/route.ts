import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { userId, name, email } = await request.json()

    if (!userId || !name || !email) {
      return NextResponse.json({ error: 'userId, name, and email are required' }, { status: 400 })
    }

    // Use Admin API to force update user profile & email without requiring email confirmation
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: email,
      user_metadata: { full_name: name },
      email_confirm: true
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Update Public Users Table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ name: name, email: email })
      .eq('id', userId)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
