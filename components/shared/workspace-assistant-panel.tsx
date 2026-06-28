
'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CalendarClock,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Clock3,
  Globe2,
  Link2,
  MapPin,
  MessageCircleQuestion,
  MessageSquareText,
  Palette,
  PanelTop,
  Settings2,
  ShieldCheck,
  Sparkles,
  SquarePen,
  WandSparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { AvailabilityDayInsight, ServiceInsight } from '@/lib/master-workspace';

type AssistantMode = 'client' | 'platform';
type ClientScenario = 'price' | 'slot' | 'location' | 'duration' | 'prep';
type PlatformScenario = 'theme' | 'service' | 'day' | 'weekend' | 'messages' | 'stats';

interface WorkspaceAssistantPanelProps {
  pathname: string;
  locale: 'ru' | 'en';
  open: boolean;
  publicHref: string;
  ownedProfileName?: string;
  profession?: string;
  city?: string;
  phone?: string;
  telegram?: string;
  services?: string[];
  serviceInsights?: ServiceInsight[];
  availability?: AvailabilityDayInsight[];
  onToggle: () => void;
  onNavigate: (href: string) => void;
}

interface ScenarioChip<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  message: string;
}

const panelTransition = {
  type: 'spring',
  stiffness: 340,
  damping: 34,
  mass: 0.9,
};

function getPriceAnswer(
  locale: 'ru' | 'en',
  serviceInsights: ServiceInsight[],
  services: string[],
  publicHref: string,
) {
  const priced = serviceInsights.slice(0, 3);

  if (locale === 'ru') {
    if (priced.length > 0) {
      return `Здравствуйте! Сейчас по услугам ориентир такой:\n${priced.map((item) => `• ${item.name} — от ${item.price.toLocaleString('ru-RU')} ₽`).join('\n')}\n\nУдобное время можно выбрать сразу на странице записи: ${publicHref}`;
    }

    return `Здравствуйте! На странице сейчас доступны услуги:\n${services.slice(0, 4).map((item) => `• ${item}`).join('\n')}\n\nТочную стоимость и время удобнее всего выбрать здесь: ${publicHref}`;
  }

  if (priced.length > 0) {
    return `Hi! Current pricing looks like this:\n${priced.map((item) => `• ${item.name} — from ${item.price.toLocaleString('en-US')} ₽`).join('\n')}\n\nThe easiest way is to open the booking page and choose a convenient time: ${publicHref}`;
  }

  return `Hi! Available services right now:\n${services.slice(0, 4).map((item) => `• ${item}`).join('\n')}\n\nThe easiest way is to open the booking page and choose the exact option here: ${publicHref}`;
}

function getSlotAnswer(
  locale: 'ru' | 'en',
  availability: AvailabilityDayInsight[],
  publicHref: string,
) {
  const nextActiveDay = availability.find((item) => item.status !== 'day-off' && item.slots.length > 0);

  if (locale === 'ru') {
    if (!nextActiveDay) {
      return `Да, актуальные свободные окна лучше посмотреть прямо на странице записи: ${publicHref}\n\nТам сразу видно ближайшие слоты и можно выбрать удобное время без переписки.`;
    }

    return `Да, ближайшие свободные слоты сейчас такие:\n• ${nextActiveDay.label}: ${nextActiveDay.slots.slice(0, 4).join(', ')}\n\nЕсли подходит, можно сразу открыть запись и выбрать удобное время: ${publicHref}`;
  }

  if (!nextActiveDay) {
    return `The easiest way is to check the latest free slots directly on the booking page: ${publicHref}\n\nIt shows the current open times and lets the client choose one without extra back-and-forth.`;
  }

  return `Yes, the nearest free slots right now are:\n• ${nextActiveDay.label}: ${nextActiveDay.slots.slice(0, 4).join(', ')}\n\nIf that works, the client can open the booking page and choose a time here: ${publicHref}`;
}

function getLocationAnswer(
  locale: 'ru' | 'en',
  city?: string,
  phone?: string,
  telegram?: string,
  publicHref?: string,
) {
  if (locale === 'ru') {
    return `Я принимаю${city ? ` в ${city}` : ''}. ${phone ? `Для быстрой связи можно написать или позвонить: ${phone}.` : ''} ${telegram ? `Телеграм: ${telegram}.` : ''}\n\nВсе контакты и запись собраны на странице: ${publicHref}`;
  }

  return `I work${city ? ` in ${city}` : ''}. ${phone ? `For quick confirmation you can call or message: ${phone}.` : ''} ${telegram ? `Telegram: ${telegram}.` : ''}\n\nAll contacts and booking are available here: ${publicHref}`;
}

function getDurationAnswer(
  locale: 'ru' | 'en',
  serviceInsights: ServiceInsight[],
) {
  const items = serviceInsights.slice(0, 3);

  if (locale === 'ru') {
    if (items.length > 0) {
      return `По длительности ориентир такой:\n${items.map((item) => `• ${item.name} — около ${item.durationMinutes} мин.`).join('\n')}\n\nЕсли подскажете, какая именно услуга нужна, можно сразу подобрать подходящее окно.`;
    }

    return 'Обычно точная длительность зависит от выбранной услуги. Если напишете, что именно хотите, я сразу подскажу ориентир по времени.';
  }

  if (items.length > 0) {
    return `Approximate service duration:\n${items.map((item) => `• ${item.name} — about ${item.durationMinutes} min.`).join('\n')}\n\nIf the client tells you the exact service, you can suggest the most suitable slot right away.`;
  }

  return 'Exact duration depends on the selected service. Once the client specifies the service, you can share a more accurate timing.';
}

function getPrepAnswer(locale: 'ru' | 'en') {
  if (locale === 'ru') {
    return 'Перед визитом лучше прийти без спешки за 5–10 минут. Если есть пожелания по дизайну или цвету, можно заранее прислать пример — так встреча пройдёт быстрее и спокойнее.';
  }

  return 'It is best to arrive 5–10 minutes early. If the client has a preferred color or design reference, they can send it in advance to make the visit smoother.';
}

function getPlatformAnswer(
  locale: 'ru' | 'en',
  scenario: PlatformScenario,
) {
  if (locale === 'ru') {
    const answers: Record<PlatformScenario, string> = {
      theme: 'Откройте «Внешний вид» и в блоке общих настроек выберите тему, акцент и характер карточек. Там же можно быстро синхронизировать кабинет и публичную страницу.',
      service: 'Откройте «Профиль», обновите список услуг и сохраните изменения. После этого услуга сразу подтянется на публичную страницу и в автоответы ассистента.',
      day: 'Чтобы закрыть день, откройте «График», добавьте исключение или заблокируйте нужный слот. После этого клиент не увидит это время в записи.',
      weekend: 'Чтобы принимать запись только по выходным, откройте «График» и оставьте активными субботу и воскресенье. Будни можно перевести в выходной или сократить до нуля.',
      messages: 'Откройте «Чаты». Там можно быстро открыть диалог, взять черновик ответа от ассистента и вручную подтвердить его перед отправкой.',
      stats: 'Откройте «Статистика». Сверху видно ключевые показатели, а ниже — услуги, источники клиентов и пиковые часы. Это помогает понять, где теряются записи и что работает лучше всего.',
    };
    return answers[scenario];
  }

  const answers: Record<PlatformScenario, string> = {
    theme: 'Open “Appearance” to change the theme, accent, and card behavior. You can also sync the cabinet style with the public page there.',
    service: 'Open “Profile”, update the service list, and save. The service will immediately appear on the public booking page and inside assistant replies.',
    day: 'To close a day, open “Availability” and add an exception or block the needed slot. Clients will stop seeing that time in booking.',
    weekend: 'To accept bookings only on weekends, open “Availability”, keep Saturday and Sunday active, and mark weekdays as day-off.',
    messages: 'Open “Chats”. There you can open the thread, use a draft reply from the assistant, and approve it manually before sending.',
    stats: 'Open “Stats”. The top shows the core metrics, and below you can review services, traffic sources, and peak hours to understand what drives bookings.',
  };
  return answers[scenario];
}

function getClientScenarios(locale: 'ru' | 'en'): Array<ScenarioChip<ClientScenario>> {
  return locale === 'ru'
    ? [
        {
          id: 'price',
          label: 'Сколько стоит?',
          icon: Sparkles,
          message: 'Здравствуйте, сколько стоит маникюр и как лучше записаться?',
        },
        {
          id: 'slot',
          label: 'Есть окно?',
          icon: CalendarClock,
          message: 'Добрый день, есть ли свободное окно завтра?',
        },
        {
          id: 'location',
          label: 'Где вы находитесь?',
          icon: MapPin,
          message: 'Подскажите, пожалуйста, где вы находитесь и как с вами связаться?',
        },
        {
          id: 'duration',
          label: 'Сколько по времени?',
          icon: Clock3,
          message: 'Сколько примерно занимает процедура и на какое время лучше записаться?',
        },
        {
          id: 'prep',
          label: 'Как подготовиться?',
          icon: ShieldCheck,
          message: 'Нужно ли как-то подготовиться к визиту заранее?',
        },
      ]
    : [
        {
          id: 'price',
          label: 'How much?',
          icon: Sparkles,
          message: 'Hello, how much is the service and what is the easiest way to book?',
        },
        {
          id: 'slot',
          label: 'Any slot?',
          icon: CalendarClock,
          message: 'Hi, do you have any free slot tomorrow?',
        },
        {
          id: 'location',
          label: 'Location?',
          icon: MapPin,
          message: 'Could you please tell me where you are located and the best contact?',
        },
        {
          id: 'duration',
          label: 'How long?',
          icon: Clock3,
          message: 'How long does the procedure usually take and what slot should I choose?',
        },
        {
          id: 'prep',
          label: 'How to prepare?',
          icon: ShieldCheck,
          message: 'Do I need to prepare for the visit in any way beforehand?',
        },
      ];
}

function getPlatformScenarios(locale: 'ru' | 'en'): Array<ScenarioChip<PlatformScenario>> {
  return locale === 'ru'
    ? [
        {
          id: 'theme',
          label: 'Где поменять тему?',
          icon: Palette,
          message: 'Где поменять тему, цвет и общий стиль платформы?',
        },
        {
          id: 'service',
          label: 'Как добавить услугу?',
          icon: SquarePen,
          message: 'Как быстро добавить новую услугу, чтобы она попала на страницу записи?',
        },
        {
          id: 'day',
          label: 'Как закрыть день?',
          icon: PanelTop,
          message: 'Как закрыть определённый день или заблокировать слот?',
        },
        {
          id: 'weekend',
          label: 'Запись только на выходные',
          icon: CalendarRange,
          message: 'Как открыть запись только на субботу и воскресенье?',
        },
        {
          id: 'messages',
          label: 'Как работать с чатами?',
          icon: MessageSquareText,
          message: 'Где быстро ответить клиенту и использовать автоответ ассистента?',
        },
        {
          id: 'stats',
          label: 'Как читать статистику?',
          icon: Settings2,
          message: 'Где посмотреть, что работает лучше и какие услуги приносят записи?',
        },
      ]
    : [
        {
          id: 'theme',
          label: 'Change theme',
          icon: Palette,
          message: 'Where do I change the theme, color, and overall style?',
        },
        {
          id: 'service',
          label: 'Add service',
          icon: SquarePen,
          message: 'How do I add a new service so it appears on the public booking page?',
        },
        {
          id: 'day',
          label: 'Close a day',
          icon: PanelTop,
          message: 'How do I close a certain day or block a time slot?',
        },
        {
          id: 'weekend',
          label: 'Weekends only',
          icon: CalendarRange,
          message: 'How do I accept bookings only on Saturday and Sunday?',
        },
        {
          id: 'messages',
          label: 'Use chats',
          icon: MessageSquareText,
          message: 'Where do I quickly reply to clients and use the assistant drafts?',
        },
        {
          id: 'stats',
          label: 'Read stats',
          icon: Settings2,
          message: 'Where can I see what works better and which services bring bookings?',
        },
      ];
}

function AssistantPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-full px-3 py-1.5 text-[12px] font-medium transition',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {active ? (
        <motion.span
          layoutId="assistant-chip"
          transition={panelTransition}
          className="absolute inset-0 rounded-full border border-border bg-card shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
        />
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function ModeSwitch({
  locale,
  mode,
  setMode,
}: {
  locale: 'ru' | 'en';
  mode: AssistantMode;
  setMode: (mode: AssistantMode) => void;
}) {
  const options = locale === 'ru'
    ? [
        { id: 'client' as const, label: 'Автоответы' },
        { id: 'platform' as const, label: 'Платформа' },
      ]
    : [
        { id: 'client' as const, label: 'Auto-replies' },
        { id: 'platform' as const, label: 'Platform' },
      ];

  return (
    <div className="inline-flex rounded-full border border-border bg-background/70 p-1">
      {options.map((option) => {
        const active = option.id === mode;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setMode(option.id)}
            className={cn(
              'relative rounded-full px-3 py-1.5 text-[12px] font-medium transition',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active ? (
              <motion.span
                layoutId="assistant-mode-pill"
                transition={panelTransition}
                className="absolute inset-0 rounded-full border border-border bg-card shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
              />
            ) : null}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TinyStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 px-3 py-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{children}</div>;
}

export function WorkspaceAssistantPanel({
  pathname,
  locale,
  open,
  publicHref,
  ownedProfileName,
  profession,
  city,
  phone,
  telegram,
  services = [],
  serviceInsights = [],
  availability = [],
  onToggle,
  onNavigate,
}: WorkspaceAssistantPanelProps) {
  const [mode, setMode] = useState<AssistantMode>('client');
  const [clientScenario, setClientScenario] = useState<ClientScenario>('price');
  const [platformScenario, setPlatformScenario] = useState<PlatformScenario>('theme');
  const [draft, setDraft] = useState('');
  const [approved, setApproved] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileLabel = ownedProfileName ?? (locale === 'ru' ? 'вашей страницы' : 'your page');

  const clientScenarios = useMemo(() => getClientScenarios(locale), [locale]);
  const platformScenarios = useMemo(() => getPlatformScenarios(locale), [locale]);

  const selectedClientScenario = clientScenarios.find((item) => item.id === clientScenario) ?? clientScenarios[0];
  const selectedPlatformScenario = platformScenarios.find((item) => item.id === platformScenario) ?? platformScenarios[0];

  const generatedReply = useMemo(() => {
    if (clientScenario === 'price') return getPriceAnswer(locale, serviceInsights, services, publicHref);
    if (clientScenario === 'slot') return getSlotAnswer(locale, availability, publicHref);
    if (clientScenario === 'duration') return getDurationAnswer(locale, serviceInsights);
    if (clientScenario === 'prep') return getPrepAnswer(locale);
    return getLocationAnswer(locale, city, phone, telegram, publicHref);
  }, [availability, city, clientScenario, locale, phone, publicHref, serviceInsights, services, telegram]);

  const generatedPlatformAnswer = useMemo(
    () => getPlatformAnswer(locale, platformScenario),
    [locale, platformScenario],
  );

  useEffect(() => {
    setApproved(false);
    setCopied(false);
    setDraft(mode === 'client' ? generatedReply : generatedPlatformAnswer);
  }, [generatedPlatformAnswer, generatedReply, mode]);

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const contextLabel = useMemo(() => {
    if (pathname.startsWith('/dashboard/appearance')) {
      return locale === 'ru' ? 'Сейчас открыт экран внешнего вида' : 'Appearance screen is open now';
    }
    if (pathname.startsWith('/dashboard/stats')) {
      return locale === 'ru' ? 'Сейчас открыт экран статистики' : 'Stats screen is open now';
    }
    if (pathname.startsWith('/dashboard/chats')) {
      return locale === 'ru' ? 'Сейчас открыт экран чатов' : 'Chats screen is open now';
    }
    if (pathname.startsWith('/dashboard/profile')) {
      return locale === 'ru' ? 'Сейчас открыт экран профиля' : 'Profile screen is open now';
    }
    return locale === 'ru' ? 'Ассистент готов помочь по текущему экрану' : 'Assistant is ready to help on the current screen';
  }, [locale, pathname]);

  const quickLinks = locale === 'ru'
    ? [
        { label: 'Профиль', href: '/dashboard/profile', icon: SquarePen },
        { label: 'Внешний вид', href: '/dashboard/appearance', icon: Palette },
        { label: 'График', href: '/dashboard/availability', icon: CalendarClock },
        { label: 'Страница записи', href: publicHref, icon: Globe2 },
      ]
    : [
        { label: 'Profile', href: '/dashboard/profile', icon: SquarePen },
        { label: 'Appearance', href: '/dashboard/appearance', icon: Palette },
        { label: 'Availability', href: '/dashboard/availability', icon: CalendarClock },
        { label: 'Booking page', href: publicHref, icon: Globe2 },
      ];

  const desktopPanel = (
    <motion.aside
      initial={false}
      animate={{ x: open ? 0 : '100%' }}
      transition={panelTransition}
      className="pointer-events-auto fixed inset-y-0 right-0 z-50 hidden lg:flex"
      style={{ width: 428 }}
    >
      <div className="flex h-full w-full flex-col border-l border-border/90 bg-card/95 px-4 py-4 shadow-[-24px_0_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="rounded-[24px] border border-border bg-background/60 p-3">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[16px] border border-primary/18 bg-primary/10 text-primary">
              <WandSparkles className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {locale === 'ru' ? 'Ваш ассистент' : 'Your assistant'}
                  </div>
                  <div className="mt-1 text-base font-semibold text-foreground">
                    {mode === 'client'
                      ? locale === 'ru' ? 'AI-автоответы клиентам' : 'AI auto-replies'
                      : locale === 'ru' ? 'Помощник по платформе' : 'Platform helper'}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onToggle} className="rounded-full">
                  <ChevronRight className="size-4" />
                </Button>
              </div>

              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                {locale === 'ru'
                  ? 'Структурированные ответы, подсказки и быстрые переходы без лишнего шума.'
                  : 'Structured answers, guidance, and quick actions without extra noise.'}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ModeSwitch locale={locale} mode={mode} setMode={setMode} />
                <div className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {contextLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="scrollbar-thin mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {mode === 'client' ? (
            <>
              <div className="rounded-[24px] border border-border bg-background/60 p-3">
                <SectionLabel>{locale === 'ru' ? 'Сценарий клиента' : 'Client scenario'}</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {clientScenarios.map((scenario) => {
                    const active = scenario.id === clientScenario;
                    return (
                      <AssistantPill
                        key={scenario.id}
                        active={active}
                        onClick={() => {
                          setClientScenario(scenario.id);
                        }}
                      >
                        {scenario.label}
                      </AssistantPill>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-background/60 p-3">
                <SectionLabel>{locale === 'ru' ? 'Входящее сообщение' : 'Incoming message'}</SectionLabel>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                    <MessageCircleQuestion className="size-4" />
                  </div>
                  <div className="max-w-[92%] rounded-[18px] border border-border bg-card px-3 py-3 text-sm leading-6 text-foreground">
                    {selectedClientScenario.message}
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/18 bg-primary/10 text-primary">
                    <Bot className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 rounded-[20px] border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-foreground">
                        {locale === 'ru' ? 'Черновик ответа' : 'Reply draft'}
                      </div>
                      <div className="rounded-full border border-primary/15 bg-primary/8 px-2 py-1 text-[11px] font-medium text-primary">
                        {locale === 'ru' ? 'Требует подтверждения' : 'Needs approval'}
                      </div>
                    </div>
                    <Textarea
                      value={draft}
                      onChange={(event) => {
                        setApproved(false);
                        setDraft(event.target.value);
                      }}
                      className="mt-3 min-h-[156px] rounded-[18px] border border-border bg-background/80 px-4 py-3 text-sm leading-6 shadow-none"
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setApproved(true);
                          setCopied(false);
                        }}
                        className="h-10 rounded-xl"
                      >
                        <Check className="size-4" />
                        {approved
                          ? locale === 'ru' ? 'Подтверждено' : 'Approved'
                          : locale === 'ru' ? 'Подтвердить' : 'Approve'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={copyDraft}
                        className="h-10 rounded-xl border border-border bg-background/70 hover:bg-card"
                      >
                        <Clipboard className="size-4" />
                        {copied
                          ? locale === 'ru' ? 'Скопировано' : 'Copied'
                          : locale === 'ru' ? 'Скопировать' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <TinyStat
                  label={locale === 'ru' ? 'Профиль' : 'Profile'}
                  value={ownedProfileName ?? (locale === 'ru' ? 'Страница мастера' : 'Specialist page')}
                  icon={Link2}
                />
                <TinyStat
                  label={locale === 'ru' ? 'Услуги' : 'Services'}
                  value={String(serviceInsights.length || services.length || 0)}
                  icon={Sparkles}
                />
                <TinyStat
                  label={locale === 'ru' ? 'Город' : 'City'}
                  value={city || (locale === 'ru' ? 'Не указан' : 'Not set')}
                  icon={MapPin}
                />
                <TinyStat
                  label={locale === 'ru' ? 'Страница записи' : 'Booking page'}
                  value={locale === 'ru' ? 'Готова к отправке' : 'Ready to share'}
                  icon={Globe2}
                />
              </div>

              <div className="rounded-[24px] border border-border bg-background/60 p-3">
                <SectionLabel>{locale === 'ru' ? 'Быстрые действия' : 'Quick actions'}</SectionLabel>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(publicHref)}
                    className="inline-flex items-center justify-between rounded-[18px] border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/20 hover:bg-background"
                  >
                    <span>{locale === 'ru' ? 'Открыть страницу записи' : 'Open booking page'}</span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </button>
                  <div className="rounded-[18px] border border-border bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
                    {locale === 'ru'
                      ? `Подстановка идёт из ${profileLabel}, услуг, контактов и доступных слотов.`
                      : `The reply uses ${profileLabel}, services, contacts, and available slots.`}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-[24px] border border-border bg-background/60 p-3">
                <SectionLabel>{locale === 'ru' ? 'Темы помощи' : 'Help topics'}</SectionLabel>
                <div className="mt-3 grid gap-2">
                  {platformScenarios.map((scenario) => {
                    const Icon = scenario.icon;
                    const active = scenario.id === platformScenario;
                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => setPlatformScenario(scenario.id)}
                        className={cn(
                          'flex items-start gap-3 rounded-[18px] border px-3 py-3 text-left transition',
                          active ? 'border-primary/20 bg-primary/10' : 'border-border bg-card hover:bg-background',
                        )}
                      >
                        <div className={cn(
                          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[14px] border',
                          active
                            ? 'border-primary/16 bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground',
                        )}>
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={cn('text-sm font-semibold', active ? 'text-primary' : 'text-foreground')}>
                            {scenario.label}
                          </div>
                          <div className="mt-1 text-sm leading-6 text-muted-foreground">{scenario.message}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-background/60 p-3">
                <SectionLabel>{locale === 'ru' ? 'Подсказка ассистента' : 'Assistant answer'}</SectionLabel>
                <div className="mt-3 rounded-[20px] border border-border bg-card p-4 text-sm leading-7 text-foreground">
                  {generatedPlatformAnswer}
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-background/60 p-3">
                <SectionLabel>{locale === 'ru' ? 'Переходы по платформе' : 'Platform shortcuts'}</SectionLabel>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => onNavigate(item.href)}
                        className="inline-flex items-center justify-between rounded-[18px] border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/20 hover:bg-background"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Icon className="size-4 text-primary" />
                          {item.label}
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-background/60 p-3">
                <SectionLabel>{locale === 'ru' ? 'Что умеет сейчас' : 'What it handles now'}</SectionLabel>
                <div className="mt-3 space-y-2">
                  {(locale === 'ru'
                    ? [
                        'Объясняет, где менять тему, стиль и поведение платформы.',
                        'Подсказывает, как добавлять услуги и выводить их на публичную страницу.',
                        'Показывает, как закрывать день и ограничивать запись по дням недели.',
                        'Держит автоответы клиентам в одном месте с ручным подтверждением.',
                        'Быстро переводит в нужный раздел без поиска по меню.',
                      ]
                    : [
                        'Explains where to change the theme, style, and platform behavior.',
                        'Shows how to add services and publish them on the public page.',
                        'Explains how to close a day and limit booking to selected weekdays.',
                        'Keeps client auto-replies in one place with manual approval.',
                        'Jumps to the required screen without searching through the menu.',
                      ]).map((item) => (
                    <div
                      key={item}
                      className="rounded-[18px] border border-border bg-card px-4 py-3 text-sm leading-6 text-muted-foreground"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-y-0 right-0 z-50 hidden lg:block">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'pointer-events-auto absolute right-0 top-1/2 flex h-[172px] w-[54px] -translate-y-1/2 select-none flex-col items-center justify-between rounded-l-[18px] border border-r-0 border-border bg-card/96 px-2 py-3 text-muted-foreground shadow-[-10px_10px_28px_rgba(0,0,0,0.12)] backdrop-blur-xl transition hover:text-foreground',
            open && 'text-foreground',
          )}
          aria-label={locale === 'ru' ? 'Открыть помощника' : 'Open assistant'}
          title={locale === 'ru' ? 'Ваш ассистент' : 'Your assistant'}
        >
          <div className="flex size-8 items-center justify-center rounded-full border border-primary/16 bg-primary/10 text-primary">
            <Bot className="size-4" />
          </div>
          <span className="rotate-180 text-[10px] font-semibold uppercase tracking-[0.24em] [text-orientation:mixed] [writing-mode:vertical-rl]">
            {locale === 'ru' ? 'Ваш ассистент' : 'Your assistant'}
          </span>
          <div className="flex size-8 items-center justify-center rounded-full border border-border bg-background/80">
            {open ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </div>
        </button>
      </div>

      {desktopPanel}

      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        <Button type="button" className="h-12 rounded-full px-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)]" onClick={onToggle}>
          <Bot className="size-4" />
          {locale === 'ru' ? 'Ассистент' : 'Assistant'}
        </Button>
      </div>

      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-40 bg-black/28 backdrop-blur-[1px] lg:hidden"
        onClick={onToggle}
      >
        <motion.div
          initial={false}
          animate={{ y: open ? 0 : 24, opacity: open ? 1 : 0 }}
          transition={panelTransition}
          className="absolute inset-x-3 bottom-3 top-20 rounded-[28px] border border-border bg-card/96 p-4 shadow-[0_22px_60px_rgba(0,0,0,0.24)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bot className="size-4 text-primary" />
              {locale === 'ru' ? 'Ваш ассистент' : 'Your assistant'}
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={onToggle} className="rounded-full">
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="grid h-[calc(100%-3.25rem)] min-h-0 grid-rows-[auto_1fr] gap-3">
            <div className="rounded-[20px] border border-border bg-background/70 p-2">
              <ModeSwitch locale={locale} mode={mode} setMode={setMode} />
            </div>

            <div className="scrollbar-thin min-h-0 overflow-y-auto pr-1">
              {mode === 'client' ? (
                <div className="space-y-3">
                  <div className="rounded-[22px] border border-border bg-background/60 p-3">
                    <SectionLabel>{locale === 'ru' ? 'Сценарий клиента' : 'Client scenario'}</SectionLabel>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {clientScenarios.map((scenario) => (
                        <AssistantPill
                          key={scenario.id}
                          active={scenario.id === clientScenario}
                          onClick={() => setClientScenario(scenario.id)}
                        >
                          {scenario.label}
                        </AssistantPill>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-border bg-background/60 p-3">
                    <SectionLabel>{locale === 'ru' ? 'Черновик ответа' : 'Reply draft'}</SectionLabel>
                    <Textarea
                      value={draft}
                      onChange={(event) => {
                        setApproved(false);
                        setDraft(event.target.value);
                      }}
                      className="mt-3 min-h-[160px] rounded-[18px] border border-border bg-card px-4 py-3 text-sm leading-6 shadow-none"
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button type="button" onClick={() => setApproved(true)} className="h-10 rounded-xl">
                        <Check className="size-4" />
                        {approved
                          ? locale === 'ru' ? 'Подтверждено' : 'Approved'
                          : locale === 'ru' ? 'Подтвердить' : 'Approve'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={copyDraft} className="h-10 rounded-xl border border-border bg-card">
                        <Clipboard className="size-4" />
                        {copied
                          ? locale === 'ru' ? 'Скопировано' : 'Copied'
                          : locale === 'ru' ? 'Скопировать' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-[22px] border border-border bg-background/60 p-3">
                    <SectionLabel>{locale === 'ru' ? 'Темы помощи' : 'Help topics'}</SectionLabel>
                    <div className="mt-3 grid gap-2">
                      {platformScenarios.map((scenario) => (
                        <AssistantPill
                          key={scenario.id}
                          active={scenario.id === platformScenario}
                          onClick={() => setPlatformScenario(scenario.id)}
                        >
                          {scenario.label}
                        </AssistantPill>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-border bg-background/60 p-3 text-sm leading-7 text-foreground">
                    {generatedPlatformAnswer}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
