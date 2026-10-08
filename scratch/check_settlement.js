const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data } = await supabase.from('settlements')
    .select('*')
    .eq('session_id', '49c1411a-bc8e-4ea9-a3ae-f5e0cceeec89')
    .eq('user_id', 'd02ee648-2e27-4b29-9d79-432ccf233222')
    .limit(1);
  console.log(data);
}
check();
