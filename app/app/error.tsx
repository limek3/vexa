'use client';

import { useEffect } from 'react';
import { BrandLogo } from '@/components/brand/brand-logo';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ClickBook /app route]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white">
      <div className="w-full max-w-[350px] rounded-[18px] border border-white/[0.10] bg-[#141414] p-5 text-center">
        <BrandLogo />
        <div className="mt-5 text-[22px] font-semibold leading-none tracking-[-0.08em]">
          Mini app не открылась
        </div>
        <div className="mt-3 rounded-[10px] border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-left text-[11px] leading-5 text-white/55">
          {error.message || 'client_route_error'}
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-5 h-10 w-full rounded-[10px] border border-white/[0.12] bg-white text-[12px] font-bold text-black active:scale-[0.985]"
        >
          Повторить
        </button>
      </div>
    </main>
  );
}