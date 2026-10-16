// Test Prisma connection with the actual DATABASE_URL
const { PrismaClient } = require('@prisma/client');

// Load .env manually
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

function parseEnv(content) {
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  return result;
}

const env = parseEnv(envContent);

console.log('=== Prisma Connection Test ===');
console.log('DATABASE_URL host: aws-1-eu-west-1.pooler.supabase.com:6543');
console.log('DIRECT_URL host: aws-1-eu-west-1.pooler.supabase.com:5432');

// Test 1: Pooler (6543)
console.log('\n--- Test 1: Pooler 6543 ---');
const prisma1 = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
});

prisma1.$connect()
  .then(() => {
    console.log('Pooler connected OK');
    return prisma1.$queryRaw`SELECT 1 as test`;
  })
  .then((r) => console.log('Pooler query OK:', r))
  .catch((e) => console.log('Pooler FAILED:', e.message, e.code || ''))
  .finally(() => prisma1.$disconnect());

// Test 2: Direct (5432)
setTimeout(() => {
  console.log('\n--- Test 2: Direct 5432 ---');
  const prisma2 = new PrismaClient({
    datasources: { db: { url: env.DIRECT_URL } },
  });
  
  prisma2.$connect()
    .then(() => {
      console.log('Direct connected OK');
      return prisma2.$queryRaw`SELECT 1 as test`;
    })
    .then((r) => console.log('Direct query OK:', r))
    .catch((e) => console.log('Direct FAILED:', e.message, e.code || ''))
    .finally(() => prisma2.$disconnect());
}, 3000);