import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#f7f6f2] px-5 py-6 text-[#111111] dark:bg-[#080808] dark:text-white">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-xl flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#111111] shadow-xl shadow-black/15 dark:bg-white">
          <img src="/brand/clickbook-mark-dark-96.png" alt="КликБук" className="h-10 w-10 object-contain dark:hidden" />
          <img src="/brand/clickbook-mark-light-96.png" alt="КликБук" className="hidden h-10 w-10 object-contain dark:block" />
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
          КликБук offline
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Нет соединения</h1>
        <p className="mt-4 max-w-md text-pretty text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          Приложение установлено и открылось, но для расписания, клиентов, чатов и синхронизации нужна сеть.
          Проверь интернет и обнови страницу.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a] dark:bg-white dark:text-[#111111] dark:hover:bg-neutral-200"
          >
            Открыть кабинет
          </Link>
          <Link
            href="/"
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            На главную
          </Link>
        </div>
      </section>
    </main>
  );
}
