const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const quote = await prisma.quote.findFirst({
    where: { folio: 'LI-2026-0001' },
    include: { concepts: true }
  });
  console.log(JSON.stringify(quote, null, 2));
}

main();
