import bcrypt from 'bcryptjs';
import { HashedPassword, VerifiedEmail } from '@/types';
import jwt from 'jsonwebtoken';

export async function hashPassword(password: string): Promise<HashedPassword> {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword as HashedPassword;
}

export async function verifyPassword(password: string, hashedPassword: HashedPassword): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export function generateToken(userId: number, email: VerifiedEmail, role: string): string {
    // Lifetime matches the Set-Cookie Max-Age in /api/auth/login (24h).
    return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

export function generateRandomToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
