'use client';

import { useState } from 'react';
import { Bot, Filter, MessageCircle, Send, Sparkles, Star } from 'lucide-react';

import { KbShell } from '@/components/klikbook/shell';
import {
  KbAvatar,
  KbButton,
  KbCard,
  KbChip,
  KbDisplay,
  KbDivider,
  KbEyebrow,
  KbStatCard,
} from '@/components/klikbook/primitives';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';

const SAMPLE_REVIEWS = [
  { id: 1, author: 'Анна Кузнецова', rating: 5, source: 'КликБук', date: '18 мая 2025',
    text: 'Алина — настоящая волшебница! Я очень довольна окрашиванием. Уже записалась на следующее посещение.', master: 'Алина', service: 'Окрашивание', replied: false },
  { id: 2, author: 'Елена Смирнова', rating: 4, source: 'Яндекс', date: '17 мая 2025',
    text: 'Хороший сервис, приятная атмосфера. Только не очень удобная зона ожидания.', master: 'Мария', service: 'Стрижка', replied: true },
  { id: 3, author: 'Дмитрий Соколов', rating: 5, source: 'Google', date: '15 мая 2025',
    text: 'Лучший салон в городе. Всё на высоте — от записи до результата.', master: 'Игорь', service: 'Стрижка', replied: false },
];

export default function ReviewsPage() {
  const { ownedProfile } = useOwnedWorkspaceData();
  const [selected, setSelected] = useState(SAMPLE_REVIEWS[0]);
  const [reply, setReply] = useState('');

  return (
    <KbShell
      user={{ name: ownedProfile?.name ?? 'Гость', subtitle: ownedProfile?.profession, avatar: ownedProfile?.avatar ?? null }}
      dateRange="19 — 25 мая"
      notificationsCount={3}
    >
      <div>
        <div>
          <KbEyebrow>Управляйте репутацией салона</KbEyebrow>
          <KbDisplay level={1} className="mt-3">Отзывы</KbDisplay>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KbStatCard label="Средняя оценка" value="4.9" delta="+0.2" icon={<Star size={18} />} iconTone="cream" />
          <KbStatCard label="Всего отзывов" value={148} caption="за период" icon={<MessageCircle size={18} />} iconTone="lavender" />
          <KbStatCard label="Ждут ответа" value={12} caption="новых" icon={<Bot size={18} />} iconTone="peach" />
          <KbStatCard label="Положительных" value="92%" delta="+4%" icon={<Sparkles size={18} />} iconTone="sage" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <KbChip active>Все</KbChip>
              <KbChip>Без ответа</KbChip>
              <KbChip>5 ★</KbChip>
              <KbChip>1—3 ★</KbChip>
              <KbChip>Отрицательные</KbChip>
              <button className="ml-auto inline-flex items-center gap-1 rounded-[12px] border border-[var(--kb-border)] bg-white px-3 py-1.5 text-[12px] text-[var(--kb-text-secondary)]">
                <Filter size={13} /> Источник
              </button>
            </div>

            <ul className="mt-4 space-y-3">
              {SAMPLE_REVIEWS.map((rev) => (
                <li key={rev.id}>
                  <KbCard
                    className={`cursor-pointer p-5 transition ${
                      selected.id === rev.id ? 'ring-2 ring-[var(--kb-coral)]/30' : ''
                    }`}
                    onClick={() => setSelected(rev)}
                  >
                    <div className="flex items-start gap-3">
                      <KbAvatar src={null} alt={rev.author} fallback={rev.author} size={42} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[14px] font-medium">{rev.author}</div>
                            <div className="text-[11px] text-[var(--kb-text-muted)]">{rev.date} · {rev.source}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} className={i < rev.rating ? 'fill-[var(--kb-cream-accent)] text-[var(--kb-cream-accent)]' : 'text-[var(--kb-border)]'} />
                            ))}
                          </div>
                        </div>
                        <p className="mt-3 text-[13px] leading-relaxed text-[var(--kb-text-secondary)]">{rev.text}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <KbChip>{rev.service}</KbChip>
                          <KbChip>{rev.master}</KbChip>
                          {rev.replied ? (
                            <KbChip tone="confirmed">Ответ отправлен</KbChip>
                          ) : (
                            <KbChip tone="pending">Нужен ответ</KbChip>
                          )}
                        </div>
                      </div>
                    </div>
                  </KbCard>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <KbCard className="p-5">
              <KbEyebrow>Оценки по звёздам</KbEyebrow>
              <ul className="mt-4 space-y-2 text-[12px]">
                {[
                  { stars: 5, count: 132, percent: 89 },
                  { stars: 4, count: 11, percent: 7 },
                  { stars: 3, count: 3, percent: 2 },
                  { stars: 2, count: 1, percent: 1 },
                  { stars: 1, count: 1, percent: 1 },
                ].map((row) => (
                  <li key={row.stars} className="flex items-center gap-2">
                    <span className="w-8 text-[var(--kb-text-secondary)]">{row.stars} ★</span>
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[var(--kb-warm-surface)]">
                      <span className="block h-full rounded-full bg-[var(--kb-cream-accent)]" style={{ width: `${row.percent}%` }} />
                    </div>
                    <span className="kb-metric w-8 text-right">{row.count}</span>
                  </li>
                ))}
              </ul>
            </KbCard>

            <KbCard className="p-5">
              <KbEyebrow>Ответ клиенту</KbEyebrow>
              <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-[var(--kb-warm-surface)] p-3 text-[12px]">
                <KbAvatar src={null} alt={selected.author} fallback={selected.author} size={32} />
                <div className="flex-1">
                  <div className="font-medium">{selected.author}</div>
                  <div className="line-clamp-2 text-[var(--kb-text-muted)]">{selected.text}</div>
                </div>
              </div>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                placeholder="Напишите ответ клиенту…"
                className="mt-3 w-full rounded-[14px] border border-[var(--kb-border)] bg-white p-3 text-[13px] outline-none focus:border-[var(--kb-navy)]"
              />
              <div className="mt-3 flex items-center gap-2">
                <KbButton variant="primary" className="flex-1">
                  <Send size={12} /> Отправить
                </KbButton>
                <KbButton variant="outline">
                  <Sparkles size={12} /> AI
                </KbButton>
              </div>
            </KbCard>

            <KbCard tone="soft" className="p-5">
              <div className="flex items-center gap-2 text-[var(--kb-coral)]">
                <Bot size={14} />
                <KbEyebrow className="text-[var(--kb-coral)]">КликБук AI</KbEyebrow>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--kb-text-secondary)]">
                AI поможет составить персональный, тёплый ответ — с учётом эмоционального тона отзыва.
              </p>
            </KbCard>
          </div>
        </div>
      </div>
    </KbShell>
  );
}
