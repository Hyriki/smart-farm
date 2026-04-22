"use server";
import { prisma } from "@/lib/prisma";
import { CreateUserInput } from "@/types";

export async function createUser(data: CreateUserInput){
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role || "viewer",
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    })
    return user;
}

export async function verifyUserEmail(id: number) {
    const user = await prisma.user.update({
        where: { id },
        data: { isVerified: true }
    });
    return user;
}

export async function getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
        where: { email: email }
    });
    if (!user) {
        return null;
    }
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        password: user.password,
    };
}
