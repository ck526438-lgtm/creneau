import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import ServiceForm from '@/components/ServiceForm';

export const dynamic = 'force-dynamic';

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const service = await db.service.findFirst({ where: { id, userId: user.id } });
  if (!service) notFound();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink-900">Modifier la prestation</h1>
      <p className="mb-6 text-[14px] text-ink-600">
        <Link href="/dashboard/services" className="hover:text-ink-900">
          ← Retour aux prestations
        </Link>
      </p>
      <ServiceForm
        initial={{
          id: service.id,
          title: service.title,
          description: service.description,
          durationMin: service.durationMin,
          bufferBeforeMin: service.bufferBeforeMin,
          bufferAfterMin: service.bufferAfterMin,
          locationKind: service.locationKind as 'VIDEO' | 'OFFICE' | 'PHONE',
          locationValue: service.locationValue,
          active: service.active,
          colorIndex: service.colorIndex,
        }}
      />
    </div>
  );
}
