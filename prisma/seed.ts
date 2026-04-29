import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";

async function main() {
  const password = await hashPassword("2503");

  await prisma.user.upsert({
    where: {
      email: "duongbaolong2503@gmail.com",
    },
    update: {
      password,
      isVerified: true,
      role: "viewer",
    },
    create: {
      name: "Bao Long",
      email: "duongbaolong2503@gmail.com",
      password,
      role: "viewer",
      isVerified: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });