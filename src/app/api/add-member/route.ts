import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    // 1. Create the user in Supabase Auth using Admin API (does not log out the current user)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm the email so they can login immediately
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Insert the user into our public.users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert([
        { 
          id: authData.user.id, 
          name: name, 
          email: email, 
          role: 'member'
        }
      ])

    if (dbError) {
      // If DB insert fails, we should ideally delete the auth user, but for MVP it's okay to just throw
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'User created successfully', user: authData.user }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
