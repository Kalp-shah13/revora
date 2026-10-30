import { PrismaClient, Role, Plan, TagType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma seeding...');

  // 1. Create Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@revora.com' },
    update: {},
    create: {
      email: 'admin@revora.com',
      passwordHash: adminPassword,
      fullName: 'Super Admin',
      role: Role.SUPER_ADMIN,
    },
  });
  console.log('👤 Super Admin ready:', superAdmin.email);

  // 2. Create Business Owner
  const ownerPassword = await bcrypt.hash('password123', 10);
  const businessOwner = await prisma.user.upsert({
    where: { email: 'shah134.kalp@gmail.com' },
    update: {},
    create: {
      email: 'shah134.kalp@gmail.com',
      passwordHash: ownerPassword,
      fullName: 'Kalp Shah',
      role: Role.BUSINESS_OWNER,
    },
  });
  console.log('👤 Business Owner ready:', businessOwner.email);

  // 3. Create Demo Business
  const business = await prisma.business.upsert({
    where: { slug: 'joes-cafe' },
    update: {},
    create: {
      ownerId: businessOwner.id,
      name: "Joe's Cafe",
      slug: 'joes-cafe',
      googleReviewLink: 'https://search.google.com/local/writereview?placeid=test',
      accentColor: '#D97706',
      plan: Plan.FREE,
      isActive: true,
    },
  });
  console.log('🏢 Business ready:', business.name, `(${business.slug})`);

  // 4. Seed Tags (Service + Category)
  const existingTags = await prisma.serviceTag.count({
    where: { businessId: business.id },
  });

  if (existingTags === 0) {
    const defaultTags = [
      // Service tags (the main subject)
      { label: 'Fast Coffee & Breakfast', tagType: TagType.SERVICE },
      { label: 'Brunch Dining Experience', tagType: TagType.SERVICE },
      { label: 'Takeaway Pastry Order', tagType: TagType.SERVICE },
      // Category tags (qualities)
      { label: 'Friendly Staff', tagType: TagType.CATEGORY },
      { label: 'Great Ambience', tagType: TagType.CATEGORY },
      { label: 'Excellent Food', tagType: TagType.CATEGORY },
      { label: 'Good Value', tagType: TagType.CATEGORY },
      { label: 'Clean & Tidy', tagType: TagType.CATEGORY },
    ];

    for (const tag of defaultTags) {
      await prisma.serviceTag.create({
        data: {
          businessId: business.id,
          label: tag.label,
          tagType: tag.tagType,
        },
      });
    }
    console.log(`🏷️  Created ${defaultTags.length} default tags`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
