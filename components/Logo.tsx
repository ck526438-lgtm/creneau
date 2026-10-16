import Image from 'next/image';

export default function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Logo Creneau"
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
      priority
    />
  );
}
