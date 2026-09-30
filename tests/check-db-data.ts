import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://drgdprlusialscclyudf.supabase.co',
  'sb_publishable_5UoAFRnatoGCk0XKRq7BFw_-2Es9NzC'
);

async function checkAuthenticated() {
  await supabase.auth.signInWithPassword({
    email: 'exhibitor@alphatech.com',
    password: 'Craftix@2026'
  });

  const { data: attendees, error } = await supabase.from('attendees').select('id, badge_id, first_name, last_name, company, email').limit(10);
  console.log('Authenticated Attendees in Supabase:', { count: attendees?.length, error, attendees });

  const { data: leads, error: leadsErr } = await supabase.from('leads').select('id, first_name, last_name, company, source, capture_method, created_at').limit(10);
  console.log('Authenticated Leads in Supabase:', { count: leads?.length, leadsErr, leads });
}

checkAuthenticated().catch(console.error);
