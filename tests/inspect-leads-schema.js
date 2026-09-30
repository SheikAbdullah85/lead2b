const { Client } = require('pg');

async function inspectSchema() {
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
    
    const events = await client.query('SELECT * FROM events LIMIT 2;');
    console.log('Events:', events.rows);
    
    const profiles = await client.query('SELECT id, full_name, email, system_role FROM profiles LIMIT 5;');
    console.log('Profiles:', profiles.rows);
    
    const booths = await client.query('SELECT * FROM booths LIMIT 3;');
    console.log('Booths:', booths.rows);

    const attendees = await client.query('SELECT id, badge_id, first_name, last_name FROM attendees LIMIT 5;');
    console.log('Attendees:', attendees.rows);

  } catch (err) {
    console.error('Error inspecting schema:', err);
  } finally {
    await client.end();
  }
}

inspectSchema();
