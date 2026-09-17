import { useId } from 'react';

const Logo = ({ compact = false }) => {
  const gradientId = useId();

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg className="size-8.5 shrink-0" viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
        <path d="M20 44V20l12 12 12-12v24" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && (
        <span className="text-[1.15rem] font-semibold tracking-tight">
          Media<strong className="text-brand font-extrabold">Vault</strong>
        </span>
      )}
    </span>
  );
};

export default Logo;
