import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SERVICES, CLIENTS, CHATS, TEMPLATES, pluralize } from '../desktop-html-data';
import { Icon, Avatar, Badge, Card, Btn, Switch, Check, Tabs, TabsUnderline, Segmented, Empty, Metric, Spark } from '../desktop-html-ui';

/* Chats page — функциональный современный чат-CRM
   - sticky three-column layout (page никогда не выходит за viewport)
   - pinned, group sections, filters
   - reactions, replies, voice/file/booking messages
   - templates dropdown ("/")
   - scroll-to-bottom, unread divider, read receipts
   - client side panel
*/

const EMOJI_PICKER = ['❤️', '👍', '🌿', '🙏', '🔥', '👏', '😊', '✨'];

export function ChatsPage({ platform, setPage, onCreate, onNotif, onToggleTheme, theme = 'light' }) {
  const chats = platform?.chats || CHATS;
  const clients = platform?.clients || CLIENTS;
  const services = platform?.services || SERVICES;
  const templates = platform?.templates || TEMPLATES;
  const [activeId, setActiveId] = useState(() => {
    if (typeof window !== 'undefined') {
      const clientId = window.sessionStorage?.getItem('clickbook-active-chat-client');
      const target = chats.find((chat) => chat.clientId === clientId);
      if (target) return target.id;
    }
    return chats[0]?.id || 'ch1';
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState(null);            // {chatId, message}
  const [tmplOpen, setTmplOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [scrolledUp, setScrolledUp] = useState(false);
  const [proposeTimeOpen, setProposeTimeOpen] = useState(false);
  const [sendServiceOpen, setSendServiceOpen] = useState(false);
  const [requestPayOpen, setRequestPayOpen] = useState(false);
  const [pinned, setPinned] = useState(() => new Set(chats.filter(c => c.pinned).map(c => c.id)));
  const [pinnedMsgs, setPinnedMsgs] = useState(() => ({
    ch1: 'm3', // booking is pinned
  }));

  const composerRef = useRef(null);
  const scrollRef = useRef(null);

  const [store, setStore] = useState(() => Object.fromEntries(chats.map(c => [c.id, c.messages])));
  const [unread, setUnread] = useState(() => Object.fromEntries(chats.map(c => [c.id, c.unread])));

  useEffect(() => {
    setStore(Object.fromEntries(chats.map(c => [c.id, c.messages || []])));
    setUnread(Object.fromEntries(chats.map(c => [c.id, c.unread || 0])));
    setPinned(new Set(chats.filter(c => c.pinned).map(c => c.id)));

    if (typeof window !== 'undefined') {
      const clientId = window.sessionStorage?.getItem('clickbook-active-chat-client');
      const target = chats.find((chat) => chat.clientId === clientId);
      if (target) {
        setActiveId(target.id);
        window.sessionStorage?.removeItem('clickbook-active-chat-client');
        return;
      }
    }

    setActiveId((current) => (chats.some((chat) => chat.id === current) ? current : chats[0]?.id || ''));
  }, [chats]);

  const filtered = chats.filter(ch => {
    const c = clients.find(c => c.id === ch.clientId);
    if (filter === 'unread' && !unread[ch.id]) return false;
    if (filter === 'booking' && c?.next === '—') return false;
    if (filter === 'pinned' && !pinned.has(ch.id)) return false;
    if (search && !c?.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // group: pinned / today / earlier
  const pinnedChats  = filtered.filter(ch => pinned.has(ch.id));
  const todayChats   = filtered.filter(ch => !pinned.has(ch.id) && /^\d{2}:\d{2}$/.test(ch.time));
  const earlierChats = filtered.filter(ch => !pinned.has(ch.id) && !/^\d{2}:\d{2}$/.test(ch.time));

  const active = chats.find(ch => ch.id === activeId);
  const activeClient = active ? (clients.find(c => c.id === active.clientId) || {
    id: active.clientId || active.id,
    name: active.clientName || 'Клиент',
    phone: active.clientPhone || '',
    visits: 0,
    last: active.lastSeen || '—',
    next: '—',
    status: 'new',
    notes: '',
  }) : null;
  const activeMsgs = active ? store[active.id] : [];
  const firstUnreadIdx = useMemo(() => {
    if (!active) return -1;
    const u = active.unread;
    if (!u) return -1;
    return Math.max(0, (store[active.id]?.length || 0) - u);
  }, [activeId]);

  useEffect(() => {
    if (!active) return;
    if (unread[active.id]) {
      setUnread((current) => ({ ...current, [active.id]: 0 }));
      platform?.markChatRead?.(active.id);
    }
  }, [activeId, active, unread, platform]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeId]);

  // recording timer
  useEffect(() => {
    if (!recording) { setRecTime(0); return; }
    const t = setInterval(() => setRecTime(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setScrolledUp(el.scrollHeight - el.scrollTop - el.clientHeight > 220);
  };
  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  const sendMessage = (text) => {
    text = (text ?? draft).trim();
    if (!text || !active) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const newMsg = platform?.sendChatMessage?.(active.id, {
      text,
      ...(reply ? { replyTo: reply.message.id } : {}),
    }) || { id: `m${Date.now()}`, from: 'me', text, time, read: false, ...(reply ? { replyTo: reply.message.id } : {}) };
    setStore({ ...store, [active.id]: [...activeMsgs, newMsg] });
    setDraft('');
    setReply(null);
    setTmplOpen(false);
    setTimeout(scrollToBottom, 30);
  };

  const sendSpecial = (msg) => {
    if (!active) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const newMsg = platform?.sendChatMessage?.(active.id, msg) || { id: `m${Date.now()}`, from: 'me', time, read: false, ...msg };
    setStore({ ...store, [active.id]: [...activeMsgs, newMsg] });
    setTimeout(scrollToBottom, 30);
  };

  const addReaction = (msgId, emoji) => {
    setStore(s => ({
      ...s,
      [active.id]: s[active.id].map(m => {
        if (m.id !== msgId) return m;
        const rs = (m.reactions || []).filter(r => !r.mine);
        const had = (m.reactions || []).find(r => r.mine && r.e === emoji);
        return { ...m, reactions: had ? rs : [...rs, { e: emoji, mine: true }] };
      })
    }));
  };

  const togglePin = (id) => {
    setPinned(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !tmplOpen) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === '/' && !draft) {
      e.preventDefault();
      setAttachOpen(false);
      setEmojiOpen(false);
      setTmplOpen(true);
    }
    if (e.key === 'Escape') {
      setTmplOpen(false);
      setAttachOpen(false);
      setEmojiOpen(false);
      setReply(null);
    }
  };

  // detect "/" at start of draft → open templates
  useEffect(() => {
    if (draft.startsWith('/')) {
      setAttachOpen(false);
      setEmojiOpen(false);
      setTmplOpen(true);
    } else if (tmplOpen && !draft.startsWith('/')) {
      setTmplOpen(false);
    }
  }, [draft]);

  // click-outside to close popovers
  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest('.composer') && !e.target.closest('.attach-menu') && !e.target.closest('.emoji-panel') && !e.target.closest('.tmpl-menu')) {
        setAttachOpen(false);
        setEmojiOpen(false);
        setTmplOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const stopRecording = (send = true) => {
    if (send && recTime > 0) {
      const mm = String(Math.floor(recTime / 60)).padStart(1, '0');
      const ss = String(recTime % 60).padStart(2, '0');
      sendSpecial({ type: 'voice', dur: `${mm}:${ss}` });
    }
    setRecording(false);
  };

  const totalUnread = Object.values(unread).filter(Boolean).length;
  const isWorkMode = platform?.demoMode === false;
  const workspaceReady = platform?.workspaceReady !== false;

  if (isWorkMode && !workspaceReady) {
    return <ChatEmptyState icon="refresh" title="Подключаем рабочий кабинет" body="Проверяем авторизацию и загружаем реальные диалоги." />;
  }

  if (isWorkMode && !platform?.isLive) {
    return <ChatEmptyState icon="shield" title="Войдите в рабочий кабинет" body="В рабочем режиме демо-диалоги не показываются. После входа здесь появятся реальные чаты клиентов." />;
  }

  if (isWorkMode && chats.length === 0) {
    return <ChatEmptyState icon="chat" title="Пока нет рабочих чатов" body="Реальные диалоги подтянутся из рабочего места, когда клиенты начнут писать или появятся треды в /api/chats." />;
  }

  return (
    <div data-screen-label="04 Chats" className="page-fixed chat-full">
      <div className="page-head">
        <div>
          <h1 className="page-title">Чаты</h1>
          <p className="page-subtitle">
            {chats.length} {pluralize(chats.length,'диалог','диалога','диалогов')}
            {totalUnread > 0 && <> · <strong style={{ color: 'var(--text)' }}>{totalUnread} непрочитанных</strong></>}
            <span className="muted"> · </span>
            быстрый ответ — нажмите «/» в поле сообщения
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn kind="secondary" icon="sparkle" onClick={() => {
            setAttachOpen(false);
            setEmojiOpen(false);
            setTmplOpen((o) => !o);
            composerRef.current?.focus();
          }}>Шаблоны</Btn>
          <Btn kind="secondary" icon="filter" onClick={() => {
            const order = ['all', 'unread', 'pinned', 'booking'];
            setFilter((current) => order[(order.indexOf(current) + 1) % order.length]);
          }}>Фильтры</Btn>
          <Btn kind="primary" icon="edit" onClick={() => {
            composerRef.current?.focus();
          }}>Написать клиенту</Btn>
        </div>
      </div>

      <div className="page-body">
        <div className="chat-app">

          {/* ============= LIST COLUMN ============= */}
          <div className="chat-col list">
            <div className="chat-list-head">
              <div className="chat-sidebar-top chat-ecosystem-top">
                <button type="button" className="chat-back-button" onClick={() => setPage?.('dashboard')} aria-label="Вернуться в кабинет">
                  <Icon name="chevron-left" size={13} />
                  Назад
                </button>
                <div className="chat-ecosystem-title" aria-label="Чаты">
                  <strong>Чаты</strong>
                  <em>единый inbox</em>
                </div>
              </div>
              <div className="chat-sidebar-summary">
                <strong>{chats.length} диалогов</strong>
                {totalUnread > 0 && <span>{totalUnread} непрочит.</span>}
              </div>
              <div className="input-with-icon">
                <Icon name="search" />
                <input className="input" placeholder="Поиск по диалогам" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { v: 'all',     label: 'Все',         c: chats.length },
                  { v: 'unread',  label: 'Новые',       c: totalUnread },
                  { v: 'pinned',  label: 'Закреп.',     c: pinned.size },
                  { v: 'booking', label: 'С записью',   c: chats.filter(ch => clients.find(c=>c.id===ch.clientId)?.next !== '—').length },
                ].map(f => (
                  <button key={f.v} className={`chip ${filter === f.v ? 'active' : ''}`} onClick={() => setFilter(f.v)}>
                    {f.label}
                    {f.c > 0 && <span style={{ opacity: 0.6, fontSize: 10.5 }}>{f.c}</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="chat-list-body">
              {filtered.length === 0 && (
                <Empty icon="search" title="Ничего не найдено" body="Попробуйте изменить запрос" />
              )}

              {pinnedChats.length > 0 && (
                <>
                  <div className="chat-group-label">
                    <Icon name="pin" size={11} /> Закреплённые
                    <span className="pill">{pinnedChats.length}</span>
                  </div>
                  {pinnedChats.map(ch => (
                    <ChatRow key={ch.id} ch={ch} active={ch.id === activeId} unread={unread[ch.id]}
                      onClick={() => setActiveId(ch.id)} lastMsg={lastMessageOf(store[ch.id])}
                      clients={clients}
                      pinned onPin={() => togglePin(ch.id)} />
                  ))}
                </>
              )}

              {todayChats.length > 0 && (
                <>
                  <div className="chat-group-label">
                    Сегодня <span className="pill">{todayChats.length}</span>
                  </div>
                  {todayChats.map(ch => (
                    <ChatRow key={ch.id} ch={ch} active={ch.id === activeId} unread={unread[ch.id]}
                      onClick={() => setActiveId(ch.id)} lastMsg={lastMessageOf(store[ch.id])}
                      clients={clients}
                      pinned={pinned.has(ch.id)} onPin={() => togglePin(ch.id)} />
                  ))}
                </>
              )}

              {earlierChats.length > 0 && (
                <>
                  <div className="chat-group-label">
                    Раньше <span className="pill">{earlierChats.length}</span>
                  </div>
                  {earlierChats.map(ch => (
                    <ChatRow key={ch.id} ch={ch} active={ch.id === activeId} unread={unread[ch.id]}
                      onClick={() => setActiveId(ch.id)} lastMsg={lastMessageOf(store[ch.id])}
                      clients={clients}
                      pinned={pinned.has(ch.id)} onPin={() => togglePin(ch.id)} />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* ============= CONVERSATION COLUMN ============= */}
          {active ? (
            <div className="chat-col conv">
              {/* Header */}
              <div className="conv-head">
                <div style={{ position: 'relative' }}>
                  <Avatar name={activeClient.name} size="lg" />
                  <span className={`chat-online-dot ${active.online ? '' : 'offline'}`} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15.5, fontWeight: 600 }}>{activeClient.name}</span>
                    <StatusBadge status={activeClient.status} />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    {active.online
                      ? <><span className="dot success" style={{ width: 6, height: 6 }} /> в сети</>
                      : <><span className="dot" style={{ width: 6, height: 6 }} /> был(а) {active.lastSeen || 'недавно'}</>
                    }
                    <span style={{ color: 'var(--text-4)' }}>·</span>
                    {activeClient.visits} {pluralize(activeClient.visits, 'визит', 'визита', 'визитов')}
                    <span style={{ color: 'var(--text-4)' }}>·</span>
                    последний {activeClient.last}
                  </div>
                </div>
                <button className="btn btn-ghost icon" data-tip="Позвонить"><Icon name="phone" size={14} /></button>
                <button className="btn btn-ghost icon" data-tip="Поиск в чате"><Icon name="search" size={14} /></button>
                <button className="btn btn-ghost icon" onClick={() => togglePin(active.id)} data-tip={pinned.has(active.id) ? 'Открепить' : 'Закрепить'}>
                  <Icon name="pin" size={14} style={{ color: pinned.has(active.id) ? 'var(--accent)' : undefined }} />
                </button>
                <div className="chat-screen-actions">
                  <button
                    type="button"
                    className="btn btn-ghost icon"
                    onClick={onToggleTheme}
                    data-tip={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
                    aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
                  >
                    <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} />
                  </button>
                  <button type="button" className="btn btn-ghost icon" onClick={onNotif} data-tip="Уведомления" aria-label="Уведомления">
                    <Icon name="bell" size={14} />
                    <span className="notif-dot" />
                  </button>
                  <button type="button" className="btn btn-primary sm" onClick={onCreate}>
                    <Icon name="plus" size={12} /> Запись
                  </button>
                </div>
              </div>

              {/* Pinned-message bar */}
              {pinnedMsgs[active.id] && (() => {
                const pm = activeMsgs.find(m => m.id === pinnedMsgs[active.id]);
                if (!pm) return null;
                const preview = pm.text
                  || (pm.type === 'booking' ? `Запись · ${services.find(s => s.id === pm.booking.serviceId)?.name} · ${pm.booking.date}, ${pm.booking.time}` :
                      pm.type === 'service' ? `Услуга · ${pm.service?.name}` :
                      pm.type === 'payment' ? `Счёт · ${Number(pm.payment?.amount || 0).toLocaleString('ru-RU')} ${pm.payment?.currency || '₽'}` :
                      pm.type === 'time-proposal' ? `Окна · ${(pm.slots || []).length}` :
                      pm.type === 'voice' ? 'Голосовое сообщение' :
                      pm.type === 'file'  ? `Файл · ${pm.fileName}` : '');
                return (
                  <div className="pinned-bar">
                    <div className="pin-icon"><Icon name="pin" size={11} /></div>
                    <div className="pin-text">
                      <strong>Закреплено</strong>
                      {preview}
                    </div>
                    <button className="btn btn-ghost icon" data-tip="Открепить"
                      onClick={() => setPinnedMsgs({ ...pinnedMsgs, [active.id]: null })}>
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                );
              })()}

              {/* Quick action toolbar */}
              <div className="conv-toolbar">
                <Btn size="sm" kind="soft" icon="plus" onClick={() => sendSpecial({
                  type: 'booking',
                  booking: { serviceId: 's4', date: 'Чт, 28 мая', time: '16:00', dur: 75, price: 3800 },
                  text: 'Подтверждение записи',
                })}>Отправить запись</Btn>
                <Btn size="sm" kind="ghost" icon="calendar" onClick={() => setProposeTimeOpen(true)}>Предложить время</Btn>
                <Btn size="sm" kind="ghost" icon="services" onClick={() => setSendServiceOpen(true)}>Прислать услугу</Btn>
                <Btn size="sm" kind="ghost" icon="card" onClick={() => setRequestPayOpen(true)}>Запросить оплату</Btn>
                <div className="spacer" />
                <Btn size="sm" kind="ghost" icon="sparkle" onClick={() => {
                  setTmplOpen((open) => !open);
                  composerRef.current?.focus();
                }}>Создать ответ</Btn>
              </div>

              {/* Messages scroll */}
              <div ref={scrollRef} onScroll={onScroll} className="conv-body">
                <DateSeparator label="Сегодня · 25 мая" />
                {activeMsgs.map((m, i) => {
                  const prev = activeMsgs[i - 1];
                  const next = activeMsgs[i + 1];
                  const groupedAbove = prev && prev.from === m.from && !prev.type;
                  const groupedBelow = next && next.from === m.from && !next.type;
                  const showUnreadHere = i === firstUnreadIdx && i > 0;
                  return (
                    <React.Fragment key={m.id || i}>
                      {showUnreadHere && (
                        <div className="unread-divider">
                          <div className="line" /><div className="label">Непрочитанные</div><div className="line" />
                        </div>
                      )}
                      <MessageBlock
                        m={m}
                        prev={prev}
                        grouped={groupedAbove}
                        last={!groupedBelow}
                        onReact={(e) => addReaction(m.id, e)}
                        onReply={() => setReply({ chatId: active.id, message: m })}
                        onPin={() => setPinnedMsgs({ ...pinnedMsgs, [active.id]: pinnedMsgs[active.id] === m.id ? null : m.id })}
                        isPinned={pinnedMsgs[active.id] === m.id}
                        clientName={activeClient.name.split(' ')[0]}
                        allMsgs={activeMsgs}
                        services={services}
                      />
                    </React.Fragment>
                  );
                })}
                <TypingIndicator />

                <div className={`scroll-down ${scrolledUp ? 'visible' : ''}`} onClick={scrollToBottom}>
                  <Icon name="arrow-down" size={14} />
                  {unread[active.id] > 0 && <span className="badge-count">{unread[active.id]}</span>}
                </div>
              </div>

              {/* Composer */}
              <div className="conv-foot" style={{ position: 'relative' }}>
                {reply && (
                  <div style={{
                    display: 'flex', gap: 10, padding: '8px 12px',
                    background: 'var(--surface-2)', borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--line)', marginBottom: 8, alignItems: 'flex-start',
                  }}>
                    <div style={{ width: 3, alignSelf: 'stretch', background: 'var(--accent)', borderRadius: 99 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, color: 'var(--accent-text)', fontWeight: 600 }}>
                        Ответ {reply.message.from === 'me' ? 'себе' : activeClient.name.split(' ')[0]}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {reply.message.text || reply.message.type}
                      </div>
                    </div>
                    <button className="btn btn-ghost icon" onClick={() => setReply(null)}><Icon name="x" size={12} /></button>
                  </div>
                )}

                <div className={`composer ${recording ? 'recording' : ''} ${draft.trim() ? 'has-draft' : ''} ${tmplOpen || attachOpen || emojiOpen ? 'has-menu' : ''}`} style={{ position: 'relative' }}>
                  {recording ? (
                    <>
                      <button className="btn btn-ghost icon" data-tip="Отменить" onClick={() => stopRecording(false)}>
                        <Icon name="trash" size={14} style={{ color: 'var(--danger)' }} />
                      </button>
                      <div className="recording-state">
                        <span className="rec-dot" />
                        <span className="rec-time">{`0:${String(recTime).padStart(2, '0')}`}</span>
                        <div className="rec-wave">
                          {Array.from({ length: 28 }).map((_, i) => {
                            const h = 4 + Math.abs(Math.sin((i + recTime) * 1.3)) * 18;
                            return <span key={i} style={{ height: h }} />;
                          })}
                        </div>
                      </div>
                      <button className="btn btn-primary" onClick={() => stopRecording(true)}>
                        <Icon name="send" size={13} /> Отправить
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="composer-action-popover-wrap composer-action-popover-wrap--attach">
                        <button className={`btn btn-ghost icon attach-trigger ${attachOpen ? 'is-active' : ''}`} data-tip="Прикрепить"
                          onClick={() => { setAttachOpen(o => !o); setEmojiOpen(false); setTmplOpen(false); }}>
                          <Icon name="paperclip" size={14} />
                        </button>
                        {attachOpen && !recording && (
                          <div className="attach-menu" role="menu" aria-label="Прикрепить">
                            <div className="item" onClick={() => { sendSpecial({ type: 'file', fileName: 'договор.pdf', fileSize: '186 КБ' }); setAttachOpen(false); }}>
                              <div className="ic"><Icon name="paperclip" size={14} /></div>
                              <div>Документ<div className="meta">PDF, DOCX до 25 МБ</div></div>
                            </div>
                            <div className="item" onClick={() => setAttachOpen(false)}>
                              <div className="ic"><Icon name="image" size={14} /></div>
                              <div>Фото или видео<div className="meta">До 10 файлов</div></div>
                            </div>
                            <div className="item" onClick={() => { sendSpecial({
                              type: 'booking', booking: { serviceId: 's4', date: 'Чт, 28 мая', time: '16:00', dur: 75, price: 3800 }
                            }); setAttachOpen(false); }}>
                              <div className="ic"><Icon name="calendar" size={14} /></div>
                              <div>Запись клиента<div className="meta">Слот с подтверждением</div></div>
                            </div>
                            <div className="item" onClick={() => setAttachOpen(false)}>
                              <div className="ic"><Icon name="card" size={14} /></div>
                              <div>Запросить оплату<div className="meta">Ссылка на оплату</div></div>
                            </div>
                            <div className="item" onClick={() => setAttachOpen(false)}>
                              <div className="ic"><Icon name="pin" size={14} /></div>
                              <div>Геопозиция<div className="meta">Адрес студии</div></div>
                            </div>
                          </div>
                        )}
                      </span>
                      <textarea
                        ref={composerRef}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={onKey}
                        placeholder="Напишите сообщение · «/» для шаблонов · ⇧↵ — перенос"
                        rows={1}
                      />
                      <div className="composer-actions">
                        <span className="composer-action-popover-wrap">
                          <button className={`btn btn-ghost icon emoji-trigger ${emojiOpen ? 'is-active' : ''}`} data-tip="Эмодзи" aria-label="Эмодзи" aria-expanded={emojiOpen}
                            onClick={() => { setEmojiOpen(o => !o); setAttachOpen(false); setTmplOpen(false); }}>
                            <Icon name="smile" size={14} />
                          </button>
                          {emojiOpen && !recording && (
                            <div className="emoji-panel" role="menu" aria-label="Эмодзи">
                              {['❤️','👍','🌿','🙏','🔥','👏','😊','✨','😍','😅','🥹','💛','🤍','🤝','💯','☕️','🌸','🌺','🎉','🌷','💆‍♀️','💇‍♀️','✂️','💄'].map(e => (
                                <button key={e} type="button" onClick={() => { setDraft(d => d + e); setEmojiOpen(false); composerRef.current?.focus(); }}>{e}</button>
                              ))}
                            </div>
                          )}
                        </span>
                        <span className="composer-action-popover-wrap composer-action-popover-wrap--templates">
                          <button className={`btn btn-ghost icon tmpl-trigger ${tmplOpen ? 'is-active' : ''}`} data-tip="Шаблоны (/)"
                            onClick={() => { setAttachOpen(false); setEmojiOpen(false); setTmplOpen(o => !o); composerRef.current?.focus(); }}>
                            <Icon name="sparkle" size={14} />
                          </button>
                          {tmplOpen && !recording && (
                            <div className="tmpl-menu">
                              <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 10px 4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Icon name="sparkle" size={11} /> Шаблоны быстрого ответа
                                <span style={{ marginLeft: 'auto' }} className="kbd">Esc</span>
                              </div>
                              {templates
                                .filter(t => !draft.startsWith('/') || draft.length === 1 || t.key.startsWith(draft) || t.title.toLowerCase().includes(draft.slice(1).toLowerCase()))
                                .map(t => (
                                <div key={t.key} className="tmpl-item" onClick={() => { setDraft(t.text); setTmplOpen(false); composerRef.current?.focus(); }}>
                                  <span className="tmpl-key">{t.key}</span>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontWeight: 500 }}>{t.title}</div>
                                    <div className="muted" style={{ fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.text}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </span>
                        <button className="btn btn-ghost icon" data-tip="Запланировать">
                          <Icon name="clock" size={14} />
                        </button>
                        {draft.trim() ? (
                          <button className="btn btn-primary" onClick={() => sendMessage()}>
                            <Icon name="send" size={13} />
                          </button>
                        ) : (
                          <button className="btn btn-primary" data-tip="Голосовое сообщение"
                            onClick={() => setRecording(true)}>
                            <Icon name="bell" size={13} style={{ transform: 'rotate(-15deg)' }} />
                          </button>
                        )}
                      </div>
                    </>
                  )}


                </div>

                {draft.length > 0 && (
                  <div className="composer-count">{draft.length} симв.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="chat-col conv" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
              <Empty icon="chat" title="Выберите диалог"
                body="Слева — все ваши клиенты. Можно искать, фильтровать или начать новый диалог."
                action={<Btn icon="edit" kind="primary">Написать клиенту</Btn>} />
            </div>
          )}

          {/* ============= ASIDE: CLIENT INFO ============= */}
          {activeClient ? <ClientAside client={activeClient} chat={active} /> : <div className="chat-col aside" />}
        </div>
      </div>

      {/* ============= ACTION MODALS ============= */}
      <ProposeTimeModal
        open={proposeTimeOpen}
        onClose={() => setProposeTimeOpen(false)}
        onSend={(slots) => {
          sendSpecial({ type: 'time-proposal', slots });
          setProposeTimeOpen(false);
        }}
      />
      <SendServiceModal
        open={sendServiceOpen}
        services={services}
        onClose={() => setSendServiceOpen(false)}
        onSend={(service) => {
          sendSpecial({ type: 'service', service });
          setSendServiceOpen(false);
        }}
      />
      <RequestPaymentModal
        open={requestPayOpen}
        defaults={{ amount: 3800, method: 'СБП' }}
        onClose={() => setRequestPayOpen(false)}
        onSend={(payment) => {
          sendSpecial({ type: 'payment', payment });
          setRequestPayOpen(false);
        }}
      />
    </div>
  );
}

function ChatEmptyState({ icon = 'chat', title, body }) {
  return (
    <div data-screen-label="04 Chats" className="page-fixed chat-full chat-empty-shell">
      <div className="page-body">
        <div className="chat-empty-state">
          <div className="chat-empty-orb"><Icon name={icon} size={20} /></div>
          <h1>{title}</h1>
          <p>{body}</p>
        </div>
      </div>
    </div>
  );
}

/* ----------- Action modals ----------- */
function ModalShell({ title, sub, onClose, footer, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div>
            <div className="section-title">{title}</div>
            {sub && <div className="section-sub" style={{ marginTop: 2 }}>{sub}</div>}
          </div>
          <button className="btn btn-ghost icon" onClick={onClose} aria-label="Закрыть"><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
        <div className="modal-foot">{footer}</div>
      </div>
    </div>
  );
}

const DEFAULT_TIME_SLOTS = [
  { day: 'Завтра', date: '26 мая', time: '12:00' },
  { day: 'Завтра', date: '26 мая', time: '15:30' },
  { day: 'Суббота', date: '30 мая', time: '11:00' },
];

function ProposeTimeModal({ open, onClose, onSend }) {
  const [slots, setSlots] = useState(DEFAULT_TIME_SLOTS);
  const [draftDate, setDraftDate] = useState('');
  const [draftTime, setDraftTime] = useState('');
  useEffect(() => { if (open) setSlots(DEFAULT_TIME_SLOTS); }, [open]);
  if (!open) return null;
  const addSlot = () => {
    if (!draftDate || !draftTime) return;
    setSlots((current) => [...current, { day: '', date: draftDate, time: draftTime }]);
    setDraftDate(''); setDraftTime('');
  };
  const removeSlot = (index) => setSlots((current) => current.filter((_, i) => i !== index));
  return (
    <ModalShell
      title="Предложить время"
      sub="Выберите несколько окон — клиент сможет выбрать удобное."
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={() => slots.length && onSend(slots)} disabled={!slots.length}>
            Отправить {slots.length || ''}
          </button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slots.map((slot, i) => (
          <div key={i} className="li-row" style={{ padding: '8px 10px' }}>
            <Icon name="clock" size={14} style={{ color: 'var(--accent)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{slot.day ? `${slot.day} · ` : ''}{slot.date}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{slot.time}</div>
            </div>
            <button className="btn btn-ghost icon" aria-label="Удалить" onClick={() => removeSlot(i)}><Icon name="x" size={12} /></button>
          </div>
        ))}
        {!slots.length && <div className="muted" style={{ fontSize: 12.5, padding: '6px 2px' }}>Окна не выбраны — добавьте хотя бы одно.</div>}
      </div>
      <div className="field">
        <div className="field-label">Добавить окно</div>
        <div className="grid-2" style={{ gap: 8 }}>
          <input className="input" placeholder="Дата · напр. 27 мая" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} />
          <input className="input" placeholder="Время · 14:00" value={draftTime} onChange={(e) => setDraftTime(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-soft sm" onClick={addSlot}><Icon name="plus" size={12} /> Добавить</button>
        </div>
      </div>
    </ModalShell>
  );
}

function SendServiceModal({ open, services, onClose, onSend }) {
  const active = (services || SERVICES).filter((s) => s.active);
  const [selectedId, setSelectedId] = useState(active[0]?.id || '');
  useEffect(() => { if (open) setSelectedId(active[0]?.id || ''); }, [open]);
  if (!open) return null;
  const selected = active.find((s) => s.id === selectedId);
  return (
    <ModalShell
      title="Прислать услугу"
      sub="Клиенту придёт карточка с ценой и длительностью."
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={() => selected && onSend(selected)} disabled={!selected}>Отправить</button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
        {active.map((service) => (
          <div
            key={service.id}
            className={`li-row ${selectedId === service.id ? 'active' : ''}`}
            onClick={() => setSelectedId(service.id)}
            style={{ padding: '10px 12px', cursor: 'pointer' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{service.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{service.dur} мин · {service.price ? `${service.price.toLocaleString('ru-RU')} ₽` : 'бесплатно'}</div>
            </div>
            {selectedId === service.id && <Icon name="check" size={14} style={{ color: 'var(--accent)' }} />}
          </div>
        ))}
        {!active.length && <div className="muted" style={{ fontSize: 12.5 }}>Нет активных услуг.</div>}
      </div>
    </ModalShell>
  );
}

function RequestPaymentModal({ open, defaults, onClose, onSend }) {
  const [amount, setAmount] = useState(defaults?.amount || 0);
  const [method, setMethod] = useState(defaults?.method || 'СБП');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (open) {
      setAmount(defaults?.amount || 0);
      setMethod(defaults?.method || 'СБП');
      setNote('');
    }
  }, [open, defaults]);
  if (!open) return null;
  const methods = ['СБП', 'Карта', 'Наличные', 'Ссылка'];
  return (
    <ModalShell
      title="Запросить оплату"
      sub="Клиент получит счёт с быстрой ссылкой на оплату."
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button
            className="btn btn-primary"
            onClick={() => onSend({ amount: Number(amount) || 0, currency: '₽', method, note })}
            disabled={!Number(amount)}
          >Отправить счёт</button>
        </>
      )}
    >
      <div className="field">
        <div className="field-label">Сумма</div>
        <div className="input-with-icon">
          <Icon name="card" />
          <input className="input" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="3 800" />
          <span className="kbd">₽</span>
        </div>
      </div>
      <div className="field">
        <div className="field-label">Способ</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {methods.map((m) => (
            <button
              key={m}
              className={`btn ${method === m ? 'btn-primary' : 'btn-soft'} sm`}
              onClick={() => setMethod(m)}
              type="button"
            >{m}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <div className="field-label">Комментарий</div>
        <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например: предоплата 50%, остаток в студии." />
      </div>
    </ModalShell>
  );
}

/* ----------- ChatRow ----------- */
function ChatRow({ ch, active, unread, onClick, lastMsg, pinned, onPin, clients = CLIENTS }) {
  const c = clients.find(c => c.id === ch.clientId) || {};
  const previewText = lastMsg?.text
    || (lastMsg?.type === 'voice' ? '🎙 Голосовое сообщение' :
        lastMsg?.type === 'file'  ? '📎 ' + (lastMsg.fileName || 'Файл') :
        lastMsg?.type === 'booking' ? '✦ Запись' :
        lastMsg?.type === 'service' ? '✦ Услуга' :
        lastMsg?.type === 'payment' ? '✦ Счёт на оплату' :
        lastMsg?.type === 'time-proposal' ? '✦ Свободные окна' : ch.preview);

  return (
    <div onClick={onClick} className={`chat-row ${active ? 'active' : ''} ${pinned ? 'pinned' : ''}`}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={c.name} />
        <span className={`chat-online-dot ${ch.online ? '' : 'offline'}`} style={{ width: 9, height: 9 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
          <span style={{
            fontWeight: unread ? 600 : 500, fontSize: 13.5,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {c.name}
            {c.status === 'vip' && <Icon name="star" size={10} style={{ color: 'var(--warn)' }} />}
          </span>
          <span className="muted" style={{ fontSize: 11, flexShrink: 0 }}>{ch.time}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <div style={{
            fontSize: 12.5, color: unread ? 'var(--text-2)' : 'var(--text-3)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {lastMsg?.from === 'me' && <span style={{ color: 'var(--text-4)' }}>Вы: </span>}
            {previewText}
          </div>
          {unread > 0
            ? <span className="chat-badge">{unread}</span>
            : pinned ? <Icon name="pin" size={11} style={{ color: 'var(--text-4)', transform: 'rotate(45deg)' }} />
              : null}
        </div>
      </div>
    </div>
  );
}

function lastMessageOf(msgs) { return msgs?.[msgs.length - 1]; }

/* ----------- Message ----------- */
function MessageBlock({ m, prev, grouped, last, onReact, onReply, onPin, isPinned, clientName, allMsgs, services = SERVICES }) {
  const [picker, setPicker] = useState(false);
  const isMe = m.from === 'me';
  const quoted = m.replyTo ? allMsgs?.find(x => x.id === m.replyTo) : null;

  const renderContent = () => {
    if (m.type === 'voice') {
      const bars = 22;
      return (
        <div className="att-voice">
          <button className="play-btn"><Icon name="play" size={11} /></button>
          <div className="wave">
            {Array.from({ length: bars }).map((_, i) => {
              const h = 8 + Math.abs(Math.sin(i * 1.7 + (m.id?.length || 0))) * 18;
              return <span key={i} style={{ height: h }} />;
            })}
          </div>
          <span className="dur">{m.dur}</span>
        </div>
      );
    }
    if (m.type === 'file') {
      return (
        <div className="att-file">
          <div className="att-file-icon"><Icon name="paperclip" size={16} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="att-file-name">{m.fileName}</div>
            <div className="att-file-meta">{m.fileSize}</div>
          </div>
          <button className="btn btn-ghost icon" style={{ width: 26, height: 26 }}><Icon name="arrow-down" size={12} /></button>
        </div>
      );
    }
    if (m.type === 'booking') {
      const sv = services.find(s => s.id === m.booking.serviceId);
      return (
        <div className="msg-booking">
          <div className="msg-booking-head">
            <Icon name="sparkle" size={11} /> {isMe ? 'Запись отправлена' : 'Запись'}
          </div>
          <div className="msg-booking-body">
            <div className="title">{sv?.name}</div>
            <div className="meta">
              <span><Icon name="calendar" size={11} /> {m.booking.date}</span>
              <span style={{ color: 'var(--text-4)' }}>·</span>
              <span><Icon name="clock" size={11} /> {m.booking.time}</span>
              <span style={{ color: 'var(--text-4)' }}>·</span>
              <span>{m.booking.dur} мин</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }} className="tabular">
              {m.booking.price.toLocaleString('ru-RU')} ₽
            </div>
          </div>
          <div className="msg-booking-foot">
            <Btn size="sm" kind="primary" icon="check">Подтвердить</Btn>
            <Btn size="sm" kind="secondary">Перенести</Btn>
          </div>
        </div>
      );
    }
    if (m.type === 'service') {
      const sv = m.service || {};
      return (
        <div className="msg-booking">
          <div className="msg-booking-head">
            <Icon name="services" size={11} /> {isMe ? 'Услуга отправлена' : 'Услуга'}
          </div>
          <div className="msg-booking-body">
            <div className="title">{sv.name}</div>
            <div className="meta">
              <span><Icon name="clock" size={11} /> {sv.dur} мин</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }} className="tabular">
              {sv.price ? `${Number(sv.price).toLocaleString('ru-RU')} ₽` : 'Бесплатно'}
            </div>
          </div>
          <div className="msg-booking-foot">
            <Btn size="sm" kind="primary" icon="calendar">Записаться</Btn>
            <Btn size="sm" kind="secondary">Подробнее</Btn>
          </div>
        </div>
      );
    }
    if (m.type === 'payment') {
      const pay = m.payment || {};
      return (
        <div className="msg-booking">
          <div className="msg-booking-head">
            <Icon name="card" size={11} /> {isMe ? 'Счёт выставлен' : 'Счёт на оплату'}
          </div>
          <div className="msg-booking-body">
            <div className="title tabular">{Number(pay.amount || 0).toLocaleString('ru-RU')} {pay.currency || '₽'}</div>
            <div className="meta">
              <span>Способ: {pay.method || 'СБП'}</span>
              {pay.note && <><span style={{ color: 'var(--text-4)' }}>·</span><span style={{ fontStyle: 'italic' }}>{pay.note}</span></>}
            </div>
          </div>
          <div className="msg-booking-foot">
            <Btn size="sm" kind="primary" icon="check">Оплатить</Btn>
            <Btn size="sm" kind="secondary">Реквизиты</Btn>
          </div>
        </div>
      );
    }
    if (m.type === 'time-proposal') {
      const slots = m.slots || [];
      return (
        <div className="msg-booking">
          <div className="msg-booking-head">
            <Icon name="calendar" size={11} /> {isMe ? 'Предложены окна' : 'Свободные окна'}
          </div>
          <div className="msg-booking-body" style={{ paddingBottom: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {slots.map((slot, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)',
                  background: 'var(--surface-2)',
                }}>
                  <Icon name="clock" size={11} style={{ color: 'var(--accent)' }} />
                  <div style={{ flex: 1, fontSize: 12.5 }}>
                    <strong>{slot.day ? `${slot.day} · ` : ''}{slot.date}</strong>
                    <span style={{ marginLeft: 6, color: 'var(--text-3)' }}>{slot.time}</span>
                  </div>
                  {!isMe && <Btn size="sm" kind="soft">Выбрать</Btn>}
                </div>
              ))}
            </div>
          </div>
          {!isMe && (
            <div className="msg-booking-foot">
              <Btn size="sm" kind="primary">Подтвердить выбор</Btn>
            </div>
          )}
        </div>
      );
    }
    // text
    return <div className="bubble-text">{m.text}</div>;
  };

  // structured cards render their own container (not bubble)
  if (m.type === 'booking' || m.type === 'service' || m.type === 'payment' || m.type === 'time-proposal') {
    return (
      <div className={`msg-wrap ${isMe ? 'me' : 'them'} ${grouped ? '' : 'first'} ${last ? 'last' : ''}`}>
        <div className="msg-inner">{renderContent()}</div>
      </div>
    );
  }

  return (
    <div className={`msg-wrap ${isMe ? 'me' : 'them'} ${grouped ? '' : 'first'} ${last ? 'last' : ''}`}>
      <div className="msg-inner" style={{ position: 'relative' }}>
        {isPinned && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: 'var(--accent-text)', marginBottom: 4,
            justifyContent: isMe ? 'flex-end' : 'flex-start',
          }}>
            <Icon name="pin" size={10} /> Закреплено
          </div>
        )}
        <div className={`bubble ${isMe ? 'me' : 'them'} ${grouped ? 'grouped' : ''}`}>
          {quoted && (
            <div className="quote" style={{ color: isMe ? 'rgba(255,255,255,0.95)' : 'var(--accent-text)' }}>
              <span className="q-name">{quoted.from === 'me' ? 'Вы' : clientName} →</span>
              <span className="q-text">{quoted.text || (quoted.type === 'booking' ? 'Запись' : quoted.type === 'voice' ? 'Голосовое' : 'Файл')}</span>
            </div>
          )}
          {renderContent()}
          <div className="bubble-meta">
            <span>{m.time}</span>
            {isMe && (
              m.read
                ? <ReadDouble color="rgba(255,255,255,0.95)" />
                : <Icon name="check" size={11} style={{ color: 'rgba(255,255,255,0.7)' }} />
            )}
          </div>
        </div>

        {m.reactions && m.reactions.length > 0 && (
          <div className="reactions" style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
            {m.reactions.map((r, i) => (
              <span key={i} className={`reaction ${r.mine ? 'mine' : ''}`}>
                <span>{r.e}</span>
                <span>1</span>
              </span>
            ))}
          </div>
        )}

        <div className="msg-actions">
          {!picker ? <>
            <button onClick={() => setPicker(true)} title="Реакция"><span style={{ fontSize: 13 }}>😊</span></button>
            <button onClick={onReply} title="Ответить"><Icon name="chat" size={12} /></button>
            <button onClick={onPin} title={isPinned ? 'Открепить' : 'Закрепить'}>
              <Icon name="pin" size={12} style={{ color: isPinned ? 'var(--accent)' : undefined }} />
            </button>
            <button title="Скопировать"><Icon name="copy" size={12} /></button>
            <button title="Ещё"><Icon name="more-v" size={12} /></button>
          </> : (
            <div style={{ display: 'flex', gap: 2, padding: '0 4px' }}>
              {EMOJI_PICKER.map(e => (
                <button key={e} onClick={() => { onReact(e); setPicker(false); }} style={{ fontSize: 14 }}>{e}</button>
              ))}
              <button onClick={() => setPicker(false)} title="Закрыть"><Icon name="x" size={11} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadDouble({ color }) {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" style={{ marginLeft: 1 }}>
      <path d="M1 6.5L4 9L9 3" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 6.5L8 9L13 3" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ----------- Right aside ----------- */
function ClientAside({ client, chat }) {
  return (
    <div className="chat-col aside">
      <div style={{ overflow: 'auto', height: '100%' }}>
        <div style={{ padding: '22px 20px 16px', textAlign: 'center', borderBottom: '1px solid var(--line)' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
            <Avatar name={client.name} size="xl" />
            <span className={`chat-online-dot ${chat.online ? '' : 'offline'}`} style={{ width: 14, height: 14, borderWidth: 3 }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{client.name}</div>
          <div className="mono muted" style={{ fontSize: 12, marginTop: 2 }}>{client.phone}</div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <StatusBadge status={client.status} />
            <Badge>{client.visits} {pluralize(client.visits,'визит','визита','визитов')}</Badge>
          </div>
        </div>

        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, borderBottom: '1px solid var(--line)' }}>
          <IconActionBtn icon="phone" label="Звонок" />
          <IconActionBtn icon="plus" label="Запись" />
          <IconActionBtn icon="card" label="Оплата" />
          <IconActionBtn icon="more-v" label="Ещё" />
        </div>

        <div style={{ padding: '14px 18px 20px' }}>
          {client.next !== '—' && (
            <div style={{
              padding: 14, background: 'var(--accent-soft)',
              border: '1px solid color-mix(in oklab, var(--accent) 22%, transparent)',
              borderRadius: 'var(--r)',
              marginBottom: 18,
            }}>
              <div style={{ fontSize: 10.5, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="calendar" size={11} /> Ближайшая запись
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{client.next}, 16:00</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Стрижка · 1 ч 15 мин · 3 800 ₽</div>
                </div>
                <Btn size="sm" kind="ghost" icon="arrow-up-right" data-tip="Открыть запись"></Btn>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                <Btn size="sm" kind="secondary" style={{ flex: 1 }}>Перенести</Btn>
                <Btn size="sm" kind="ghost">Отменить</Btn>
              </div>
            </div>
          )}

          <SidePanelSection label="Заметки" action={<button className="link" style={{ fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ добавить</button>}>
            {client.notes ? (
              <div style={{
                fontSize: 13, lineHeight: 1.55, color: 'var(--text-2)',
                background: 'var(--surface-2)', padding: 12, borderRadius: 'var(--r-sm)',
                border: '1px solid var(--line)',
              }}>{client.notes}</div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0', fontStyle: 'italic' }}>Заметок пока нет.</div>
            )}
          </SidePanelSection>

          <SidePanelSection label="Теги">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="chip sm">регулярный</span>
              <span className="chip sm">тёплые тона</span>
              <span className="chip sm">аллергия</span>
              <span className="chip sm"><Icon name="plus" size={10} /></span>
            </div>
          </SidePanelSection>

          <SidePanelSection label="История записей" action={<span className="muted" style={{ fontSize: 11 }}>{client.visits} всего</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { date: '15 мая', service: 'Окрашивание AirTouch', price: 12500 },
                { date: '02 апр', service: 'Тонирование',          price: 4500 },
                { date: '08 мар', service: 'Окрашивание AirTouch', price: 12500 },
              ].map((v, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 12.5 }}>
                  <div>
                    <div style={{ color: 'var(--text)', fontWeight: 500 }}>{v.service}</div>
                    <div className="mono muted" style={{ fontSize: 11 }}>{v.date}</div>
                  </div>
                  <span className="tabular muted">{v.price.toLocaleString('ru-RU')} ₽</span>
                </div>
              ))}
            </div>
            <button className="link" style={{ fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 0' }}>
              Показать ещё {client.visits - 3} →
            </button>
          </SidePanelSection>

          <SidePanelSection label="Активность">
            <Timeline items={[
              { label: 'Запись создана',      when: '14:08', kind: 'accent' },
              { label: 'Запись подтверждена', when: '14:12', kind: 'success' },
              { label: 'Первое сообщение',    when: '14:08', kind: 'info' },
            ]} />
          </SidePanelSection>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    new:      { label: 'Новый',      kind: 'info' },
    regular:  { label: 'Постоянный', kind: 'success' },
    vip:      { label: 'VIP',        kind: 'accent' },
    inactive: { label: 'Неактивный', kind: '' },
  };
  const s = map[status] || map.regular;
  return <Badge kind={s.kind}>{s.label}</Badge>;
}

function IconActionBtn({ icon, label }) {
  return (
    <button style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '10px 4px',
      background: 'var(--surface-2)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-sm)', cursor: 'pointer',
      font: 'inherit', color: 'var(--text-2)',
      transition: 'background 120ms, border-color 120ms, color 120ms',
    }}
      onMouseOver={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.borderColor = 'var(--line-strong)'; e.currentTarget.style.color = 'var(--text)'; }}
      onMouseOut={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
      <Icon name={icon} size={15} style={{ color: 'var(--accent-text)' }} />
      <span style={{ fontSize: 10.5, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function DateSeparator({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 4px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 999 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  );
}

function TypingIndicator() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t  = setTimeout(() => setShow(true), 1800);
    const t2 = setTimeout(() => setShow(false), 6000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);
  if (!show) return null;
  return (
    <div className="msg-wrap them">
      <div className="bubble them" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--text-3)', opacity: 0.5, animation: 'typing-dot 1.2s infinite' }} />
          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--text-3)', opacity: 0.5, animation: 'typing-dot 1.2s 0.15s infinite' }} />
          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--text-3)', opacity: 0.5, animation: 'typing-dot 1.2s 0.3s infinite' }} />
        </div>
      </div>
    </div>
  );
}

function SidePanelSection({ label, children, action }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase',
        letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'
      }}>
        <span>{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function Timeline({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
      <div style={{ position: 'absolute', left: 3, top: 8, bottom: 8, width: 1, background: 'var(--line)' }} />
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }}>
          <span className={`dot ${it.kind}`} style={{ zIndex: 1 }} />
          <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-2)' }}>{it.label}</span>
          <span className="muted mono" style={{ fontSize: 11 }}>{it.when}</span>
        </div>
      ))}
    </div>
  );
}
