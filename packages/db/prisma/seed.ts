/* Seed entrypoint — runs in order:
   1) categories  2) sellers + metrics  3) delivery estimates  4) catalogue (products/offers/history)
   Run: pnpm db:generate && pnpm db:migrate && pnpm db:seed */
import { PrismaClient, SellerStatus } from '@prisma/client';
import { slugify, trustScore, CATEGORIES, SELLERS, CITIES, rng } from './seed-helpers';
import { seedCatalogue } from './seed-catalogue';

const prisma = new PrismaClient();

async function seedCategories(): Promise<void> {
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name), icon: slugify(name) },
    });
  }
  console.log(`[seed] categories: ${CATEGORIES.length}`);
}

async function seedSellers() {
  const created = [];
  for (const s of SELLERS) {
    const seller = await prisma.seller.upsert({
      where: { slug: slugify(s.name) },
      update: {
        website: s.website, searchUrlTemplate: s.search, yearsInBusiness: s.years,
        returnWindowDays: s.returns, warrantyTerms: s.warranty, isVerified: s.verified,
        status: SellerStatus.ACTIVE,
      },
      create: {
        name: s.name, slug: slugify(s.name), website: s.website, searchUrlTemplate: s.search,
        yearsInBusiness: s.years, returnWindowDays: s.returns, warrantyTerms: s.warranty,
        isVerified: s.verified, status: SellerStatus.ACTIVE,
      },
    });
    await prisma.sellerMetric.upsert({
      where: { sellerId: seller.id },
      update: { customerRating: s.rating, deliveryPerformance: s.ship, trustScore: trustScore(s) },
      create: { sellerId: seller.id, customerRating: s.rating, deliveryPerformance: s.ship, trustScore: trustScore(s) },
    });
    created.push(seller);
  }
  console.log(`[seed] sellers: ${SELLERS.length} (with metrics)`);
  return created;
}

async function seedDelivery(sellers: { id: string; name: string }[]): Promise<void> {
  for (const s of sellers) {
    for (const city of CITIES) {
      const rr = rng(s.name + city);
      const v = rr();
      const days = v < 0.2 ? 'Same day' : v < 0.65 ? '1 day' : v < 0.9 ? '2 days' : '3 days';
      const fee = rr() < 0.5 ? 0 : [200, 300][Math.floor(rr() * 2)]!;
      await prisma.deliveryEstimate.upsert({
        where: { sellerId_city: { sellerId: s.id, city } },
        update: { days, fee },
        create: { sellerId: s.id, city, days, fee },
      });
    }
  }
  console.log(`[seed] delivery estimates: ${sellers.length * CITIES.length}`);
}

async function main() {
  await seedCategories();
  const sellers = await seedSellers();
  await seedDelivery(sellers);
  await seedCatalogue(prisma);
  console.log('[seed] done ✓');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
