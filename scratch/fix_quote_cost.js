const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const folio = 'LI-2026-0001';
  const quote = await prisma.quote.findUnique({ where: { folio } });
  
  if (!quote) {
    console.log('Quote not found');
    return;
  }

  const subtotal = quote.subtotal;
  const costAt50Percent = subtotal * 0.50;

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      realCostTotal: costAt50Percent,
      estimatedUtility: subtotal - costAt50Percent,
      concepts: {
        updateMany: {
          where: { quoteId: quote.id },
          data: {
            realCost: { multiply: 0.5 }, // This might not work with multiply on a field that was 0
          }
        }
      }
    }
  });

  // Update concepts manually to be sure
  const concepts = await prisma.quoteConcept.findMany({ where: { quoteId: quote.id } });
  for (const c of concepts) {
    await prisma.quoteConcept.update({
      where: { id: c.id },
      data: {
        margin: 50,
        realCost: c.totalAmount * 0.50
      }
    });
  }

  console.log(`Updated quote ${folio} with 50% cost: ${costAt50Percent}`);
}

main();
