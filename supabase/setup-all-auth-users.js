const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const usersToEnsure = [
  {
    id: 'd1c88448-0a1a-4b35-8f50-32aea5420067',
    email: 'sheik85@gmail.com',
    full_name: 'Sheik Abdullah',
    system_role: 'super_admin',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    password: 'Craftix@2026'
  },
  {
    id: 'e3c151e6-54a3-428d-a482-85f084ffde2a',
    email: 'admin@lead2b.com',
    full_name: 'System Administrator',
    system_role: 'super_admin',
    tenant_id: null,
    password: 'Craftix@2026'
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    email: 'organizer@gitex.com',
    full_name: 'Rashid Al-Nuaimi',
    system_role: 'organizer_admin',
    tenant_id: null,
    password: 'Craftix@2026'
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    email: 'exhibitor@alphatech.com',
    full_name: 'David Miller',
    system_role: 'exhibitor_admin',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    password: 'Craftix@2026'
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    email: 'tariq@alphatech.com',
    full_name: 'Tariq Mansoor',
    system_role: 'sales_rep',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    password: 'Craftix@2026'
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    email: 'sarah@alphatech.com',
    full_name: 'Sarah Jenkins',
    system_role: 'sales_rep',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    password: 'Craftix@2026'
  }
];

async function run() {
  const pgClient = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.drgdprlusialscclyudf',
    password: 'Craftix@2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  await pgClient.connect();

  console.log('--- Provisioning Users & Identities in PostgreSQL ---');
  for (const u of usersToEnsure) {
    const userRes = await pgClient.query('SELECT id FROM auth.users WHERE email = $1;', [u.email]);
    let uid = u.id;
    if (userRes.rows.length === 0) {
      await pgClient.query(`
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          is_sso_user,
          is_anonymous,
          created_at,
          updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          $1::uuid,
          'authenticated',
          'authenticated',
          $2::varchar,
          extensions.crypt($3, extensions.gen_salt('bf')),
          NOW(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          json_build_object('sub', $1::text, 'email', $2::text, 'full_name', $4::text, 'email_verified', true)::jsonb,
          false,
          false,
          NOW(),
          NOW()
        );
      `, [u.id, u.email, u.password, u.full_name]);
      console.log(`✓ Inserted auth.users for ${u.email}`);
    } else {
      uid = userRes.rows[0].id;
      await pgClient.query(`
        UPDATE auth.users
        SET encrypted_password = extensions.crypt($1, extensions.gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW())
        WHERE id = $2;
      `, [u.password, uid]);
      console.log(`✓ Updated password for ${u.email}`);
    }

    const idRes = await pgClient.query('SELECT id FROM auth.identities WHERE user_id = $1;', [uid]);
    if (idRes.rows.length === 0) {
      await pgClient.query(`
        INSERT INTO auth.identities (
          id,
          provider_id,
          user_id,
          identity_data,
          provider,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1::text,
          $1::uuid,
          json_build_object('sub', $1::text, 'email', $2::text, 'full_name', $3::text, 'email_verified', true)::jsonb,
          'email',
          NOW(),
          NOW(),
          NOW()
        );
      `, [uid, u.email, u.full_name]);
      console.log(`✓ Created auth.identities for ${u.email}`);
    }

    await pgClient.query(`
      INSERT INTO public.profiles (id, email, full_name, system_role, tenant_id, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (id) DO UPDATE
      SET system_role = EXCLUDED.system_role,
          tenant_id = EXCLUDED.tenant_id,
          full_name = EXCLUDED.full_name;
    `, [uid, u.email, u.full_name, u.system_role, u.tenant_id]);
    console.log(`✓ Profile synchronized for ${u.email} (${u.system_role})`);
  }

  await pgClient.query(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, system_role, tenant_id, is_active)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'sales_rep',
        '11111111-1111-1111-1111-111111111111',
        true
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `);
  console.log('✓ Automatic signup profile trigger registered.');

  await pgClient.end();

  console.log('\n--- VERIFYING CLIENT SIGN-INS ---');
  const supabase = createClient(
    'https://drgdprlusialscclyudf.supabase.co',
    'sb_publishable_5UoAFRnatoGCk0XKRq7BFw_-2Es9NzC'
  );

  for (const u of usersToEnsure) {
    const res = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.password
    });
    if (res.error) {
      console.error(`✗ Sign-in failed for ${u.email}:`, res.error.message);
    } else {
      console.log(`✓ ${u.email} logged in successfully! (Role: ${u.system_role})`);
    }
  }
}

run().catch(console.error);
