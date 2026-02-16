import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, getUsernameFromToken } from '@/lib/auth';
import { logVisit } from '@/lib/google-sheets';

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = await getUsernameFromToken(token);
    if (!username) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await logVisit(username);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to log visit:', error);
    return NextResponse.json({ ok: true });
  }
}
