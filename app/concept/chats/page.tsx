'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Icons } from '@/components/concept/icons';
import { useToast } from '@/components/concept/toast';
import { chats as initialChats, clients, type Chat, type ChatMessage } from '@/components/concept/data';

type TabKey = 'all' | 'unread' | 'bot' | 'archive';

const tabs: { key: TabKey; label: string; filter: (c: Chat) => boolean }[] = [
  { key: 'all', label: 'Все', filter: () => true },
  { key: 'unread', label: 'Непрочит.', filter: (c) => c.unread > 0 },
  { key: 'bot', label: 'Бот', filter: (c) => Boolean(c.isBot) },
  { key: 'archive', label: 'Архив', filter: () => false },
];

const quickReplies = ['Перенесла на 12:00', 'Ждём вас', 'Прайс', 'Адрес', '+ Шаблон'];

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [tab, setTab] = useState<TabKey>('all');
  const [activeId, setActiveId] = useState<string>(chats[0].id);
  const [draft, setDraft] = useState('Виктория, перенесла вас на 12:00. Дина будет ждать. Хорошей дороги.');
  const [searchQ, setSearchQ] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const active = chats.find((c) => c.id === activeId) ?? chats[0];
  const activeClient = clients.find((c) => c.id === active.clientId);

  const visibleChats = useMemo(() => {
    const filter = tabs.find((t) => t.key === tab)!.filter;
    const q = searchQ.trim().toLowerCase();
    return chats.filter((c) => {
      if (!filter(c)) return false;
      if (!q) return true;
      const client = clients.find((cl) => cl.id === c.clientId);
      return client?.name.toLowerCase().includes(q) ?? false;
    });
  }, [chats, tab, searchQ]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [activeId, active.messages.length]);

  const openChat = (id: string) => {
    setActiveId(id);
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: `m${Date.now()}`,
      text,
      side: 'out',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, msg], preview: text, lastTime: 'сейчас' }
          : c,
      ),
    );
    setDraft('');
    toast.push('Сообщение отправлено');
  };

  const insertQuick = (q: string) => {
    if (q.startsWith('+')) {
      toast.push('Открыт редактор шаблонов');
      return;
    }
    setDraft((d) => (d ? `${d} ${q}` : q));
  };

  const unreadTotal = chats.reduce((s, c) => s + c.unread, 0);

  return (
    <>
      <div className="top">
        <div>
          <h1>Чаты</h1>
          <div className="sub">{unreadTotal} непрочитанных · бот ответил 12 раз за сегодня</div>
        </div>
        <div className="spacer" />
        <button className="btn" onClick={() => toast.push('Открыт менеджер шаблонов')}>Шаблоны</button>
        <button className="btn primary" onClick={() => toast.push('Открыт мастер рассылки')}>+ Рассылка</button>
        <div className="avatar">АК</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 320px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', minHeight: 780 }}>
        {/* list */}
        <aside style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="tabs" style={{ width: '100%' }}>
              {tabs.map((t) => (
                <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--soft)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--text-3)' }}>
              <Icons.Search width={13} height={13} />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Поиск по чатам"
                style={{ border: 0, outline: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: 'var(--text)', flex: 1 }}
              />
            </div>
          </div>
          <div style={{ overflow: 'auto', flex: 1, padding: 6 }}>
            {visibleChats.length === 0 ? (
              <div style={{ padding: 24, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>Ничего не найдено</div>
            ) : visibleChats.map((c) => {
              const client = clients.find((cl) => cl.id === c.clientId);
              return (
                <div
                  key={c.id}
                  className={c.id === activeId ? 'on' : ''}
                  onClick={() => openChat(c.id)}
                  style={{ display: 'flex', gap: 11, padding: '11px 10px', borderRadius: 8, cursor: 'pointer', position: 'relative', background: c.id === activeId ? 'var(--soft)' : 'transparent' }}
                  onMouseEnter={(e) => { if (c.id !== activeId) (e.currentTarget as HTMLDivElement).style.background = 'var(--soft)'; }}
                  onMouseLeave={(e) => { if (c.id !== activeId) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  {c.id === activeId && <span style={{ position: 'absolute', left: 0, top: 11, bottom: 11, width: 2, background: 'var(--text)', borderRadius: 2 }} />}
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--paper)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontWeight: 600, color: 'var(--text-2)', fontSize: 12, flexShrink: 0, position: 'relative' }}>
                    {client?.initials}
                    <span style={{ position: 'absolute', right: -3, bottom: -3, width: 14, height: 14, borderRadius: 4, background: 'var(--paper)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 600, color: 'var(--text-2)' }}>{c.channel}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <b style={{ fontSize: 13, fontWeight: 500 }}>{client?.name}</b>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{c.lastTime}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, margin: 0 }}>{c.preview}</p>
                      {c.unread > 0 && <span style={{ background: 'var(--text)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99 }}>{c.unread}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* thread */}
        <section style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--soft)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontWeight: 600, color: 'var(--text-2)', fontSize: 12 }}>{activeClient?.initials}</div>
            <div>
              <b style={{ fontSize: 14.5, fontWeight: 600 }}>{activeClient?.name}</b>
              <span style={{ color: 'var(--text-3)', fontSize: 12, display: 'block', marginTop: 2 }}>
                {activeClient?.segment === 'vip' ? 'VIP · ' : ''}{active.channel} · {active.online ? 'в сети' : 'офлайн'}{activeClient?.nextVisit ? ` · ${activeClient.nextVisit}` : ''}
              </span>
            </div>
            <div className="spacer" />
            <button className="btn" onClick={() => toast.push('Звонок инициирован')}><Icons.Phone width={14} height={14} /> Позвонить</button>
            <button className="btn" onClick={() => toast.push('Открыта форма записи')}><Icons.Plus width={14} height={14} /> Запись</button>
            <button className="btn ghost"><Icons.More width={14} height={14} /></button>
          </div>

          <div ref={threadRef} style={{ flex: 1, padding: '24px 28px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg)' }}>
            <span style={{ alignSelf: 'center', fontSize: 11, color: 'var(--text-3)', background: 'var(--paper)', padding: '4px 10px', borderRadius: 99, border: '1px solid var(--line)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 500 }}>Сегодня</span>

            {active.messages.length === 0 ? (
              <div style={{ alignSelf: 'center', color: 'var(--text-3)', fontSize: 13, padding: 24 }}>
                В этом чате пока нет сообщений
              </div>
            ) : active.messages.map((m) => {
              if (m.card) {
                return (
                  <div key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '62%', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px' }}>
                    <h5 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 10, fontWeight: 600, margin: 0 }}>{m.card.title}</h5>
                    <div style={{ marginTop: 10 }}>
                      {m.card.rows.map((r, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '5px 0', borderBottom: i < m.card!.rows.length - 1 ? '1px solid var(--line)' : '0' }}>
                          <span style={{ color: 'var(--text-3)' }}>{r.label}</span>
                          <b style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', textDecoration: r.strike ? 'line-through' : 'none', color: r.strike ? 'var(--text-3)' : r.good ? 'var(--good)' : 'var(--text)' }}>{r.value}</b>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12 }}>
                      <button className="btn primary" style={{ justifyContent: 'center', fontSize: 12.5 }} onClick={() => toast.push('Запись перенесена на 12:00')}>Перенести</button>
                      <button className="btn" style={{ justifyContent: 'center', fontSize: 12.5 }} onClick={() => toast.push('Откроется выбор времени')}>Другое время</button>
                    </div>
                  </div>
                );
              }
              const isOut = m.side === 'out';
              const isBot = m.side === 'bot';
              return (
                <div key={m.id} style={{
                  maxWidth: '62%', padding: '10px 14px', borderRadius: 12, fontSize: 13.5, lineHeight: 1.5,
                  position: 'relative', border: '1px solid var(--line)',
                  background: isOut ? 'var(--text)' : 'var(--paper)',
                  color: isOut ? '#fff' : 'var(--text-2)',
                  borderColor: isOut ? 'var(--text)' : 'var(--line)',
                  borderStyle: isBot ? 'dashed' : 'solid',
                  alignSelf: isOut ? 'flex-end' : 'flex-start',
                  borderBottomLeftRadius: isOut ? 12 : 4,
                  borderBottomRightRadius: isOut ? 4 : 12,
                }}>
                  {isBot && <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4, fontWeight: 600, color: 'var(--text-3)' }}>Бот · автонапоминание</span>}
                  {m.text}
                  <span style={{ display: 'block', fontSize: 10.5, marginTop: 4, color: isOut ? 'rgba(255,255,255,.7)' : 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{m.time}</span>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--paper)' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {quickReplies.map((q) => (
                <span key={q} className="chip" onClick={() => insertQuick(q)}>{q}</span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 9, padding: '8px 12px' }}>
              <Icons.Paperclip width={16} height={16} color="var(--text-3)" />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Сообщение…"
                style={{ flex: 1, background: 'transparent', border: 0, color: 'var(--text)', outline: 0, fontSize: 13.5, fontFamily: 'inherit' }}
              />
              <button className="btn primary" style={{ height: 30, padding: '0 14px' }} onClick={send} disabled={!draft.trim()}>
                Отправить
              </button>
            </div>
          </div>
        </section>

        {/* context */}
        <aside style={{ padding: 20, borderLeft: '1px solid var(--line)', overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: 'var(--soft)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 16, color: 'var(--text-2)' }}>{activeClient?.initials}</div>
            <b style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{activeClient?.name}</b>
            <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{activeClient?.age} лет · {activeClient?.phone}</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {activeClient?.segment === 'vip' && <span className="pill dark">VIP</span>}
              <span className="pill">{active.channel === 'VK' ? 'VK' : 'Telegram'}</span>
              {activeClient && activeClient.ltv > 50000 && <span className="pill good">LTV ₽{Math.round(activeClient.ltv / 1000)}k</span>}
            </div>
          </div>

          {activeClient?.nextVisit && (
            <>
              <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '.06em', margin: '18px 0 10px', fontWeight: 600 }}>Следующая запись</h4>
              <div style={{ background: 'var(--soft)', border: '1px solid var(--line)', borderRadius: 10, padding: 12 }}>
                <b style={{ fontSize: 13, display: 'block', marginBottom: 3, fontWeight: 500 }}>AirTouch окрашивание</b>
                <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{activeClient.nextVisit} · {activeClient.favMaster}</span>
              </div>
            </>
          )}

          <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '.06em', margin: '18px 0 10px', fontWeight: 600 }}>Профиль</h4>
          {activeClient && (
            <>
              <CtxKv label="Визитов" value={String(activeClient.visits)} />
              <CtxKv label="Сумма" value={`₽${activeClient.ltv.toLocaleString('ru-RU')}`} />
              <CtxKv label="Средний чек" value={`₽${Math.round(activeClient.ltv / Math.max(activeClient.visits, 1)).toLocaleString('ru-RU')}`} />
              <CtxKv label="Любимый мастер" value={activeClient.favMaster} />
              <CtxKv label="Канал" value={activeClient.channel} last />
            </>
          )}

          {activeClient?.note && (
            <>
              <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '.06em', margin: '18px 0 10px', fontWeight: 600 }}>Заметки</h4>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55, background: 'var(--soft)', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>{activeClient.note}</div>
            </>
          )}

          <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid var(--line)', background: 'var(--paper)', borderRadius: 10, borderLeft: '2px solid var(--text)' }}>
            <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 6 }}>AI подсказка</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-2)' }}>
              {activeClient?.name.split(' ')[0]} обычно бронирует уход раз в 6 недель. Следующий визит ожидается ~22 июня. Предложить депозит‑бронь?
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function CtxKv({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 0', borderBottom: last ? 0 : '1px solid var(--line)' }}>
      <span style={{ color: 'var(--text-3)' }}>{label}</span>
      <b style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</b>
    </div>
  );
}
