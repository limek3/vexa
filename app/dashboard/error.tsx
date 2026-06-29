'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard-error]', error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f6f2] px-4 py-10 text-[#111111] dark:bg-[#080808] dark:text-white">
      <section className="w-full max-w-[560px] overflow-hidden rounded-[18px] border border-black/[0.09] bg-[#ffffff] shadow-[0_34px_90px_rgba(0,0,0,0.12)] dark:border-white/[0.10] dark:bg-[#141414] dark:shadow-[0_34px_90px_rgba(0,0,0,0.55)]">
        <div className="h-px bg-gradient-to-r from-transparent via-black/20 to-transparent dark:via-white/18" />

        <div className="space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/42 dark:text-white/38">
              ClickBook · dashboard
            </p>
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] sm:text-[26px]">
              Экран не загрузился
            </h1>
            <p className="max-w-[440px] text-[13px] leading-5 text-black/58 dark:text-white/52">
              Я уже поставил защиту от белого экрана. Нажми «Повторить», и если данные из базы
              пришли криво, кабинет попробует собрать безопасную версию состояния.
            </p>
          </div>

          <div className="rounded-[10px] border border-black/[0.08] bg-black/[0.025] p-3 text-[12px] leading-5 text-black/56 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-white/50">
            Ошибка останется в консоли разработчика, чтобы её можно было увидеть в Render Logs,
            но клиент больше не должен получать пустой белый экран без управления.
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="h-10 rounded-[10px] border border-black/[0.12] bg-[#111111] px-4 text-[12px] font-semibold text-white transition hover:bg-black dark:border-white/[0.12] dark:bg-white dark:text-black dark:hover:bg-white/88"
            >
              Повторить
            </button>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-black/[0.09] bg-white/55 px-4 text-[12px] font-semibold text-black/70 transition hover:bg-white dark:border-white/[0.10] dark:bg-white/[0.055] dark:text-white/70 dark:hover:bg-white/[0.085]"
            >
              На главную
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
