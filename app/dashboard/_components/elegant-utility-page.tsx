'use client';

import { ArrowRight, CheckCircle2, Plus, Settings, Sparkles } from 'lucide-react';

import {
  Card,
  ElegantShell,
  MetricTile,
  MiniLine,
  PrimaryButton,
  SecondaryButton,
  SoftPanel,
  makeValues,
  useElegantWorkspace,
} from '@/app/dashboard/_components/elegant-dashboard-ui';

export function ElegantUtilityPage({
  title,
  description,
  accent = 'coral',
}: {
  title: string;
  description: string;
  accent?: 'coral' | 'violet' | 'green' | 'gold' | 'blue' | 'peach' | 'navy';
}) {
  const workspace = useElegantWorkspace();
  return (
    <ElegantShell>
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section>
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-serif text-[68px] leading-none tracking-[-0.07em] text-[#071c39]">{title}</h1>
              <p className="mt-4 max-w-2xl text-[17px] leading-7 text-[#667085]">{description}</p>
            </div>
            <div className="flex gap-3"><SecondaryButton>Настроить</SecondaryButton><PrimaryButton><Plus className="size-4" /> Добавить</PrimaryButton></div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <MetricTile label="Активно" value="24" hint="↑ 12% за неделю" icon={CheckCircle2} tone={accent} values={makeValues(3)} />
            <MetricTile label="Ожидает внимания" value="5" hint="2 новых события" icon={Settings} tone="gold" values={makeValues(6)} />
            <MetricTile label="Эффективность" value="87%" hint="↑ 8% к прошлому периоду" icon={Sparkles} tone="green" values={makeValues(9)} />
          </div>

          <Card className="p-6">
            <div className="grid gap-5 lg:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <SoftPanel key={index} tone={index % 3 === 0 ? accent : index % 3 === 1 ? 'green' : 'peach'} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-[24px] tracking-[-0.045em] text-[#071c39]">{['Основная настройка', 'Автоматизация', 'Правило уведомлений', 'Интеграция', 'Шаблон', 'Отчёт'][index]}</h3>
                      <p className="mt-2 text-[14px] leading-6 text-[#667085]">Связано с текущим рабочим пространством {workspace.ownedProfile?.name || 'КликБук'} и уже адаптировано под новый стиль интерфейса.</p>
                    </div>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-[12px] font-semibold text-[#6f9b5c]">Активно</span>
                  </div>
                  <button className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-[#071c39]">Открыть <ArrowRight className="size-4" /></button>
                </SoftPanel>
              ))}
            </div>
          </Card>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Card className="bg-[#071c39] p-7 text-white"><h3 className="font-serif text-[30px] tracking-[-0.05em]">Быстрый статус</h3><p className="mt-3 text-white/70">Все ключевые модули работают и доступны в единой дизайн-системе.</p><MiniLine values={makeValues(17)} tone="blue" className="mt-6 h-24" /></Card>
          <SoftPanel tone="peach"><h3 className="font-semibold text-[#071c39]">Рекомендация</h3><p className="mt-2 text-[14px] leading-6 text-[#667085]">Проверьте заполненность профиля и подключите автоматические уведомления, чтобы увеличить подтверждения записей.</p></SoftPanel>
        </aside>
      </div>
    </ElegantShell>
  );
}
