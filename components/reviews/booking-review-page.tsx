'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { CheckCircle2, LockKeyhole, MessageSquareQuote, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MasterAvatar } from '@/components/profile/master-avatar';
import { cn } from '@/lib/utils';

type ReviewContext = {
  token?: string;
  status?: string;
  expired?: boolean;
  expiresAt?: string | null;
  submittedAt?: string | null;
  master: {
    slug: string;
    name: string;
    profession?: string;
    city?: string;
    avatar?: string;
    rating?: number | null;
    reviewCount?: number;
  };
  booking?: {
    clientName?: string;
    service?: string;
  };
};

function pageBg(light: boolean) {
  return light ? 'bg-[#f7f6f2]' : 'bg-[#080808]';
}

function pageText(light: boolean) {
  return light ? 'text-[#111111]' : 'text-[#f8f7f4]';
}

function mutedText(light: boolean) {
  return light ? 'text-[#6b7280]' : 'text-[#9ca3af]';
}

function faintText(light: boolean) {
  return light ? 'text-black/34' : 'text-white/28';
}

function cardTone(light: boolean) {
  return light
    ? 'border-black/[0.08] bg-[#ffffff]'
    : 'border-white/[0.08] bg-[#141414]';
}

function glassTone(light: boolean) {
  return light
    ? 'border-black/[0.08] bg-[#ffffff]/78 text-black shadow-[0_18px_54px_rgba(15,15,15,0.08)]'
    : 'border-white/[0.10] bg-[#141414]/74 text-white shadow-[0_18px_54px_rgba(0,0,0,0.36)]';
}

function fieldTone(light: boolean) {
  return light
    ? 'border-black/[0.08] bg-black/[0.02]'
    : 'border-white/[0.08] bg-white/[0.035]';
}

function inputCss(light: boolean) {
  return cn(
    'h-11 rounded-[10px] border px-3 text-[13px] shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
    light
      ? 'border-black/[0.08] bg-white text-black placeholder:text-black/28'
      : 'border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/25',
  );
}

function InfoPill({
  light,
  icon,
  children,
}: {
  light: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'inline-flex min-h-9 items-center gap-2 rounded-[10px] border px-3 text-[11px] font-medium',
        fieldTone(light),
      )}
    >
      <span className={cn('shrink-0', faintText(light))}>{icon}</span>
      <span className={cn('min-w-0 truncate', pageText(light))}>{children}</span>
    </div>
  );
}

export function BookingReviewPage({ token, profileSlug }: { token?: string; profileSlug?: string }) {
  const { resolvedTheme } = useTheme();
  const light = resolvedTheme === 'light';
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<ReviewContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setContextLoading(true);
      setError(null);

      try {
        const url = token
          ? `/api/reviews/booking?token=${encodeURIComponent(token)}`
          : `/api/reviews/profile?slug=${encodeURIComponent(profileSlug || '')}`;
        const response = await fetch(url, { cache: 'no-store' });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          context?: ReviewContext;
          profile?: ReviewContext['master'];
        };

        if (!response.ok) {
          throw new Error(payload.error || 'load_failed');
        }

        const nextContext = token
          ? (payload.context ?? null)
          : payload.profile
            ? { master: payload.profile }
            : null;

        if (!ignore) {
          setContext(nextContext);
          if (token && nextContext?.booking?.clientName) {
            setAuthor((current) => current || nextContext.booking?.clientName || '');
          }
        }
      } catch (err) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : 'load_failed';
          setError(
            message === 'not_found' || message === 'profile_not_found'
              ? 'Ссылка для отзыва не найдена.'
              : 'Не удалось загрузить данные для отзыва.',
          );
        }
      } finally {
        if (!ignore) {
          setContextLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [profileSlug, token]);

  const tokenLocked = Boolean(token && (context?.expired || context?.status === 'submitted'));
  const publicReviewDisabled = Boolean(!token && profileSlug);
  const canSubmit = Boolean(token && !tokenLocked && !done);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, author, text, rating }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'review_failed');
      }

      setDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'review_failed';
      setError(
        message === 'already_submitted'
          ? 'Отзыв по этой ссылке уже отправлен.'
          : message === 'expired'
            ? 'Ссылка для отзыва устарела.'
            : 'Не удалось отправить отзыв. Попробуйте ещё раз.',
      );
    } finally {
      setLoading(false);
    }
  };

  const title = useMemo(() => {
    if (done) return 'Спасибо за отзыв';
    if (publicReviewDisabled) return 'Отзывы только по персональной ссылке';
    if (tokenLocked && context?.status === 'submitted') return 'Отзыв уже отправлен';
    if (tokenLocked && context?.expired) return 'Ссылка для отзыва устарела';
    return 'Оставьте отзыв о визите';
  }, [context?.expired, context?.status, done, publicReviewDisabled, tokenLocked]);

  return (
    <main className={cn('min-h-screen px-4 py-8', pageBg(light), pageText(light))}>
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[980px] items-center">
        <section className={cn('w-full overflow-hidden rounded-[22px] border shadow-none', cardTone(light))}>
          <div className="grid gap-0 lg:grid-cols-[420px_minmax(0,1fr)]">
            <div
              className={cn(
                'relative overflow-hidden border-b p-5 lg:border-b-0 lg:border-r lg:p-6',
                light ? 'border-black/[0.08]' : 'border-white/[0.08]',
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background: light
                    ? 'radial-gradient(circle at top left, rgba(0,0,0,0.05), transparent 42%), radial-gradient(circle at bottom right, rgba(0,0,0,0.035), transparent 35%)'
                    : 'radial-gradient(circle at top left, rgba(255,255,255,0.07), transparent 42%), radial-gradient(circle at bottom right, rgba(255,255,255,0.045), transparent 35%)',
                }}
              />

              <div className="relative z-10">
                <div className={cn('text-[10px] font-medium uppercase tracking-[0.16em]', mutedText(light))}>
                  КликБук · защищённый отзыв
                </div>

                <div className="mt-5 flex items-start gap-4">
                  <MasterAvatar
                    name={context?.master.name || 'Мастер'}
                    avatar={context?.master.avatar}
                    className="h-20 w-20 rounded-[20px] border-0 object-cover text-[24px]"
                  />

                  <div className="min-w-0 flex-1">
                    <div className={cn('truncate text-[28px] font-semibold leading-none tracking-[-0.08em]', pageText(light))}>
                      {context?.master.name || 'Мастер'}
                    </div>
                    <div className={cn('mt-2 text-[13px] font-medium', mutedText(light))}>
                      {context?.master.profession || 'Профиль мастера'}
                    </div>
                    {context?.master.city ? (
                      <div className={cn('mt-1 text-[12px]', faintText(light))}>{context.master.city}</div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <InfoPill light={light} icon={<ShieldCheck className="size-3.5" />}>
                    Только после реального визита
                  </InfoPill>
                  {context?.booking?.service ? (
                    <InfoPill light={light} icon={<Sparkles className="size-3.5" />}>
                      {context.booking.service}
                    </InfoPill>
                  ) : null}
                  {context?.master.slug ? (
                    <InfoPill light={light} icon={<MessageSquareQuote className="size-3.5" />}>
                      @{context.master.slug}
                    </InfoPill>
                  ) : null}
                </div>

                <div className={cn('mt-6 rounded-[16px] border p-4 backdrop-blur-[20px]', glassTone(light))}>
                  <div className={cn('text-[11px] font-semibold uppercase tracking-[0.12em]', mutedText(light))}>
                    Что будет с отзывом
                  </div>
                  <div className={cn('mt-2 text-[13px] leading-6', mutedText(light))}>
                    Отзыв попадёт в профиль мастера и будет использоваться как подтверждённый отзыв по визиту.
                    Открытая форма без персональной ссылки отключена, чтобы не было накрутки.
                  </div>

                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    <div className={cn('rounded-[12px] border p-3', fieldTone(light))}>
                      <div className={cn('text-[10px]', mutedText(light))}>Рейтинг профиля</div>
                      <div className={cn('mt-1 text-[18px] font-semibold', pageText(light))}>
                        {context?.master.rating ? `${context.master.rating.toFixed(1)} / 5` : 'Новый профиль'}
                      </div>
                    </div>
                    <div className={cn('rounded-[12px] border p-3', fieldTone(light))}>
                      <div className={cn('text-[10px]', mutedText(light))}>Отзывов сейчас</div>
                      <div className={cn('mt-1 text-[18px] font-semibold', pageText(light))}>
                        {context?.master.reviewCount ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              {contextLoading ? (
                <div className="py-12">
                  <div className={cn('text-[30px] font-semibold leading-none tracking-[-0.08em]', pageText(light))}>
                    Загружаем страницу…
                  </div>
                  <p className={cn('mt-3 text-[13px] leading-6', mutedText(light))}>
                    Подтягиваем данные визита и профиля мастера.
                  </p>
                </div>
              ) : done ? (
                <div className="py-10">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-[16px] border border-current/10">
                    <CheckCircle2 className="size-7" />
                  </div>
                  <h1 className="mt-5 text-center text-[34px] font-semibold leading-none tracking-[-0.08em]">
                    {title}
                  </h1>
                  <p className={cn('mx-auto mt-3 max-w-[460px] text-center text-[13px] leading-6', mutedText(light))}>
                    Отзыв уже отправлен мастеру и будет отображаться в его профиле как подтверждённый отзыв.
                  </p>
                </div>
              ) : publicReviewDisabled ? (
                <div className="py-3">
                  <div className={cn('inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[11px] font-medium', fieldTone(light))}>
                    <LockKeyhole className="size-3.5" />
                    Защита от накрутки отзывов
                  </div>
                  <h1 className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.08em]">
                    {title}
                  </h1>
                  <p className={cn('mt-4 text-[13px] leading-6', mutedText(light))}>
                    Оставить отзыв можно только по персональной ссылке, которую клиент получает после завершённого визита.
                    Это защищает профиль мастера от случайных или накрученных отзывов.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className={cn('rounded-[14px] border p-4', fieldTone(light))}>
                      <div className={cn('text-[10px]', mutedText(light))}>Как это работает</div>
                      <div className={cn('mt-2 text-[14px] font-semibold', pageText(light))}>
                        После визита мастер отправляет персональную ссылку на отзыв.
                      </div>
                    </div>
                    <div className={cn('rounded-[14px] border p-4', fieldTone(light))}>
                      <div className={cn('text-[10px]', mutedText(light))}>Что делать клиенту</div>
                      <div className={cn('mt-2 text-[14px] font-semibold', pageText(light))}>
                        Запросить ссылку у мастера или дождаться сообщения после визита.
                      </div>
                    </div>
                  </div>

                  {context?.master.slug ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Link
                        href={`/m/${context.master.slug}`}
                        className={cn(
                          'inline-flex h-11 items-center justify-center rounded-[10px] border px-4 text-[13px] font-semibold transition active:scale-[0.985]',
                          light ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90',
                        )}
                      >
                        Открыть профиль мастера
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : tokenLocked ? (
                <div className="py-6">
                  <div className={cn('inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[11px] font-medium', fieldTone(light))}>
                    <LockKeyhole className="size-3.5" />
                    {context?.status === 'submitted' ? 'Ссылка уже использована' : 'Срок действия ссылки завершён'}
                  </div>
                  <h1 className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.08em]">
                    {title}
                  </h1>
                  <p className={cn('mt-4 text-[13px] leading-6', mutedText(light))}>
                    {context?.status === 'submitted'
                      ? 'По этой персональной ссылке отзыв уже был отправлен. Повторная отправка недоступна.'
                      : 'Эта персональная ссылка больше не активна. Если визит действительно был, мастер может отправить новую ссылку.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  <div>
                    <div className={cn('inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[11px] font-medium', fieldTone(light))}>
                      <ShieldCheck className="size-3.5" />
                      Персональная ссылка клиента
                    </div>
                    <h1 className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.08em]">
                      {title}
                    </h1>
                    <p className={cn('mt-3 text-[13px] leading-6', mutedText(light))}>
                      Поделитесь, как прошёл визит. Отзыв будет привязан к мастеру и услуге автоматически.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_210px]">
                    <div className={cn('rounded-[14px] border p-4', fieldTone(light))}>
                      <div className={cn('text-[10px]', mutedText(light))}>Мастер</div>
                      <div className={cn('mt-1 text-[16px] font-semibold', pageText(light))}>{context?.master.name}</div>
                      <div className={cn('mt-1 text-[11px]', mutedText(light))}>{context?.master.profession || 'Профиль мастера'}</div>
                    </div>
                    <div className={cn('rounded-[14px] border p-4', fieldTone(light))}>
                      <div className={cn('text-[10px]', mutedText(light))}>Услуга</div>
                      <div className={cn('mt-1 text-[16px] font-semibold', pageText(light))}>{context?.booking?.service || 'Визит'}</div>
                      <div className={cn('mt-1 text-[11px]', mutedText(light))}>Подтянуто из записи</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                    <label className="block">
                      <span className={cn('mb-2 block text-[11px] font-medium', mutedText(light))}>Ваше имя</span>
                      <Input
                        value={author}
                        className={inputCss(light)}
                        onChange={(event) => setAuthor(event.target.value)}
                        placeholder="Например: Анна"
                      />
                    </label>

                    <div>
                      <span className={cn('mb-2 block text-[11px] font-medium', mutedText(light))}>Оценка</span>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }, (_, index) => {
                          const active = index < rating;
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setRating(index + 1)}
                              className={cn(
                                'flex size-11 items-center justify-center rounded-[12px] border transition active:scale-[0.97]',
                                active
                                  ? light
                                    ? 'border-black/[0.12] bg-black text-white'
                                    : 'border-white/[0.16] bg-white text-black'
                                  : light
                                    ? 'border-black/[0.08] bg-white text-black/26 hover:text-black'
                                    : 'border-white/[0.08] bg-white/[0.04] text-white/26 hover:text-white',
                              )}
                            >
                              <Star className={cn('size-[18px]', active && 'fill-current')} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <label className="block">
                    <span className={cn('mb-2 block text-[11px] font-medium', mutedText(light))}>Текст отзыва</span>
                    <Textarea
                      value={text}
                      className={cn(inputCss(light), 'min-h-[168px] resize-none py-3')}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="Например: всё аккуратно, комфортно, мастер всё объяснил, помог подобрать вариант и я осталась довольна результатом."
                    />
                  </label>

                  {error ? <div className="text-[12px] text-destructive">{error}</div> : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className={cn('text-[11px] leading-5', mutedText(light))}>
                      Отправляя отзыв, вы подтверждаете, что действительно были на визите.
                    </div>
                    <Button
                      type="submit"
                      disabled={loading || !text.trim() || !canSubmit}
                      className={cn(
                        'h-11 min-w-[220px] rounded-[10px] border text-[13px] font-semibold shadow-none',
                        light ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90',
                      )}
                    >
                      {loading ? 'Отправляем…' : 'Отправить отзыв'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
