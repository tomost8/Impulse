import { PrismaClient, Category, ChallengeLength } from '@prisma/client';
const prisma = new PrismaClient();

(async function main() {
  const categories = [
    Category.FOOD,
    Category.WELLNESS,
    Category.WORKING_OUT,
    Category.STUDYING_WORKING,
    Category.RISE_AND_SHINE,
    Category.PASSION_HOBBY,
  ];

  const lengths = [
    { length: ChallengeLength.DAYS_7, days: 7, bronze: 200, silver: 250, gold: 300, diamond: 400 },
    { length: ChallengeLength.DAYS_14, days: 14, bronze: 400, silver: 500, gold: 600, diamond: 800 },
    { length: ChallengeLength.DAYS_21, days: 21, bronze: 600, silver: 750, gold: 900, diamond: 1200 },
  ];

  for (const cat of categories) {
    for (const l of lengths) {
      await prisma.challenge.upsert({
        where: { category_length: { category: cat, length: l.length } },
        update: {},
        create: {
          category: cat,
          length: l.length,
          title: `${l.days} Day ${cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} Challenge`,
          points_bronze: l.bronze,
          points_silver: l.silver,
          points_gold: l.gold,
          points_diamond: l.diamond
        }
      });
    }
  }
  console.log("Seeding complete!");
  await prisma.$disconnect();
})();
