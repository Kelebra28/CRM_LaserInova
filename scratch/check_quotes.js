const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const quotes = await prisma.quote.findMany({
    select: {
      id: true,
      folio: true,
      status: true,
      paymentStatus: true,
      total: true,
      realAmountCollected: true,
      active: true,
      updatedAt: true,
      createdAt: true
    }
  });
  console.log(JSON.stringify(quotes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
