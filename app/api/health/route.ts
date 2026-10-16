import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mailConfigured } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: 'up', email: mailConfigured() ? 'smtp' : 'outbox' });
  } catch {
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 });
  }
}
