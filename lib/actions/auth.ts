'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateCredentials, createToken, COOKIE_NAME } from '@/lib/auth';

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const callbackUrl = formData.get('callbackUrl') as string;

  if (!username || !password) {
    return { error: 'Please enter both username and password.' };
  }

  if (!validateCredentials(username, password)) {
    return { error: 'Invalid username or password.' };
  }

  const token = await createToken(username);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  redirect(callbackUrl || '/');
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect('/login');
}
