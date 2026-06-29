
'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Copy,
  Mail,
  MessageCircleMore,
  PencilLine,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useLocale } from '@/lib/locale-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const TELEGRAM_USERNAME = 'olenchuk_b';
const TELEGRAM_LABEL = '@olenchuk_b';
const TELEGRAM_URL = `https://t.me/${TELEGRAM_USERNAME}`;
const MAIL_ADDRESS = 'hello@klikbuk.rf';

type Intent = 'question' | 'launch' | 'booking' | 'design';

export function TelegramContactWidget() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<Intent>('question');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(max-width: 768px)');
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const copy = useMemo(
    () =>
      locale === 'ru'
        ? {
            trigger: 'Написать',
            subtitle: 'Связаться быстро',
            title: 'Напишите напрямую',
            description:
              'Выберите тему, при необходимости добавьте детали и отправьте сообщение в Телеграм в один клик.',
            helper:
              'Сообщение можно отправить как есть или быстро поправить перед отправкой.',
            replyLabel: 'Обычно отвечаю быстро',
            inputLabel: 'Сообщение',
            inputPlaceholder: 'Коротко опишите задачу, правку или вопрос.',
            telegram: 'Открыть Телеграм',
            email: 'Email',
            copy: 'Скопировать',
            copied: 'Скопировано',
            close: 'Закрыть',
            routeLabel: 'Текущий экран',
            channelsLabel: 'Контакты',
            intents: {
              question: {
                label: 'Вопрос',
                intro: 'Привет! Хочу уточнить один момент по проекту.',
              },
              launch: {
                label: 'Запуск',
                intro: 'Привет! Нужна помощь, чтобы быстро довести и запустить страницу или кабинет.',
              },
              booking: {
                label: 'Записи',
                intro: 'Привет! Есть вопрос по логике записи, заявкам или клиентскому сценарию.',
              },
              design: {
                label: 'Дизайн',
                intro: 'Привет! Хочу обсудить внешний вид, UX или визуальные правки.',
              },
            },
          }
        : {
            trigger: 'Message',
            subtitle: 'Fast contact',
            title: 'Direct message',
            description:
              'Pick a topic, add context if needed, and open a ready-to-send Telegram draft in one click.',
            helper:
              'You can send the draft as is or quickly adjust it before opening Telegram.',
            replyLabel: 'Usually replies fast',
            inputLabel: 'Message',
            inputPlaceholder: 'Briefly describe the task, issue, or feedback.',
            telegram: 'Open Telegram',
            email: 'Email',
            copy: 'Copy',
            copied: 'Copied',
            close: 'Close',
            routeLabel: 'Current screen',
            channelsLabel: 'Contacts',
            intents: {
              question: {
                label: 'Question',
                intro: 'Hi! I have a quick question about the project.',
              },
              launch: {
                label: 'Launch',
                intro: 'Hi! I need help finishing and launching the page or workspace.',
              },
              booking: {
                label: 'Bookings',
                intro: 'Hi! I have a question about booking logic, requests, or the client flow.',
              },
              design: {
                label: 'Design',
                intro: 'Hi! I want to discuss the visual side, UX, or design refinements.',
              },
            },
          },
    [locale],
  );

  const draftMessage = useMemo(() => {
    const base = copy.intents[intent].intro;
    const routeText = pathname ? `${copy.routeLabel}: ${pathname}` : '';
    const detailText = message.trim();

    return [base, routeText, detailText].filter(Boolean).join('\n\n');
  }, [copy, intent, message, pathname]);

  const telegramHref = `${TELEGRAM_URL}?text=${encodeURIComponent(draftMessage)}`;
  const emailHref = `mailto:${MAIL_ADDRESS}?subject=${encodeURIComponent(
    locale === 'ru' ? 'Быстрый запрос по проекту' : 'Quick project request',
  )}&body=${encodeURIComponent(draftMessage)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const shouldHide = isMobile || pathname.startsWith('/dashboard') || pathname.startsWith('/login');

  if (shouldHide) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] md:bottom-6 md:right-6">
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="contact-open"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="pointer-events-auto w-[430px] max-w-[calc(100vw-1.25rem)] overflow-hidden rounded-[32px] border border-border/80 bg-background/95 shadow-[var(--shadow-card)] backdrop-blur-2xl"
          >
            <div className="bg-[radial-gradient(circle_at_top_left,var(--canvas-glow-a),transparent_38%),radial-gradient(circle_at_bottom_right,var(--canvas-glow-b),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/16 bg-primary/10 px-3 py-1 text-[11px] font-medium text-foreground">
                  <Sparkles className="size-3.5 text-primary" />
                  {copy.subtitle}
                </div>

                <button
                  type="button"
                  aria-label={copy.close}
                  onClick={() => setOpen(false)}
                  className="flex size-10 items-center justify-center rounded-[16px] border border-border/80 bg-card/84 text-muted-foreground transition hover:border-primary/18 hover:bg-accent/30 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-[56px_minmax(0,1fr)] items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-primary/18 bg-primary/10 shadow-[var(--shadow-soft)]">
                  <MessageCircleMore className="size-6 text-primary" />
                </div>

                <div className="min-w-0">
                  <div className="text-[18px] font-semibold tracking-[-0.04em] text-foreground">{copy.title}</div>
                  <div className="mt-2 text-[12px] leading-6 text-muted-foreground">{copy.description}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {(Object.keys(copy.intents) as Intent[]).map((key) => {
                  const active = intent === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setIntent(key)}
                      className={cn(
                        'rounded-[20px] border px-3.5 py-3.5 text-left transition',
                        active
                          ? 'border-primary/22 bg-primary/10 text-foreground shadow-[var(--shadow-soft)]'
                          : 'border-border/80 bg-card/76 text-muted-foreground hover:border-primary/16 hover:bg-accent/24 hover:text-foreground',
                      )}
                    >
                      <div className="text-[12px] font-semibold">{copy.intents[key].label}</div>
                      <div className="mt-2 text-[11px] leading-5 opacity-80">{copy.intents[key].intro}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[24px] border border-border/80 bg-card/82 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground">{copy.inputLabel}</div>
                    <div className="mt-1 text-[11px] leading-5 text-muted-foreground">{copy.helper}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/16 bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-foreground">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {copy.replyLabel}
                  </span>
                </div>

                <Textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={copy.inputPlaceholder}
                  className="mt-4 min-h-[116px] rounded-[22px] border-0 bg-background/72"
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_148px]">
                  <div className="rounded-[20px] border border-border/80 bg-background/72 p-3">
                    <div className="text-[11px] text-muted-foreground">{copy.routeLabel}</div>
                    <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-foreground">
                      <PencilLine className="size-3.5 text-primary" />
                      {pathname || '/'}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-border/80 bg-background/72 p-3">
                    <div className="text-[11px] text-muted-foreground">{copy.channelsLabel}</div>
                    <div className="mt-2 flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                      <a
                        href={TELEGRAM_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 transition hover:text-foreground"
                      >
                        {TELEGRAM_LABEL}
                        <ArrowUpRight className="size-3" />
                      </a>
                      <a href={emailHref} className="inline-flex items-center gap-1 transition hover:text-foreground">
                        <Mail className="size-3.5" />
                        {copy.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-border/80 bg-background/78 p-3 text-[12px] leading-6 text-muted-foreground whitespace-pre-line">
                  {draftMessage}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_138px]">
                  <Button asChild className="rounded-full">
                    <a href={telegramHref} target="_blank" rel="noreferrer">
                      <Send className="size-4" />
                      {copy.telegram}
                    </a>
                  </Button>

                  <Button type="button" variant="outline" className="rounded-full" onClick={handleCopy}>
                    <Copy className="size-4" />
                    {copied ? copy.copied : copy.copy}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="contact-closed"
            type="button"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => setOpen(true)}
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-border/80 bg-background/90 px-3.5 py-3 shadow-[var(--shadow-card)] backdrop-blur-xl transition-[background,border-color,box-shadow] hover:border-primary/16 hover:bg-accent/20"
          >
            <div className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-[var(--shadow-soft)]">
              <MessageCircleMore className="size-4 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-[12px] font-semibold text-foreground">{copy.trigger}</div>
              <div className="text-[11px] text-muted-foreground">{TELEGRAM_LABEL}</div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
