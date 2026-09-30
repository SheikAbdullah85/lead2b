const { Client } = require('pg');

async function checkLeadsRLS() {
  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.drgdprlusialscclyudf',
    password: 'Craftix@2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const res = await client.query(`
    SELECT policyname, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'leads';
  `);

  console.log('Leads RLS Policies:');
  console.table(res.rows);

  await client.end();
}

checkLeadsRLS().catch(console.error);
