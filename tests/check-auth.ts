import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://drgdprlusialscclyudf.supabase.co',
  'sb_publishable_5UoAFRnatoGCk0XKRq7BFw_-2Es9NzC'
);

async function test() {
  const users = [
    { email: 'tariq@alphatech.com', pass: 'Craftix@2026' },
    { email: 'exhibitor@alphatech.com', pass: 'Craftix@2026' },
    { email: 'sheik85@gmail.com', pass: 'Craftix@2026' }
  ];

  for (const u of users) {
    const res = await supabase.auth.signInWithPassword({ email: u.email, password: u.pass });
    console.log(`User ${u.email}:`, res.error ? `FAILED: ${res.error.message}` : `SUCCESS ID: ${res.data?.user?.id}`);
  }
}

test();
