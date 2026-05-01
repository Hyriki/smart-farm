import { createUser, getUserByEmail, verifyUserWithToken, setResetPasswordToken, resetPasswordWithToken } from "@/db/models/userModel";
import { hashPassword, verifyPassword } from "@/lib/utils";
import { CreateUserInput, HashedPassword, UnverifiedEmail, ResponseUser } from "@/types";
import { sendVerficationEmail, sendResetPasswordEmail } from "@/lib/email/sendMail";
import { prisma } from "@/lib/prisma";


export async function createUserController(data: any): Promise<ResponseUser> {
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
        throw new Error("Email already exists");
    }
    const hashedPassword = await hashPassword(data.password);
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const userData = { 
        ...data, 
        password: hashedPassword,
        verificationToken,
        verificationTokenExpires
    };
    const user = await createUser(userData);
    return user as ResponseUser;
}

export async function verifyCredentials(email: string, password: string): Promise<ResponseUser> {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new Error("User not found");
    }
    if (!user.isVerified) {
        throw new Error("Email not verified");
    }
    const isValid = await verifyPassword(password, user.password as HashedPassword);
    if (!isValid) {
        throw new Error("Invalid credentials");
    }
    return user as ResponseUser;
}

export async function verifyEmail(email: UnverifiedEmail): Promise<ResponseUser> {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new Error("User not found");
    }
    
    // We need to fetch the token from the DB because getUserByEmail doesn't return it in ResponseUser
    const fullUser = await prisma.user.findUnique({
        where: { id: user.id }
    });

    if (!fullUser) throw new Error("User not found");

    await sendVerficationEmail({
        email: fullUser.email, 
        name: fullUser.name, 
        token: fullUser.verificationToken as string 
    });
    return user as ResponseUser;
}

export async function verifyUserTokenController(token: string) {
    const user = await verifyUserWithToken(token);
    if (!user) {
        throw new Error("Invalid or expired token");
    }
    return user;
}

export async function forgotPasswordController(email: string) {
    const user = await getUserByEmail(email);
    if (!user) {
        // Return generic success to avoid email enumeration
        return { success: true };
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await setResetPasswordToken(email, resetToken, expires);
    
    // Re-fetch user to ensure we have the name (though we already have it from getUserByEmail)
    await sendResetPasswordEmail({ email: user.email, name: user.name, token: resetToken });

    return { success: true };
}

export async function resetPasswordController(token: string, newPassword: string) {
    const hashedPassword = await hashPassword(newPassword);
    const user = await resetPasswordWithToken(token, hashedPassword);
    if (!user) {
        throw new Error("Invalid or expired token");
    }
    return user;
}