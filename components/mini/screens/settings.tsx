'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../theme';
import {
  Card, FieldLabel, SectionTitle, Divider, Avatar, Toggle, Icon, NeutralBtn, ScreenHeader,
} from '../primitives/atoms';
import { useMiniData } from '@/hooks/use-mini-data';
import { useApp } from '@/lib/app-context';
import { useMiniToast } from '../bridge';
import { useChats } from '@/hooks/use-chats';
import { buildMiniEventNotifications, type NotificationEvent } from '@/lib/notification-events';
import { accentPalette, type AccentTone } from '@/lib/appearance-palette';
import { defaultAppearanceSettings, normalizeAppearanceSettings, type AppearanceSettings, type CardMode, type MotionMode, type RadiusMode } from '@/lib/appearance';

const MINI_NOTIFICATION_READ_KEY = 'clickbook-mini-notification-read-ids';
const MINI_NOTIFICATION_READ_EVENT = 'clickbook-mini-notification-read-change';

function readMiniNotificationIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MINI_NOTIFICATION_READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeMiniNotificationIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  const next = Array.from(new Set(ids)).slice(-200);
  try {
    window.localStorage.setItem(MINI_NOTIFICATION_READ_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(MINI_NOTIFICATION_READ_EVENT));
  } catch {}
}


// ─── Profile ────────────────────────────────
export function ProfileScreen({ back }: { back: () => void }) {
  const { T } = useTheme();
  const { MASTER, updateSection } = useMiniData();
  const app = useApp();
  const { show } = useMiniToast();
  const [form, setForm] = useState({
    name: MASTER.name, service: MASTER.service, city: MASTER.city,
    phone: MASTER.phone, bio: MASTER.bio,
    tg: MASTER.socials.tg, vk: MASTER.socials.vk, ig: MASTER.socials.ig,
  });
  useEffect(() => {
    setForm({
      name: MASTER.name, service: MASTER.service, city: MASTER.city,
      phone: MASTER.phone, bio: MASTER.bio,
      tg: MASTER.socials.tg, vk: MASTER.socials.vk, ig: MASTER.socials.ig,
    });
  }, [MASTER.name, MASTER.service, MASTER.city, MASTER.phone, MASTER.bio, MASTER.socials.tg, MASTER.socials.vk, MASTER.socials.ig]);

  const set = (k: keyof typeof form) => (v: string) => setForm((s) => ({ ...s, [k]: v }));

  async function save() {
    const profile = app.ownedProfile;
    if (!profile) {
      show('Профиль ещё загружается', 'error');
      return;
    }

    const result = await app.saveProfile({
      name: form.name.trim() || profile.name,
      profession: form.service.trim() || profile.profession,
      city: form.city.trim(),
      bio: form.bio.trim(),
      servicesText: profile.services.join('\n'),
      phone: form.phone.trim(),
      telegram: form.tg.trim().replace(/^@/, ''),
      whatsapp: profile.whatsapp ?? '',
      locationMode: profile.locationMode ?? 'online',
      address: profile.address ?? '',
      mapUrl: profile.mapUrl ?? '',
      hidePhone: profile.hidePhone ?? false,
      hideTelegram: profile.hideTelegram ?? false,
      hideWhatsapp: profile.hideWhatsapp ?? false,
      slug: profile.slug,
      avatar: profile.avatar ?? '',
      priceHint: profile.priceHint,
      experienceLabel: profile.experienceLabel,
      responseTime: profile.responseTime,
      workGallery: profile.workGallery,
      reviews: profile.reviews,
      rating: profile.rating,
      reviewCount: profile.reviewCount,
    });

    if (!result.success) {
      show(result.error || 'Не удалось сохранить', 'error');
      return;
    }

    await updateSection('profileSocials', { vk: form.vk.trim(), ig: form.ig.trim() });
    show('Профиль сохранён', 'success');
  }

  return (
    <div>
      <ScreenHeader title="Профиль" subtitle="Что видят клиенты на странице записи." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={form.name || MASTER.name} src={form.avatar || MASTER.avatar} size={64} radius={16} />
            <div style={{ flex: 1 }}>
              <NeutralBtn icon="upload" full onClick={() => show('Загрузка аватара скоро будет доступна', 'info')}>Заменить аватар</NeutralBtn>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 8 }}>Рекомендуем 400×400, JPG / PNG</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <Icon name="star" size={14} color={T.text2} />
            <span style={{ fontSize: 13, color: T.text }}>{MASTER.rating}</span>
            <span style={{ fontSize: 12, color: T.text3 }}>· 31 отзыв</span>
            <span style={{ fontSize: 11, color: T.text3, marginLeft: 'auto' }}>read-only</span>
          </div>
        </Card>

        <Field label="Имя" value={form.name} onChange={set('name')} />
        <Field label="Профессия" value={form.service} onChange={set('service')} />
        <Field label="Город" value={form.city} onChange={set('city')} />
        <Field label="Телефон" value={form.phone} onChange={set('phone')} />
        <Field label="Био" value={form.bio} onChange={set('bio')} multiline />

        <SectionTitle title="Социальные сети" subtitle="Покажем на публичной странице." />
        <Card padded={false}>
          <SocialRow icon="send" channel="Telegram" value={form.tg} onChange={set('tg')} />
          <Divider />
          <SocialRow icon="message-square" channel="ВКонтакте" value={form.vk} onChange={set('vk')} />
          <Divider />
          <SocialRow icon="instagram" channel="Instagram" value={form.ig} onChange={set('ig')} />
        </Card>

        <NeutralBtn icon="check" full onClick={save} style={{ marginTop: 8, padding: '14px 16px' }}>Сохранить</NeutralBtn>
      </div>
    </div>
  );
}

function Field({ label, value, multiline, onChange }: { label: string; value: string; multiline?: boolean; onChange?: (v: string) => void }) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: '12px 14px', boxShadow: T.cardShadow,
    }}>
      <FieldLabel style={{ fontSize: 9 }}>{label}</FieldLabel>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange?.(e.target.value)} rows={3}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 14, fontFamily: 'inherit', resize: 'none', marginTop: 6, lineHeight: 1.5, padding: 0 }} />
      ) : (
        <input value={value} onChange={(e) => onChange?.(e.target.value)}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 14, fontFamily: 'inherit', marginTop: 6, padding: 0 }} />
      )}
    </div>
  );
}

function SocialRow({ icon, channel, value, onChange }: { icon: string; channel: string; value: string; onChange?: (v: string) => void }) {
  const { T } = useTheme();
  return (
    <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <Icon name={icon} size={16} color={T.text2} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: T.text }}>{channel}</div>
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="не указано"
          style={{
            width: '100%', marginTop: 2, padding: 0, background: 'transparent',
            border: 'none', outline: 'none', color: T.text3, fontSize: 11, fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  );
}

// ─── Appearance ────────────────────────────
export function AppearanceScreen({ back }: { back: () => void }) {
  const {
    T, mode, set: setMode, accentTone, setAccentTone, radius, setRadius,
  } = useTheme();
  const { MASTER, updateSection } = useMiniData();
  const app = useApp();
  const { show } = useMiniToast();
  const [motion, setMotion] = useState<MotionMode>('smooth');
  const [cardStyle, setCardStyle] = useState<CardMode>('soft');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const remote = normalizeAppearanceSettings((app.workspaceData.appearance as Partial<AppearanceSettings> | undefined) ?? defaultAppearanceSettings);
    setAccentTone(remote.accentTone);
    setRadius(remote.radius);
    setMotion(remote.motion);
    setCardStyle(remote.cardStyle);
  }, [app.workspaceData.appearance, setAccentTone, setRadius]);

  const accents: { id: AccentTone; label: string }[] = [
    { id: 'cobalt', label: 'Синий' },
    { id: 'emerald', label: 'Зелёный' },
    { id: 'violet', label: 'Фиолетовый' },
    { id: 'rose', label: 'Розовый' },
    { id: 'amber', label: 'Янтарный' },
    { id: 'teal', label: 'Бирюзовый' },
  ];

  const radii: { id: RadiusMode; label: string; r: number; sub: string }[] = [
    { id: 'tight', label: 'Строго', r: 8, sub: 'Компактнее' },
    { id: 'medium', label: 'Средне', r: 14, sub: 'Баланс' },
    { id: 'soft', label: 'Мягко', r: 22, sub: 'Больше воздуха' },
  ];

  const motions: { id: MotionMode; label: string; sub: string }[] = [
    { id: 'off', label: 'Без анимаций', sub: 'Максимально спокойно' },
    { id: 'fast', label: 'Быстрые', sub: 'Короткий feedback' },
    { id: 'smooth', label: 'Плавные', sub: 'По умолчанию' },
  ];

  const cards: { id: CardMode; label: string; sub: string }[] = [
    { id: 'flat', label: 'Плоские', sub: 'Минимум теней' },
    { id: 'soft', label: 'Мягкие', sub: 'Текущий стиль' },
    { id: 'glass', label: 'Glass', sub: 'Лёгкая глубина' },
  ];

  async function save() {
    setSaving(true);
    const current = normalizeAppearanceSettings((app.workspaceData.appearance as Partial<AppearanceSettings> | undefined) ?? defaultAppearanceSettings);
    const next: AppearanceSettings = {
      ...current,
      accentTone,
      publicAccent: accentTone,
      radius,
      motion,
      cardStyle,
    };

    const ok = await updateSection('appearance', {
      ...next,
      miniThemeMode: mode,
    });

    setSaving(false);
    if (!ok) {
      show('Не удалось сохранить внешний вид', 'error');
      return;
    }
    show('Внешний вид сохранён', 'success');
  }

  const accent = accentPalette[accentTone] ?? accentPalette.teal;
  const previewRadius = radius === 'tight' ? 10 : radius === 'soft' ? 22 : 16;
  const previewShadow = cardStyle === 'flat' ? 'none' : cardStyle === 'glass' ? '0 14px 34px rgba(0,0,0,0.18)' : T.cardShadow;

  return (
    <div>
      <ScreenHeader title="Внешний вид" subtitle="Тема, акценты, скругления и движение miniapp." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <FieldLabel>Живое превью</FieldLabel>
          <Card style={{ marginTop: 10, borderRadius: previewRadius, boxShadow: previewShadow }}>
            <FieldLabel>Персональная ссылка</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 12 }}>
              <div style={{ fontSize: 25, fontWeight: 600, color: T.text, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{MASTER.link}</div>
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}${MASTER.link}`)
                      .then(() => show('Ссылка скопирована', 'success'))
                      .catch(() => show('Не удалось скопировать', 'error'));
                  }
                }}
                style={{
                  width: 36, height: 36, borderRadius: 12, border: `1px solid ${T.borderStrong}`,
                  background: T.cardElev, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: T.text2, cursor: 'pointer', flexShrink: 0,
                }}
              >
                <Icon name="copy" size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent.solid }} />
              <span style={{ fontSize: 12, color: T.text2 }}>Акцент применён сразу · {mode === 'dark' ? 'тёмная' : 'светлая'} тема</span>
            </div>
          </Card>
        </div>

        <div>
          <SectionTitle title="Тема приложения" subtitle="Меняется сразу и запоминается на устройстве." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ThemeCard active={mode === 'dark'} onClick={() => setMode('dark')} themeMode="dark" label="Тёмная" />
            <ThemeCard active={mode === 'light'} onClick={() => setMode('light')} themeMode="light" label="Светлая" />
          </div>
        </div>

        <div>
          <SectionTitle title="Акцент" subtitle="Кнопки, бейджи, графики и active states." />
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {accents.map((a) => {
                const meta = accentPalette[a.id];
                const active = accentTone === a.id;
                return (
                  <button key={a.id} onClick={() => setAccentTone(a.id)} style={{
                    background: active ? meta.soft : T.cardElev,
                    border: `1px solid ${active ? meta.solid : T.border}`,
                    borderRadius: 14,
                    padding: '12px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'inherit',
                  }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: meta.gradient, boxShadow: active ? `0 0 0 3px ${meta.soft}` : 'none' }} />
                    <span style={{ fontSize: 11, color: active ? T.text : T.text2 }}>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          <SectionTitle title="Скругления" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {radii.map((o) => (
              <button key={o.id} onClick={() => setRadius(o.id)} style={{
                background: T.card, border: `1px solid ${radius === o.id ? T.borderStrong : T.border}`,
                borderRadius: 14, padding: 14, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
                boxShadow: T.cardShadow,
              }}>
                <div style={{ width: 42, height: 26, background: T.cardElev, border: `1px solid ${T.border}`, borderRadius: o.r }} />
                <span style={{ fontSize: 12, color: radius === o.id ? T.text : T.text2 }}>{o.label}</span>
                <span style={{ fontSize: 10, color: T.text3 }}>{o.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title="Микродвижение" subtitle="Для пользователей, которым важна скорость или спокойствие." />
          <Card padded={false}>
            {motions.map((item, index) => (
              <div key={item.id}>
                <SelectableRow
                  label={item.label}
                  sub={item.sub}
                  active={motion === item.id}
                  onClick={() => setMotion(item.id)}
                />
                {index < motions.length - 1 && <Divider />}
              </div>
            ))}
          </Card>
        </div>

        <div>
          <SectionTitle title="Карточки" />
          <Card padded={false}>
            {cards.map((item, index) => (
              <div key={item.id}>
                <SelectableRow
                  label={item.label}
                  sub={item.sub}
                  active={cardStyle === item.id}
                  onClick={() => setCardStyle(item.id)}
                />
                {index < cards.length - 1 && <Divider />}
              </div>
            ))}
          </Card>
        </div>

        <NeutralBtn icon="check" full onClick={save} style={{ padding: '14px 16px' }}>
          {saving ? 'Сохраняем…' : 'Сохранить внешний вид'}
        </NeutralBtn>
      </div>
    </div>
  );
}

function SelectableRow({ label, sub, active, onClick }: { label: string; sub?: string; active: boolean; onClick: () => void }) {
  const { T } = useTheme();
  return (
    <button onClick={onClick} style={{
      width: '100%',
      background: 'transparent',
      border: 'none',
      padding: '14px 20px',
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      textAlign: 'left',
      color: T.text,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 999,
        border: `1px solid ${active ? T.accent : T.borderStrong}`,
        background: active ? T.accent : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
      }}>
        {active && <Icon name="check" size={12} color="#fff" />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: T.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{sub}</div>}
      </div>
    </button>
  );
}

function ThemeCard({ active, onClick, themeMode, label }: { active: boolean; onClick: () => void; themeMode: 'dark' | 'light'; label: string }) {
  const { T } = useTheme();
  const sample = themeMode === 'dark'
    ? { bg: '#0a0a0a', card: '#141414', text: '#fafafa', border: 'rgba(255,255,255,0.08)' }
    : { bg: '#fafaf9', card: '#ffffff', text: '#0a0a0a', border: 'rgba(0,0,0,0.06)' };
  return (
    <button onClick={onClick} style={{
      background: T.card, border: `1px solid ${active ? T.borderStrong : T.border}`,
      borderRadius: 14, padding: 14, cursor: 'pointer', fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch',
      boxShadow: T.cardShadow,
    }}>
      <div style={{
        background: sample.bg, border: `1px solid ${sample.border}`, borderRadius: 8,
        padding: 8, display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{ height: 6, background: sample.text, opacity: 0.9, borderRadius: 2, width: '40%' }} />
        <div style={{ background: sample.card, border: `1px solid ${sample.border}`, borderRadius: 6, height: 22, marginTop: 4 }} />
        <div style={{ background: sample.card, border: `1px solid ${sample.border}`, borderRadius: 6, height: 14 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: T.text }}>{label}</span>
        {active && <Icon name="check" size={14} color={T.accent} />}
      </div>
    </button>
  );
}

// ─── Notifications ─────────────────────────
interface NotifState {
  appts: boolean; remind: boolean; msgs: boolean; reviews: boolean; marketing: boolean;
  push: boolean; email: boolean; tg: boolean;
}

export function NotificationsScreen({ back }: { back: () => void }) {
  const { T } = useTheme();
  const { APPOINTMENTS, updateSection } = useMiniData();
  const { threads } = useChats();
  const { show } = useMiniToast();
  const [v, setV] = useState<NotifState>({
    appts: true, remind: true, msgs: true, reviews: true, marketing: false,
    push: true, email: false, tg: true,
  });
  const [readIds, setReadIds] = useState<string[]>(() => readMiniNotificationIds());
  const t = (k: keyof NotifState) => setV((s) => ({ ...s, [k]: !s[k] }));

  useEffect(() => {
    writeMiniNotificationIds(readIds);
  }, [readIds]);

  const markRead = (ids: string[]) => {
    setReadIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const events = useMemo(() => (
    buildMiniEventNotifications(APPOINTMENTS, threads).map((event) => ({
      ...event,
      unread: event.unread && !readIds.includes(event.id),
    }))
  ), [APPOINTMENTS, threads, readIds]);
  const unread = events.filter((event) => event.unread).length;

  async function save() {
    const ok = await updateSection('notifications', v);
    show(ok ? 'Настройки уведомлений сохранены' : 'Не удалось сохранить', ok ? 'success' : 'error');
  }

  function markAllRead() {
    markRead(events.map((event) => event.id));
    show('Все события отмечены прочитанными', 'success');
  }

  return (
    <div>
      <ScreenHeader
        title="Уведомления"
        subtitle={unread > 0 ? `${unread} новых событий` : 'События, запросы клиентов и настройки доставки.'}
        onBack={back}
        right={
          <button
            onClick={markAllRead}
            style={{
              background: 'transparent', border: 'none', color: T.accent,
              fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', padding: '6px 8px',
            }}
          >Прочитать</button>
        }
      />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <SectionTitle title="События" subtitle="То, что реально требует внимания: переносы, новые записи, входящие." />
          {events.length > 0 ? (
            <Card padded={false}>
              {events.slice(0, 12).map((event, index) => (
                <div key={event.id}>
                  <NotificationEventRow event={event} onClick={() => markRead([event.id])} />
                  {index < Math.min(events.length, 12) - 1 && <Divider />}
                </div>
              ))}
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ width: 44, height: 44, borderRadius: 16, margin: '0 auto 12px', background: T.cardElev, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text2 }}>
                  <Icon name="bell-check" size={20} />
                </div>
                <div style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>Сейчас всё спокойно</div>
                <div style={{ fontSize: 12, color: T.text3, lineHeight: 1.5, marginTop: 6 }}>Новые переносы, отмены, записи и сообщения появятся здесь.</div>
              </div>
            </Card>
          )}
        </div>

        <div>
          <SectionTitle title="Что присылать" />
          <Card padded={false}>
            <ToggleRow label="Новые записи" sub="Когда клиент бронирует слот" on={v.appts} onChange={() => t('appts')} />
            <Divider />
            <ToggleRow label="Переносы и отмены" sub="Когда клиент просит другое время или отменяет визит" on={v.remind} onChange={() => t('remind')} />
            <Divider />
            <ToggleRow label="Сообщения" sub="Новые входящие в чатах" on={v.msgs} onChange={() => t('msgs')} />
            <Divider />
            <ToggleRow label="Отзывы" sub="После каждого нового" on={v.reviews} onChange={() => t('reviews')} />
            <Divider />
            <ToggleRow label="Маркетинг" sub="Новости платформы" on={v.marketing} onChange={() => t('marketing')} />
          </Card>
        </div>

        <div>
          <SectionTitle title="Тихие часы" subtitle="Не присылаем в это время." />
          <Card padded={false}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <KVItem k="С" v="22:00" />
              <KVItem k="До" v="08:00" right />
            </div>
          </Card>
        </div>

        <div>
          <SectionTitle title="Каналы доставки" />
          <Card padded={false}>
            <ToggleRow label="Push" on={v.push} onChange={() => t('push')} />
            <Divider />
            <ToggleRow label="Email" on={v.email} onChange={() => t('email')} />
            <Divider />
            <ToggleRow label="Telegram" on={v.tg} onChange={() => t('tg')} />
          </Card>
        </div>

        <NeutralBtn icon="check" full onClick={save}>Сохранить настройки доставки</NeutralBtn>
      </div>
    </div>
  );
}

function NotificationEventRow({ event, onClick }: { event: NotificationEvent; onClick?: () => void }) {
  const { T } = useTheme();
  const tone = event.tone === 'danger' ? T.danger
    : event.tone === 'warning' ? T.warn
    : event.tone === 'success' ? T.success
    : event.tone === 'accent' ? T.accent
    : T.text2;
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
      background: event.unread ? T.accentSoft : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
    }}>
      <span style={{ width: 34, height: 34, borderRadius: 12, background: event.unread ? T.bg : T.cardElev, border: `1px solid ${T.border}`, color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={event.icon} size={16} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 13, color: T.text, fontWeight: event.unread ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</span>
          {event.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, flexShrink: 0 }} />}
        </span>
        <span style={{ display: 'block', marginTop: 3, fontSize: 12, color: T.text2, lineHeight: 1.4 }}>{event.text}</span>
        <span style={{ display: 'block', marginTop: 5, fontSize: 10, color: T.text3, fontVariantNumeric: 'tabular-nums' }}>{event.time}{event.source ? ` · ${event.source}` : ''}</span>
      </span>
    </button>
  );
}

function ToggleRow({ label, sub, on, onChange }: { label: string; sub?: string; on: boolean; onChange: (n: boolean) => void }) {
  const { T } = useTheme();
  return (
    <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: T.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function KVItem({ k, v, right }: { k: string; v: string; right?: boolean }) {
  const { T } = useTheme();
  return (
    <div style={{
      padding: '14px 20px',
      borderRight: !right ? `1px solid ${T.border}` : 'none',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <FieldLabel>{k}</FieldLabel>
      <div style={{ fontSize: 13, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
    </div>
  );
}

// ─── Subscription ──────────────────────────
export function SubscriptionScreen({ back }: { back: () => void }) {
  const { T } = useTheme();
  const { SUBSCRIPTION } = useMiniData();
  const periodEnd = SUBSCRIPTION.currentPeriodEnd
    ? new Date(SUBSCRIPTION.currentPeriodEnd).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  return (
    <div>
      <ScreenHeader title="Подписка" subtitle="Тариф и преимущества." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 20, bottom: 20, width: 2, background: T.accent }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <FieldLabel>Текущий тариф</FieldLabel>
            <span style={{ fontSize: 11, color: T.accent }}>{SUBSCRIPTION.status === 'active' ? 'активен' : SUBSCRIPTION.status}</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, color: T.text, letterSpacing: '-0.03em', marginTop: 10 }}>{SUBSCRIPTION.planLabel}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: T.text2 }}>
            <span>До {periodEnd}</span>
            <span>·</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{SUBSCRIPTION.price}</span>
          </div>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SUBSCRIPTION.features.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="check" size={14} color={T.accent} />
                <span style={{ fontSize: 13, color: T.text }}>{f}</span>
              </div>
            ))}
          </div>
          <NeutralBtn full style={{ marginTop: 18 }}>Управлять подпиской</NeutralBtn>
        </Card>

        <SectionTitle title="Сравнить" subtitle="Другие тарифы." />
        <PlanCard name="Базовый" price="0 ₽" features={['До 30 записей в месяц', '1 шаблон', 'Telegram-бот']} active={SUBSCRIPTION.plan === 'free'} />
        <PlanCard name="Pro" price="790 ₽ / мес" features={['Безлимит записей и клиентов', 'Неограниченные шаблоны и рассылки', 'Аналитика по периодам и каналам', 'Интеграции с TG, ВК, Google Calendar', 'Приоритетная поддержка']} active={SUBSCRIPTION.plan === 'pro'} />
        <PlanCard name="Бизнес" price="1 990 ₽ / мес" features={['Всё из Pro', 'Несколько мастеров', 'Брендинг страницы', 'Webhook API']} active={SUBSCRIPTION.plan === 'business'} />
      </div>
    </div>
  );
}

function PlanCard({ name, price, features, active }: { name: string; price: string; features: string[]; active?: boolean }) {
  const { T } = useTheme();
  return (
    <Card style={{ position: 'relative', overflow: 'hidden' }}>
      {active && <div style={{ position: 'absolute', left: 0, top: 16, bottom: 16, width: 2, background: T.accent }} />}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>{name}</span>
        <span style={{ fontSize: 13, color: T.text2, fontVariantNumeric: 'tabular-nums' }}>{price}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {features.map((f) => (
          <div key={f} style={{ fontSize: 12, color: T.text2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: T.text3 }} />
            {f}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Limits ────────────────────────────────
export function LimitsScreen({ back, go }: { back: () => void; go?: (k: string) => void }) {
  const { SUBSCRIPTION } = useMiniData();
  const { limits, usage } = SUBSCRIPTION;
  return (
    <div>
      <ScreenHeader title="Лимиты" subtitle="Использование текущего тарифа." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card padded={false}>
          <LimitRow label="Записей в месяц" used={usage.bookings} total={limits.bookings} />
          <Divider />
          <LimitRow label="Клиентов" used={usage.clients} total={limits.clients} />
          <Divider />
          <LimitRow label="Услуг" used={usage.services} total={limits.services} />
          <Divider />
          <LimitRow label="Шаблонов" used={usage.templates} total={limits.templates} />
          <Divider />
          <LimitRow label="Хранилище" used={usage.storage} total={limits.storage} unit=" ГБ" />
        </Card>
        <div style={{ padding: 16, border: `1px dashed currentColor`, borderRadius: 12, opacity: 0.6, fontSize: 12, lineHeight: 1.5 }}>
          Расширить лимиты можно обновлением тарифа.
        </div>
        <NeutralBtn icon="sparkles" full onClick={() => go && go('subscription')}>Обновить тариф</NeutralBtn>
      </div>
    </div>
  );
}

function LimitRow({ label, used, total, unit = '' }: { label: string; used: number; total: number; unit?: string }) {
  const { T } = useTheme();
  const pct = used / total;
  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: T.text }}>{label}</span>
        <span style={{ fontSize: 13, color: T.text2, fontVariantNumeric: 'tabular-nums' }}>
          {used}{unit} <span style={{ color: T.text3 }}>/ {total}{unit}</span>
        </span>
      </div>
      <div style={{ height: 2, background: T.skeleton, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 1) * 100}%`, background: T.accent }} />
      </div>
    </div>
  );
}
