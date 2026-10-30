import { PrismaClient, Role, Plan, TagType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Automatically load .env file variables into process.env
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const currentEnv = (process.env.NODE_ENV || 'development').trim().toLowerCase();
  if (currentEnv === 'production' || currentEnv === 'prod') {
    console.error('❌ FATAL: Database seeding is strictly disabled when NODE_ENV="production"!');
    process.exit(1);
  }

  console.log('🌱 Starting Prisma seeding in development mode...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@revora.com';
  const adminRawPassword = process.env.SEED_ADMIN_PASSWORD || 'DevAdmin#2026!Secure';
  const ownerEmail = process.env.SEED_OWNER_EMAIL || 'owner@revora.com';
  const ownerRawPassword = process.env.SEED_OWNER_PASSWORD || 'DevOwner#2026!Secure';

  // 1. Create Super Admin (cost factor 12)
  const adminPassword = await bcrypt.hash(adminRawPassword, 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { passwordHash: adminPassword },
    create: {
      email: adminEmail.toLowerCase(),
      passwordHash: adminPassword,
      fullName: 'Super Admin',
      role: Role.SUPER_ADMIN,
    },
  });
  console.log('👤 Super Admin ready:', superAdmin.email);

  // 2. Create Business Owner
  const ownerPassword = await bcrypt.hash(ownerRawPassword, 12);
  const businessOwner = await prisma.user.upsert({
    where: { email: ownerEmail.toLowerCase() },
    update: { passwordHash: ownerPassword },
    create: {
      email: ownerEmail.toLowerCase(),
      passwordHash: ownerPassword,
      fullName: 'Demo Business Owner',
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
