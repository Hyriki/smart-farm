import { createUser, getUserByEmail, verifyUserEmail } from "@/db/models/userModel";
import { hashPassword, verifyPassword } from "@/lib/utils";
import { CreateUserInput, HashedPassword, UnverifiedEmail, ResponseUser } from "@/types";
import { sendVerficationEmail } from "@/lib/email/sendMail";


export async function createUserController(data: CreateUserInput): Promise<ResponseUser> {
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
        throw new Error("Email already exists");
    }
    const hashedPassword = await hashPassword(data.password);
    const userData = { ...data, password: hashedPassword };
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
    // const isValid = await verifyPassword(password, user.password as HashedPassword);
    // if (!isValid) {
    //     throw new Error("Invalid credentials");
    // }
    return user as ResponseUser;
}

export async function verifyEmail(email: UnverifiedEmail): Promise<ResponseUser> {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new Error("User not found");
    }
    await sendVerficationEmail({id: user.id as number, email: user.email as string, name: user.name as string});
    return user as ResponseUser;
}