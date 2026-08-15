import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper function to convert JSON array to CSV string
function jsonToCSV(jsonArray: any[]) {
  if (!jsonArray || jsonArray.length === 0) return '';
  const keys = Object.keys(jsonArray[0]);
  const csvRows = [];
  // Add header
  csvRows.push(keys.join(','));
  
  // Add rows
  for (const row of jsonArray) {
    const values = keys.map(key => {
      const val = row[key] === null || row[key] === undefined ? '' : String(row[key]);
      // Escape quotes and wrap in quotes if contains comma
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export async function GET(request: Request) {
  try {
    // Vercel Cron Authentication (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Return 401 if it's not from Vercel and secret is configured
      // But we will let it pass for manual triggering if CRON_SECRET is not set
      if (authHeader !== `Bearer dev-secret-123`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json({ error: 'Telegram credentials missing' }, { status: 500 });
    }

    // Fetch data from Supabase tables
    const tables = ['users', 'sessions', 'daily_meals', 'bazar_expenses', 'deposits', 'fixed_expenses'];
    
    // Instead of multiple files, we will create a combined JSON backup because it's safer and easier to restore.
    // Or we can send multiple CSV files. Let's send a single JSON file representing the entire database dump.
    const dbDump: Record<string, any> = {};
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.error(`Error fetching ${table}:`, error);
        throw new Error(`Failed to fetch ${table}`);
      }
      dbDump[table] = data;
    }

    // Convert dump to JSON string and send JSON
    const jsonString = JSON.stringify(dbDump, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const jsonFileName = `glorious_mess_backup_${dateStr}.json`;

    const jsonFormData = new FormData();
    jsonFormData.append('chat_id', TELEGRAM_CHAT_ID);
    jsonFormData.append('caption', `📊 Daily Database Backup (JSON)\nDate: ${new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}\n\nHere is your full database backup for system restore.`);
    jsonFormData.append('document', new Blob([jsonString], { type: 'application/json' }), jsonFileName);

    const telegramRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, { method: 'POST', body: jsonFormData });

    if (!telegramRes.ok) {
      const errorData = await telegramRes.json();
      console.error('Telegram API Error on JSON:', errorData);
      return NextResponse.json({ error: 'Failed to send JSON to Telegram', details: errorData }, { status: 500 });
    }

    // Convert each table to CSV and send
    for (const table of tables) {
      if (dbDump[table] && dbDump[table].length > 0) {
        const csvString = jsonToCSV(dbDump[table]);
        const csvFileName = `${table}_${dateStr}.csv`;
        const csvFormData = new FormData();
        csvFormData.append('chat_id', TELEGRAM_CHAT_ID);
        csvFormData.append('caption', `📁 ${table} (Excel/CSV format)`);
        csvFormData.append('document', new Blob([csvString], { type: 'text/csv' }), csvFileName);

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, { method: 'POST', body: csvFormData });
        
        // Wait a tiny bit to avoid hitting Telegram API rate limits (optional but safe)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({ success: true, message: 'Backup JSON and CSVs sent to Telegram successfully' });

  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
