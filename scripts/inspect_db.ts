import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { firstName: { contains: "Dinesh", mode: "insensitive" } },
        { lastName: { contains: "Prabhu", mode: "insensitive" } },
        { email: { contains: "cashier", mode: "insensitive" } },
      ],
    },
  });
  console.log("Matching users:", users);
}

main().finally(() => prisma.$disconnect());
