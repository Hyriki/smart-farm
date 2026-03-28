"use server"; // Bắt buộc phải có dòng này ở đầu file

import { prisma } from "@/lib/prisma";

export async function createUserAction() {
  const user = await prisma.user.create({
    data: {
      name: "Alice",
      email: `alice-${Date.now()}@prisma.io`, // Thêm Date.now để tránh trùng email
      password: "password123",
      role: "USER",
    },
  });
  
  const allUsers = await prisma.user.findMany({
    where: { name: "Alice" }
  });

  return { user, allUsers };
}