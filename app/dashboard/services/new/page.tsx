import Link from 'next/link';
import ServiceForm, { EMPTY_SERVICE } from '@/components/ServiceForm';

export default function NewServicePage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink-900">Nouvelle prestation</h1>
      <p className="mb-6 text-[14px] text-ink-600">
        <Link href="/dashboard/services" className="hover:text-ink-900">
          ← Retour aux prestations
        </Link>
      </p>
      <ServiceForm initial={EMPTY_SERVICE} />
    </div>
  );
}
