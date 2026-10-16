// Verify Organization.slug structure and unique index
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    // Check column exists
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Organization' 
      ORDER BY ordinal_position
    `);
    
    console.log('=== Organization Columns ===');
    const slugCol = columns.find(c => c.column_name === 'slug');
    if (slugCol) {
      console.log('slug column:', JSON.stringify(slugCol));
    } else {
      console.log('slug column NOT FOUND');
    }

    // Check unique indexes
    const indexes = await prisma.$queryRawUnsafe(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'Organization'
    `);
    
    console.log('\n=== Organization Indexes ===');
    indexes.forEach(i => console.log(i.indexname, ':', i.indexdef));

    // Check existing organizations
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, slug: true, status: true }
    });
    console.log('\n=== Existing Organizations ===');
    orgs.forEach(o => console.log(o.name, '-> slug:', o.slug, 'status:', o.status));

  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();