// Verify seeded organizations have slugs
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, slug: true, status: true }
    });
    console.log('=== Organizations after seed ===');
    orgs.forEach(o => console.log(o.name, '-> slug:', o.slug, 'status:', o.status));

    const communities = await prisma.community.findMany({
      select: { id: true, name: true, slug: true, status: true, organizationId: true }
    });
    console.log('\n=== Communities after seed ===');
    communities.forEach(c => console.log(c.name, '-> slug:', c.slug, 'status:', c.status));

  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();