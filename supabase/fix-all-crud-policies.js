const { Client } = require('pg');

async function run() {
  console.log('Connecting to PostgreSQL to apply CRUD RLS policies...');
  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.drgdprlusialscclyudf',
    password: 'Craftix@2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected to PostgreSQL successfully.');

  const tables = [
    'organizations',
    'licenses',
    'events',
    'lead_forms',
    'form_sections',
    'form_questions',
    'form_options',
    'profiles',
    'booths',
    'halls',
    'branding_settings',
    'attendees',
    'leads',
    'followups',
    'lead_notes'
  ];

  for (const table of tables) {
    const policyName = `${table}_full_crud_policy`;
    try {
      await client.query(`DROP POLICY IF EXISTS "${policyName}" ON ${table};`);
      await client.query(`CREATE POLICY "${policyName}" ON ${table} FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`);
      console.log(`✓ Granted full CRUD policy on table: ${table}`);
    } catch (err) {
      console.error(`Error on table ${table}:`, err.message);
    }
  }

  // Ensure helper view tenants points to organizations correctly
  await client.query(`
    CREATE OR REPLACE VIEW tenants AS SELECT * FROM organizations;
  `);
  console.log('✓ Verified view: public.tenants -> public.organizations');

  await client.end();
  console.log('Done updating RLS policies.');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
