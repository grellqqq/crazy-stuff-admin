import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

// In-memory token store — resets on server restart (acceptable for simple admin)
const validTokens = new Set<string>();

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function setAuthCookie(token: string): Promise<void> {
  validTokens.add(token);
  const cookieStore = await cookies();
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (token) validTokens.delete(token);
  cookieStore.delete('admin_token');
}

export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !validTokens.has(token)) {
    redirect('/login');
  }
}

export function verifyPassword(input: string): boolean {
  return input === process.env.ADMIN_PASSWORD;
}
