'use client';

import { type KeyboardEvent, type ReactNode, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../theme';
import {
  Avatar, Card, ChannelTag, Divider, EmptyState, Icon, NavBtn, ScreenHeader, SearchBox,
} from '../primitives/atoms';
import { MiniBottomSheet } from '../primitives/mini-bottom-sheet';
import { haptic, selectionHaptic, useMiniToast } from '../bridge';
import type { Message, Thread } from '@/lib/mini-demo';
import { useChats } from '@/hooks/use-chats';
import { useMiniData } from '@/hooks/use-mini-data';

function fillTemplate(body: string, thread: Thread): string {
  const firstName = thread.name.split(' ')[0] ?? thread.name;
  const visitDate = thread.nextVisit
    ? new Date(`${thread.nextVisit}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    : 'ближайшую дату';
  return body
    .replaceAll('{{имя}}', firstName).replaceAll('{имя}', firstName)
    .replaceAll('{{дата}}', visitDate).replaceAll('{дата}', visitDate)
    .replaceAll('{{время}}', 'удобное время').replaceAll('{время}', 'удобное время')
    .replaceAll('{{услуга}}', 'визит').replaceAll('{услуга}', 'визит')
    .replaceAll('{{ссылка}}', '').replaceAll('{ссылка}', '');
}

const FALLBACK_TEMPLATES = [
  { id: 'confirm', name: 'Подтверждение', body: 'Здравствуйте, {{имя}}! Подтверждаю вашу запись на {{дата}}. До встречи!' },
  { id: 'remind', name: 'Напоминание', body: 'Напоминаю про визит {{дата}}. Если планы изменились — напишите, перенесём.' },
  { id: 'thanks', name: 'Благодарность', body: 'Спасибо за визит, {{имя}}! Буду рада вас снова.' },
  { id: 'reschedule', name: 'Перенос', body: 'Здравствуйте, {{имя}}. Нам нужно перенести встречу. Когда вам удобно?' },
];

function localIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateWithOffset(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
}

function formatHumanDate(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateIso;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function defaultRescheduleDate(thread: Thread) {
  return thread.bookingDate || thread.nextVisit || dateWithOffset(1);
}

function defaultRescheduleTime(thread: Thread) {
  return thread.bookingTime || '12:30';
}

export function ChatsScreen({ openThread, back }: { openThread: (t: Thread) => void; back?: () => void }) {
  const { threads, loading } = useChats();
  const [q, setQ] = useState('');

  const filtered = useMemo(
    () => threads.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()) || String(t.phone ?? '').includes(q)),
    [q, threads],
  );
  const unreadTotal = threads.reduce((a, t) => a + t.unread, 0);

  return (
    <div>
      <ScreenHeader
        title="Чаты"
        subtitle={loading ? 'Загрузка…' : `${threads.length} переписок · ${unreadTotal} непрочитанных`}
        onBack={back}
      />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SearchBox value={q} onChange={setQ} placeholder="Поиск по чатам" />

        {loading ? (
          <EmptyState icon="loader-circle" title="Загружаем чаты" text="Подтягиваем переписки из реальных каналов." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={q ? 'search-x' : 'messages-square'}
            title={q ? 'Чаты не найдены' : 'Переписок пока нет'}
            text={q ? 'Попробуй изменить запрос.' : 'Новые диалоги появятся после сообщений из Telegram, ВК или формы записи.'}
          />
        ) : (
          <Card padded={false}>
            {filtered.map((t, i) => (
              <Fragment key={t.id}>
                <ThreadRow thread={t} onClick={() => openThread(t)} />
                {i < filtered.length - 1 && <Divider />}
              </Fragment>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function ThreadRow({ thread, onClick }: { thread: Thread; onClick: () => void }) {
  const { T } = useTheme();
  const hasUnread = thread.unread > 0;
  return (
    <div
      onClick={() => { haptic('light'); onClick(); }}
      style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: 'background 0.14s ease, transform 0.12s ease',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={thread.name} size={42} radius={14} />
        {hasUnread && (
          <span style={{
            position: 'absolute', right: -2, top: -2, width: 11, height: 11,
            borderRadius: '50%', background: T.accent, border: `2px solid ${T.card}`,
          }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            minWidth: 0,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: T.text,
          }}>
            {thread.isPriority && <Icon name="star" size={12} color={T.accent} />}
            <span style={{
              minWidth: 0,
              fontSize: 14,
              fontWeight: hasUnread ? 600 : 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{thread.name}</span>
          </div>
          <span style={{ fontSize: 11, color: T.text3, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{thread.time}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            color: hasUnread ? T.text2 : T.text3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{thread.last || 'Нет сообщений'}</div>
          {hasUnread && (
            <span style={{
              minWidth: 20,
              height: 20,
              padding: '0 6px',
              borderRadius: 10,
              background: T.accent,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>{thread.unread > 9 ? '9+' : thread.unread}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 18 }}>
          <ChannelTag channel={thread.channel} />
          {thread.segment === 'new' && (
            <span style={{
              fontSize: 9,
              padding: '2px 6px',
              borderRadius: 999,
              background: `${T.accent}1f`,
              color: T.accent,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}>NEW</span>
          )}
          {thread.botConnected && (
            <span style={{
              fontSize: 9,
              padding: '2px 6px',
              borderRadius: 999,
              background: T.cardElev,
              border: `1px solid ${T.border}`,
              color: T.text3,
              letterSpacing: '0.04em',
            }}>БОТ</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatThreadScreen({ thread: threadProp, back }: { thread: Thread; back: () => void }) {
  const { T, mode } = useTheme();
  const { threads, markRead, sendMessage, deleteThread } = useChats();
  const { TEMPLATES: workspaceTemplates } = useMiniData();
  const { show } = useMiniToast();

  const thread = threads.find((t) => String(t.id) === String(threadProp.id)) ?? threadProp;
  const messages: Message[] = thread.messages ?? [];
  const templates = workspaceTemplates.length > 0 ? workspaceTemplates : FALLBACK_TEMPLATES;

  const [draft, setDraft] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(() => defaultRescheduleDate(thread));
  const [rescheduleTime, setRescheduleTime] = useState(() => defaultRescheduleTime(thread));
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (thread.unread > 0) markRead(thread.id);
  }, [thread.id, thread.unread, markRead]);

  useEffect(() => {
    setRescheduleDate(defaultRescheduleDate(thread));
    setRescheduleTime(defaultRescheduleTime(thread));
    setRescheduleNote('');
  }, [thread.id, thread.bookingDate, thread.bookingTime, thread.nextVisit]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function applyTemplate(body: string) {
    selectionHaptic();
    setDraft(fillTemplate(body, thread));
    setShowTemplates(false);
    setTimeout(() => inputRef.current?.focus(), 40);
  }

  async function send() {
    const text = draft.trim();
    if (!text) return;
    haptic('medium');
    setDraft('');
    setShowTemplates(false);
    await sendMessage(thread.id, text);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
  }

  async function handleDelete() {
    haptic('warning');
    setShowDeleteConfirm(false);
    await deleteThread(thread.id);
    back();
  }

  async function handleProposeReschedule() {
    const date = rescheduleDate.trim();
    const time = rescheduleTime.trim() || '12:30';
    if (!date) {
      show('Выбери дату переноса', 'error');
      return;
    }

    const firstName = thread.name.split(' ')[0] ?? thread.name;
    const dateLabel = formatHumanDate(date);
    const note = rescheduleNote.trim();
    const text = [
      `Здравствуйте, ${firstName}!`,
      '',
      `Предлагаю перенести запись${thread.bookingService ? ` «${thread.bookingService}»` : ''} на ${dateLabel} в ${time}.`,
      note ? `Причина: ${note}` : '',
      '',
      'Если время подходит — нажмите «Подтвердить перенос». Если нет — напишите удобное время.',
    ].filter(Boolean).join('\n');

    haptic('medium');
    setShowReschedule(false);
    setShowTemplates(false);
    await sendMessage(thread.id, text, {
      bookingId: thread.bookingId ?? undefined,
      rescheduleProposal: thread.bookingId ? { date, time } : undefined,
      viaBot: true,
      deliveryState: 'queued',
    });
    markRead(thread.id);
    show(thread.bookingId ? 'Перенос отправлен с кнопками подтверждения' : 'Сообщение о переносе отправлено', 'success');
  }

  const nextVisitLabel = thread.nextVisit
    ? new Date(`${thread.nextVisit}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{
        padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: `1px solid ${T.border}`, background: T.bg, flexShrink: 0,
      }}>
        <NavBtn icon="chevron-left" onClick={back} />
        <Avatar name={thread.name} size={36} radius={18} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: T.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread.name}</div>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
            <ChannelTag channel={thread.channel} />
            {nextVisitLabel && <span>· {nextVisitLabel}</span>}
          </div>
        </div>
        {thread.phone ? (
          <a href={`tel:${thread.phone}`} style={{ display: 'flex', color: T.text2, textDecoration: 'none' }}><NavBtn icon="phone" /></a>
        ) : <NavBtn icon="phone" />}
        <MiniIconButton active={showInfo} icon="info" onClick={() => setShowInfo((v) => !v)} />
        <MiniIconButton icon="trash-2" danger onClick={() => setShowDeleteConfirm(true)} />
      </div>

      {showInfo && (
        <div style={{
          padding: '12px 20px', background: T.cardElev,
          borderBottom: `1px solid ${T.border}`, flexShrink: 0,
          display: 'flex', flexWrap: 'wrap', gap: 16,
          animation: 'mini-scale-in 0.16s ease both',
        }}>
          {thread.phone && <InfoCell icon="phone" label="Телефон"><a href={`tel:${thread.phone}`} style={{ color: T.accent, textDecoration: 'none', fontSize: 13 }}>{thread.phone}</a></InfoCell>}
          <InfoCell icon="message-circle" label="Канал"><span style={{ fontSize: 13, color: T.text }}>{thread.channel}</span></InfoCell>
          {nextVisitLabel && <InfoCell icon="calendar" label="Ближайший визит"><span style={{ fontSize: 13, color: T.text }}>{nextVisitLabel}</span></InfoCell>}
          {thread.botConnected && <InfoCell icon="bot" label="Бот"><span style={{ fontSize: 13, color: T.success }}>Подключён</span></InfoCell>}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState icon="message-circle" title="Сообщений пока нет" text="Напиши первым или используй быстрый шаблон." />
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={`${m.t}-${i}`} m={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: '8px 12px calc(8px + var(--miniapp-safe-bottom, var(--tg-safe-bottom, env(safe-area-inset-bottom, 0px))))',
        borderTop: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.095)' : 'rgba(10,10,10,0.075)'}`,
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        background: mode === 'dark' ? 'rgba(10,10,10,0.70)' : 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px) saturate(1.35)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.35)',
        boxShadow: mode === 'dark' ? '0 -18px 44px rgba(0,0,0,0.42)' : '0 -14px 34px rgba(15,23,42,0.10)',
        position: 'relative',
        zIndex: 50,
      }}>
        <button
          onClick={() => { haptic('light'); setShowReschedule(false); setShowTemplates((value) => !value); }}
          title="Быстрые ответы"
          aria-label="Быстрые ответы"
          style={{
            width: 40, height: 40, borderRadius: 13, flexShrink: 0,
            background: showTemplates ? T.accent : T.cardElev,
            border: `1px solid ${showTemplates ? T.accent : T.border}`,
            color: showTemplates ? '#fff' : T.text2,
            cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.12s ease',
          }}
        >
          <Icon name="zap" size={16} />
        </button>

        <button
          onClick={() => { haptic('light'); setShowTemplates(false); setShowReschedule((value) => !value); }}
          title="Организовать перенос"
          aria-label="Организовать перенос"
          style={{
            width: 40, height: 40, borderRadius: 13, flexShrink: 0,
            background: showReschedule ? T.accent : T.cardElev,
            border: `1px solid ${showReschedule ? T.accent : T.border}`,
            color: showReschedule ? '#fff' : T.text2,
            cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.12s ease',
          }}
        >
          <Icon name="calendar-clock" size={16} color={showReschedule ? '#fff' : T.text2} />
        </button>

        <div style={{
          flex: 1,
          minWidth: 0,
          background: mode === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(10,10,10,0.035)',
          border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(10,10,10,0.06)'}`,
          borderRadius: 14,
          minHeight: 42,
          padding: '0 12px',
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: mode === 'dark' ? 'inset 0 1px 0 rgba(255,255,255,0.025)' : 'inset 0 1px 1px rgba(15,23,42,0.035)',
          transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
          overflow: 'hidden',
        }}>
          <input
            className="cb-mini-transparent cb-mini-input-reset"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Сообщение"
            autoComplete="off"
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              backgroundColor: 'transparent',
              WebkitAppearance: 'none',
              appearance: 'none',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              WebkitBoxShadow: 'none',
              borderRadius: 0,
              padding: 0,
              color: T.text,
              WebkitTextFillColor: T.text,
              caretColor: T.accent,
              fontSize: 16,
              fontFamily: 'inherit',
              colorScheme: mode,
            }}
          />
          {draft.length > 0 && (
            <button onClick={() => { selectionHaptic(); setDraft(''); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: T.text3, display: 'flex', flexShrink: 0 }}>
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        <button
          onClick={() => void send()}
          disabled={!draft.trim()}
          style={{
            width: 40, height: 40, borderRadius: 13, flexShrink: 0,
            background: draft.trim() ? T.accent : T.cardElev,
            border: `1px solid ${draft.trim() ? T.accent : T.border}`,
            color: draft.trim() ? '#fff' : T.text3,
            cursor: draft.trim() ? 'pointer' : 'default',
            padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
          }}
        >
          <Icon name="send" size={16} color={draft.trim() ? '#fff' : T.text3} />
        </button>
      </div>

      <MiniBottomSheet open={showTemplates} onClose={() => setShowTemplates(false)} maxHeight="min(72vh, 430px)" tail>
        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>Быстрые ответы</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Тапни шаблон — подставлю в поле</div>
            </div>
            <button onClick={() => setShowTemplates(false)} style={{ width: 30, height: 30, borderRadius: 10, border: `1px solid ${T.border}`, background: T.cardElev, color: T.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              <Icon name="x" size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {templates.length > 0 ? templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl.body)}
                style={{
                  padding: '11px 12px', borderRadius: 14, fontSize: 13, cursor: 'pointer',
                  background: T.cardElev, border: `1px solid ${T.border}`, color: T.text,
                  fontFamily: 'inherit', textAlign: 'left', lineHeight: 1.35,
                }}
              >
                <span style={{ display: 'block', fontWeight: 600 }}>{tpl.name}</span>
                <span style={{ display: 'block', fontSize: 11, color: T.text3, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.body}</span>
              </button>
            )) : <EmptyState icon="file-text" title="Шаблонов нет" text="Добавь шаблоны сообщений в разделе «Ещё»." />}
          </div>
        </div>
      </MiniBottomSheet>

      <MiniBottomSheet open={showReschedule} onClose={() => setShowReschedule(false)} maxHeight="min(72vh, 520px)" tail={false}>
        <div style={{ padding: '14px 16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 750, color: T.text, letterSpacing: '-0.025em' }}>Организовать перенос</div>
              <div style={{ fontSize: 12, color: T.text3, marginTop: 4, lineHeight: 1.45 }}>
                Отправлю клиенту аккуратное предложение. {thread.bookingId ? 'Кнопки подтверждения добавятся автоматически.' : 'Для этого чата нет привязанной записи — уйдёт обычное сообщение.'}
              </div>
            </div>
            <button onClick={() => setShowReschedule(false)} style={{ width: 32, height: 32, borderRadius: 11, border: `1px solid ${T.border}`, background: T.cardElev, color: T.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
              <Icon name="x" size={15} />
            </button>
          </div>

          <div style={{ padding: 12, borderRadius: 16, border: `1px solid ${T.border}`, background: mode === 'dark' ? 'rgba(255,255,255,0.035)' : 'rgba(10,10,10,0.025)', marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Текущая запись</div>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.45 }}>
              {thread.bookingService || 'Услуга'}{thread.bookingDate ? ` · ${formatHumanDate(thread.bookingDate)}` : ''}{thread.bookingTime ? ` · ${thread.bookingTime}` : ''}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.72fr', gap: 10, marginBottom: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Новая дата</span>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(event) => setRescheduleDate(event.target.value)}
                style={{ height: 44, borderRadius: 14, border: `1px solid ${T.border}`, background: T.inputBg, color: T.text, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Время</span>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(event) => setRescheduleTime(event.target.value)}
                style={{ height: 44, borderRadius: 14, border: `1px solid ${T.border}`, background: T.inputBg, color: T.text, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, marginBottom: 10 }}>
            {[
              ['Завтра', dateWithOffset(1)],
              ['+2 дня', dateWithOffset(2)],
              ['Через неделю', dateWithOffset(7)],
            ].map(([label, date]) => (
              <button
                key={date}
                onClick={() => { selectionHaptic(); setRescheduleDate(date); }}
                style={{ border: `1px solid ${rescheduleDate === date ? T.accent : T.border}`, background: rescheduleDate === date ? T.accentSoft : T.cardElev, color: rescheduleDate === date ? T.accent : T.text2, borderRadius: 999, padding: '8px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {label}
              </button>
            ))}
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Причина, если нужно</span>
            <input
              value={rescheduleNote}
              onChange={(event) => setRescheduleNote(event.target.value)}
              placeholder="Например: освободился другой слот"
              style={{ height: 44, borderRadius: 14, border: `1px solid ${T.border}`, background: T.inputBg, color: T.text, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }}
            />
          </label>

          <button
            onClick={() => void handleProposeReschedule()}
            style={{ width: '100%', height: 46, borderRadius: 16, border: `1px solid ${T.accent}`, background: T.accent, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', fontSize: 14, fontWeight: 800, boxShadow: `0 12px 30px ${T.accent}30` }}
          >
            <Icon name="calendar-clock" size={16} color="#fff" />
            Отправить перенос
          </button>
        </div>
      </MiniBottomSheet>

      <MiniBottomSheet open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} maxHeight="320px" tail>
        <div style={{ padding: '18px 18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Удалить переписку?</div>
              <div style={{ fontSize: 12, color: T.text3, marginTop: 5, lineHeight: 1.45 }}>
                Чат с {thread.name} исчезнет из списка, но записи клиента останутся.
              </div>
            </div>
            <button onClick={() => setShowDeleteConfirm(false)} style={{ width: 32, height: 32, borderRadius: 11, border: `1px solid ${T.border}`, background: T.cardElev, color: T.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
              <Icon name="x" size={15} />
            </button>
          </div>

          <button
            onClick={() => void handleDelete()}
            style={{
              width: '100%',
              padding: '13px 14px',
              borderRadius: 15,
              border: '1px solid rgba(239,68,68,0.28)',
              background: 'rgba(239,68,68,0.12)',
              color: T.danger,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Icon name="trash-2" size={16} />
            Удалить переписку
          </button>
        </div>
      </MiniBottomSheet>
    </div>
  );
}

function MiniIconButton({ icon, active, danger, onClick }: { icon: string; active?: boolean; danger?: boolean; onClick: () => void }) {
  const { T } = useTheme();
  return (
    <button
      onClick={() => { haptic(danger ? 'warning' : 'light'); onClick(); }}
      style={{
        width: 32, height: 32, borderRadius: 10,
        background: active ? T.accent : 'transparent',
        border: `1px solid ${active ? T.accent : danger ? 'rgba(239,68,68,0.24)' : T.border}`,
        color: active ? '#fff' : danger ? T.danger : T.text2,
        cursor: 'pointer', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
      }}
    >
      <Icon name={icon} size={15} />
    </button>
  );
}

function InfoCell({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  const { T } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon name={icon} size={11} color={T.text3} />
        <span style={{ fontSize: 10, color: T.text3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function isBotMessage(text: string) {
  return /(бот|bot|клиент подтвердил|клиенту отправлен|предложен перенос|запись обновлена|новое время|кнопки подтверждения|авто)/i.test(text);
}

function Bubble({ m }: { m: Message }) {
  const { T, mode } = useTheme();
  const me = m.from === 'me';
  const bot = isBotMessage(m.text);
  const bg = bot ? T.cardElev : me ? T.accent : T.msgIn;
  const fg = bot ? T.text : me ? '#fff' : T.text;
  const checkColor = bot ? T.accent : 'rgba(255,255,255,0.82)';
  const meGlow = mode === 'dark'
    ? `0 10px 28px ${T.accent}2f, 0 0 18px ${T.accent}1c, inset 0 1px 0 rgba(255,255,255,0.12)`
    : `0 10px 24px ${T.accent}24, inset 0 1px 0 rgba(255,255,255,0.35)`;
  return (
    <div style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', animation: 'mini-scale-in 0.16s ease both' }}>
      <div style={{
        maxWidth: bot ? '82%' : '78%', padding: bot ? '10px 13px 9px' : '9px 13px', borderRadius: 14,
        borderTopRightRadius: me ? 4 : 14,
        borderTopLeftRadius: me ? 14 : 4,
        background: bg,
        color: fg,
        border: bot ? `1px solid ${T.accentSoft}` : me ? '1px solid rgba(255,255,255,0.13)' : '1px solid transparent',
        boxShadow: bot ? `inset 3px 0 0 ${T.accent}` : me ? meGlow : 'none',
        fontSize: 13, lineHeight: 1.45,
      }}>
        {bot && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: T.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <Icon name="bot" size={12} /> Автосообщение
          </div>
        )}
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</div>
        <div style={{
          fontSize: 9, opacity: bot ? 0.75 : 0.65, marginTop: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
          fontVariantNumeric: 'tabular-nums', color: bot ? T.text3 : undefined,
        }}>
          <span>{m.t}</span>
          {me && <Icon name="check-check" size={10} color={checkColor} />}
        </div>
      </div>
    </div>
  );
}