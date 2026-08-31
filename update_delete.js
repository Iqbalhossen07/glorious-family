const fs = require('fs')

let content = fs.readFileSync('src/app/api/admin/messes/route.ts', 'utf8')

const newDelete = `
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const messId = searchParams.get('id')
    
    if (!messId) throw new Error("Mess ID is required")

    // We must manually delete all related records because the foreign keys 
    // don't have ON DELETE CASCADE setup.

    // 1. Delete all expenses, meals, deposits, etc.
    const tablesToDelete = [
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
      await supabaseAdmin.from(table).delete().eq('mess_id', messId)
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
`

content = content.replace(/export async function DELETE[\s\S]*?^}/m, newDelete.trim())

fs.writeFileSync('src/app/api/admin/messes/route.ts', content)
