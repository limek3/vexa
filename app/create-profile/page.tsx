// app/create-profile/page.tsx
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { MasterProfileForm } from '@/components/profile/master-profile-form';
import { useApp } from '@/lib/app-context';
import { useLocale } from '@/lib/locale-context';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark';

function pageBg(light: boolean) {
  return light ? 'bg-[#f7f6f2]' : 'bg-[#080808]';
}

function pageText(light: boolean) {
  return light ? 'text-[#111111]' : 'text-[#f8f7f4]';
}

function mutedText(light: boolean) {
  return light ? 'text-[#6b7280]' : 'text-[#9ca3af]';
}

function borderTone(light: boolean) {
  return light ? 'border-black/[0.08]' : 'border-white/[0.08]';
}

function cardTone(light: boolean) {
  return light
    ? 'border-black/[0.08] bg-[#ffffff]'
    : 'border-white/[0.08] bg-[#141414]';
}

function Card({
  children,
  light,
  className,
}: {
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <section className={cn('overflow-hidden rounded-[11px] border', cardTone(light), className)}>
      {children}
    </section>
  );
}

export default function CreateProfilePage() {
  const { hasHydrated, ownedProfile } = useApp();
  const { locale } = useLocale();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme: ThemeMode = mounted
    ? resolvedTheme === 'light'
      ? 'light'
      : 'dark'
    : 'dark';

  const isLight = currentTheme === 'light';

  const copy =
    locale === 'ru'
      ? {
          title: ownedProfile ? 'Редактирование профиля' : 'Создание профиля',
          description:
            'Заполните данные мастера, услуги, портфолио и контакты. После сохранения появится публичная ссылка для клиентов.',
          editorTitle: 'Редактор страницы',
          editorDescription:
            'Основной рабочий блок. Здесь заполняются данные мастера, услуги и контакты.',
          loading: 'Загружаем кабинет...',
        }
      : {
          title: ownedProfile ? 'Edit profile' : 'Create profile',
          description:
            'Fill in specialist data, services, portfolio, and contacts. After saving, a public client link will be available.',
          editorTitle: 'Page editor',
          editorDescription:
            'Main working area. Specialist data, services, and contacts are edited here.',
          loading: 'Loading workspace...',
        };

  if (!mounted || !hasHydrated) {
    return (
      <WorkspaceShell>
        <main className={cn('min-h-[calc(100dvh-68px)] px-4 pb-12 pt-5 md:px-7 md:pt-6', pageBg(isLight))}>
          <div className="mx-auto w-full max-w-[var(--page-max-width)]">
            <Card light={isLight} className="p-5">
              <div className={cn('text-[13px]', mutedText(isLight))}>{copy.loading}</div>
            </Card>
          </div>
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <main
        className={cn(
          'min-h-[calc(100dvh-68px)] px-4 pb-12 pt-5 md:px-7 md:pt-6',
          pageBg(isLight),
        )}
      >
        <div className="mx-auto w-full max-w-[var(--page-max-width)] space-y-4">
          <div className="min-w-0">
            <h1
              className={cn(
                'text-[31px] font-semibold leading-[0.98] tracking-[-0.042em] md:text-[42px]',
                pageText(isLight),
              )}
            >
              {copy.title}
            </h1>

            <p className={cn('mt-2 max-w-[760px] text-[13px] leading-5', mutedText(isLight))}>
              {copy.description}
            </p>
          </div>

          <Card light={isLight}>
            <div
              className={cn(
                'flex min-h-[58px] items-center justify-between gap-4 border-b px-4 py-3',
                borderTone(isLight),
              )}
            >
              <div className="min-w-0">
                <h2 className={cn('truncate text-[13px] font-semibold tracking-[-0.012em]', pageText(isLight))}>
                  {copy.editorTitle}
                </h2>
                <p className={cn('mt-1 truncate text-[11px]', mutedText(isLight))}>
                  {copy.editorDescription}
                </p>
              </div>
            </div>

            <div className="p-4">
              <MasterProfileForm
                initialProfile={ownedProfile}
                mode={ownedProfile ? 'edit' : 'create'}
                showHeader={false}
                showOverviewCards={false}
                showPreviewPanel={false}
              />
            </div>
          </Card>
        </div>
      </main>
    </WorkspaceShell>
  );
}
