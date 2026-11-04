import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  const hash = await hashPassword("Cashier@12345");
  
  const cashierUsers = [
    {
      email: "cashier@institution.edu",
      firstName: "Dinesh Prabhu",
      lastName: "Y",
    },
    {
      email: "dinesh.prabhu@institution.edu",
      firstName: "Dinesh Prabhu",
      lastName: "Y",
    },
    {
      email: "cashier@nodue.edu",
      firstName: "Dinesh Prabhu",
      lastName: "Y",
    },
  ];

  for (const c of cashierUsers) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        role: Role.CASHIER,
        firstName: c.firstName,
        lastName: c.lastName,
        passwordHash: hash,
        isActive: true,
      },
      create: {
        email: c.email,
        passwordHash: hash,
        firstName: c.firstName,
        lastName: c.lastName,
        role: Role.CASHIER,
        isActive: true,
      },
    });
    console.log(`Cashier seeded: ${user.email} [${user.role}] - Name: ${user.firstName} ${user.lastName}`);
  }
}

main()
  .catch((e) => {
    console.error("Cashier seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

