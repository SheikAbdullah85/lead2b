const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const envConfig = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    envConfig[match[1]] = val.trim();
  }
});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const tEvents = await sb.from('events').select('*');
  console.log('events:', tEvents.error || tEvents.data);
  const tTenants = await sb.from('tenants').select('*');
  console.log('tenants:', tTenants.error || tTenants.data);
  const tOrgs = await sb.from('organizations').select('*');
  console.log('organizations:', tOrgs.error || tOrgs.data);
  const tLic = await sb.from('licenses').select('*');
  console.log('licenses:', tLic.error || tLic.data);
}
check();
