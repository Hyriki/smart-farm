"use server";
import { prisma } from "@/lib/prisma";
import { CreateUserInput, HashedPassword } from "@/types";

export async function createUser(data: CreateUserInput){
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role || "viewer",
            isVerified: false,
            verificationToken: data.verificationToken,
            verificationTokenExpires: data.verificationTokenExpires,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    })
    return user;
}

export async function verifyUserWithToken(token: string) {
    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token,
            verificationTokenExpires: {
                gt: new Date()
            }
        }
    });

    if (!user) return null;

    return await prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verificationToken: null,
            verificationTokenExpires: null
        }
    });
}

export async function setResetPasswordToken(email: string, token: string, expires: Date) {
    return await prisma.user.update({
        where: { email },
        data: {
            resetPasswordToken: token,
            resetPasswordTokenExpires: expires
        }
    });
}

export async function resetPasswordWithToken(token: string, newPassword: HashedPassword) {
    const user = await prisma.user.findFirst({
        where: {
            resetPasswordToken: token,
            resetPasswordTokenExpires: {
                gt: new Date()
            }
        }
    });

    if (!user) return null;

    return await prisma.user.update({
        where: { id: user.id },
        data: {
            password: newPassword,
            resetPasswordToken: null,
            resetPasswordTokenExpires: null
        }
    });
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
