const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyProductionMigration() {
  console.log('--- Connecting to Supabase PostgreSQL Database ---');
  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.drgdprlusialscclyudf',
    password: 'Craftix@2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✓ Successfully connected to live database.');

  // 1. Read Schema File
  const schemaPath = path.join(__dirname, 'migrations', '20260928000000_lead2b_complete_schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('--- Executing Schema & RLS Policies ---');
  await client.query(schemaSql);
  console.log('✓ Schema, Tables, Indexes, and RLS Policies created successfully.');

  // 2. Create helper views (e.g. tenants view for backwards compatibility)
  await client.query(`
    CREATE OR REPLACE VIEW tenants AS SELECT * FROM organizations;
  `);
  console.log('✓ Created helper view: public.tenants -> public.organizations');

  // 3. Read Seed File
  const seedPath = path.join(__dirname, 'seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  console.log('--- Executing GITEX Seed Data ---');
  await client.query(seedSql);
  console.log('✓ GITEX Global 2026 Seed Data inserted successfully.');

  // 4. Create / Ensure SuperAdmin and Demo Users in auth.users
  console.log('--- Setting up Supabase Auth Users ---');
  const usersToCreate = [
    {
      id: '99999999-9999-9999-9999-999999999999',
      email: 'sheik85@gmail.com',
      full_name: 'Sheik Abdullah',
      role: 'super_admin',
      tenant_id: '11111111-1111-1111-1111-111111111111',
      password: 'Craftix@2026'
    },
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      email: 'admin@lead2b.com',
      full_name: 'System Administrator',
      role: 'super_admin',
      tenant_id: null,
      password: 'Craftix@2026'
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      email: 'organizer@gitex.com',
      full_name: 'Rashid Al-Nuaimi',
      role: 'organizer_admin',
      tenant_id: null,
      password: 'Craftix@2026'
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      email: 'exhibitor@alphatech.com',
      full_name: 'David Miller',
      role: 'exhibitor_admin',
      tenant_id: '11111111-1111-1111-1111-111111111111',
      password: 'Craftix@2026'
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      email: 'tariq@alphatech.com',
      full_name: 'Tariq Mansoor',
      role: 'sales_rep',
      tenant_id: '11111111-1111-1111-1111-111111111111',
      password: 'Craftix@2026'
    }
  ];

  for (const u of usersToCreate) {
    // Check if auth user exists
    const checkRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [u.email]);
    let userId = u.id;

    if (checkRes.rows.length === 0) {
      const insertAuth = await client.query(`
        INSERT INTO auth.users (
          id,
          instance_id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          recovery_sent_at,
          last_sign_in_at,
          raw_app_meta_data,
          raw_user_meta_data,
          is_super_admin,
          created_at,
          updated_at
        ) VALUES (
          $1,
          '00000000-0000-0000-0000-000000000000',
          'authenticated',
          'authenticated',
          $2,
          extensions.crypt($3, extensions.gen_salt('bf')),
          NOW(),
          NOW(),
          NOW(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          json_build_object('full_name', $4::text)::jsonb,
          false,
          NOW(),
          NOW()
        )
        RETURNING id;
      `, [u.id, u.email, u.password, u.full_name]);
      userId = insertAuth.rows[0].id;
      console.log(`✓ Created auth user: ${u.email}`);
    } else {
      userId = checkRes.rows[0].id;
      // Update password just in case
      await client.query(`
        UPDATE auth.users 
        SET encrypted_password = extensions.crypt($1, extensions.gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW())
        WHERE id = $2
      `, [u.password, userId]);
      console.log(`✓ Updated existing auth user: ${u.email}`);
    }

    // Ensure profile entry exists
    await client.query(`
      INSERT INTO public.profiles (id, email, full_name, system_role, tenant_id, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (id) DO UPDATE
      SET system_role = EXCLUDED.system_role,
          tenant_id = EXCLUDED.tenant_id,
          full_name = EXCLUDED.full_name;
    `, [userId, u.email, u.full_name, u.role, u.tenant_id]);
    console.log(`✓ Profile synced for ${u.email} (${u.role})`);
  }

  // 5. Verification queries
  console.log('\n--- VERIFICATION STATS ---');
  const counts = await Promise.all([
    client.query('SELECT count(*) FROM organizations;'),
    client.query('SELECT count(*) FROM events;'),
    client.query('SELECT count(*) FROM halls;'),
    client.query('SELECT count(*) FROM booths;'),
    client.query('SELECT count(*) FROM attendees;'),
    client.query('SELECT count(*) FROM leads;'),
    client.query('SELECT count(*) FROM lead_forms;'),
    client.query('SELECT count(*) FROM form_questions;'),
    client.query('SELECT count(*) FROM profiles;'),
    client.query('SELECT count(*) FROM auth.users;')
  ]);

  console.log(`- Organizations: ${counts[0].rows[0].count}`);
  console.log(`- Events: ${counts[1].rows[0].count}`);
  console.log(`- Halls: ${counts[2].rows[0].count}`);
  console.log(`- Booths: ${counts[3].rows[0].count}`);
  console.log(`- Attendees: ${counts[4].rows[0].count}`);
  console.log(`- Leads: ${counts[5].rows[0].count}`);
  console.log(`- Lead Forms: ${counts[6].rows[0].count}`);
  console.log(`- Questions: ${counts[7].rows[0].count}`);
  console.log(`- User Profiles: ${counts[8].rows[0].count}`);
  console.log(`- Auth Users: ${counts[9].rows[0].count}`);

  await client.end();
  console.log('\n✓ ALL DATABASE MIGRATIONS AND SEED DATA APPLIED SUCCESSFULLY!');
}

applyProductionMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
