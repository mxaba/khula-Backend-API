#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }

  console.log('📝 Connection string:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL!');

    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version.split(' ')[0], result.rows[0].version.split(' ')[1]);

    const dbResult = await client.query('SELECT current_database()');
    console.log('🗄️  Current database:', dbResult.rows[0].current_database);

    console.log('\n✅ Database connection is working correctly!\n');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n📋 Common issues:');
    console.log('   1. PostgreSQL service not running');
    console.log('   2. Wrong credentials in DATABASE_URL');
    console.log('   3. Database does not exist yet');
    console.log('   4. Wrong host/port in connection string\n');

    await client.end();
    process.exit(1);
  }
}

testConnection();
