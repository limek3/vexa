'use client';

import { type CSSProperties, Fragment, useState } from 'react';
import { useTheme } from '../theme';
import { Card, Divider, EmptyState, Icon, NeutralBtn, ScreenHeader } from '../primitives/atoms';
import { TemplateDetailSheet } from '../sheets/detail-sheets';
import { type Template } from '@/lib/mini-demo';
import { useMiniData } from '@/hooks/use-mini-data';
import { useMiniToast } from '../bridge';

export function TemplatesScreen({ back }: { back: () => void }) {
  const { T } = useTheme();
  const { TEMPLATES, updateSection } = useMiniData();
  const { show } = useMiniToast();
  const [edit, setEdit] = useState<Template | null>(null);

  async function persist(list: Template[]) {
    const ok = await updateSection('templates', list.map((t) => ({
      id: t.id,
      name: t.name,
      title: t.name,
      body: t.body,
      content: t.body,
      channel: 'Telegram',
      variables: Array.from(new Set((t.body.match(/\{[^}]+\}/g) ?? []).map((v) => v.replace(/[{}]/g, '')))),
      conversion: '',
      enabled: true,
    })));
    if (!ok) show('Не удалось сохранить', 'error');
    return ok;
  }

  async function save(next: Template) {
    const exists = TEMPLATES.some((t) => t.id === next.id);
    const list = exists ? TEMPLATES.map((t) => (t.id === next.id ? next : t)) : [...TEMPLATES, next];
    if (await persist(list)) show('Шаблон сохранён', 'success');
  }

  async function remove(template: Template) {
    const list = TEMPLATES.filter((t) => t.id !== template.id);
    if (await persist(list)) show('Шаблон удалён', 'success');
  }

  async function duplicate(template: Template) {
    const next: Template = {
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} — копия`,
      body: template.body,
    };
    if (await persist([...TEMPLATES, next])) {
      show('Копия создана', 'success');
      setEdit(next);
    }
  }

  function createNew() {
    setEdit({ id: `tpl-${Date.now()}`, name: 'Новый шаблон', body: '' });
  }

  return (
    <div>
      <ScreenHeader title="Шаблоны" subtitle="Заготовки сообщений и приветствий." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <NeutralBtn icon="plus" full onClick={createNew}>Создать шаблон</NeutralBtn>
        {TEMPLATES.length === 0 ? (
          <EmptyState
            icon="file-text"
            title="Шаблонов пока нет"
            text="Создай первый быстрый ответ для подтверждения, напоминания или запроса отзыва."
            action={<NeutralBtn icon="plus" onClick={createNew}>Создать шаблон</NeutralBtn>}
          />
        ) : (
          <Card padded={false}>
            {TEMPLATES.map((t, i) => (
              <Fragment key={t.id}>
                <div onClick={() => setEdit(t)} style={{ padding: '16px 20px', cursor: 'pointer' }}>
                  <div style={{ fontSize: 14, color: T.text, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                    <Icon name="chevron-right" size={14} color={T.text3} />
                  </div>
                  <div style={{
                    fontSize: 12, color: T.text2, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  } as CSSProperties}>{t.body}</div>
                </div>
                {i < TEMPLATES.length - 1 && <Divider />}
              </Fragment>
            ))}
          </Card>
        )}
      </div>

      <TemplateDetailSheet
        template={edit}
        onClose={() => setEdit(null)}
        onSave={save}
        onDelete={remove}
        onDuplicate={duplicate}
      />
    </div>
  );
}
