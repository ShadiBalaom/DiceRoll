// Empty seed: removes mock data insertion
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Intentionally left blank — no mock data
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });