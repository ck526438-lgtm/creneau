import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { bookingIcs } from '@/lib/bookings';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await db.booking.findUnique({ where: { id }, include: { service: true, user: true } });
  if (!booking) return new NextResponse('Not found', { status: 404 });

  const ics = bookingIcs(booking, booking.user, booking.status === 'CANCELLED' ? 'CANCEL' : 'REQUEST');
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="rendez-vous.ics"`,
    },
  });
}
