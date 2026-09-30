const { Client } = require('pg');

async function inspectProfiles() {
  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.drgdprlusialscclyudf',
    password: 'Craftix@2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const profiles = await client.query('SELECT id, full_name, email, system_role, tenant_id FROM profiles;');
    console.table(profiles.rows);
  } finally {
    await client.end();
  }
}

inspectProfiles();
