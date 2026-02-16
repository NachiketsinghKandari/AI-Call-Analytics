import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'auth-token';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ai-call-analytics-secret-key-2024'
);

export function validateCredentials(username: string, password: string): boolean {
  return (
    (username === 'admin' && password === 'admin123') ||
    (username === 'admin@aicallanalytics' && password === 'xqUXCMUhuFPUgxyP') ||
    (username === 'admin@receptionist.ai' && password === 'admin@receptionist.ai123')
  );
}

export async function createToken(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
