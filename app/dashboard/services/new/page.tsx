import Link from 'next/link';
import ServiceForm, { EMPTY_SERVICE } from '@/components/ServiceForm';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function NewServicePage() {
  const user = await requireUser();
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink-900">Nouvelle prestation</h1>
      <p className="mb-6 text-[14px] text-ink-600">
        <Link href="/dashboard/services" className="hover:text-ink-900">
          ← Retour aux prestations
        </Link>
      </p>
      <ServiceForm initial={EMPTY_SERVICE} currency={user.currency} />
    </div>
  );
}
