const { Client } = require('pg');

async function checkServiceKey() {
  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.drgdprlusialscclyudf',
    password: 'Craftix@2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    const res = await client.query(`
      SELECT name, setting FROM pg_settings WHERE name LIKE '%jwt%' OR name LIKE '%secret%';
    `);
    console.log('JWT settings:', res.rows);
  } catch (e) {
    console.log('Error querying pg_settings:', e.message);
  }

  await client.end();
}

checkServiceKey().catch(console.error);
