'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Globe2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/locale-context';

export function ProfileLinkCard({
  slug,
  profileName,
  profession,
}: {
  slug: string;
  profileName?: string;
  profession?: string;
}) {
  const { locale } = useLocale();
  const [fullUrl, setFullUrl] = useState(`/m/${slug}`);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setFullUrl(`${window.location.origin}/m/${slug}`);
  }, [slug]);

  const message = useMemo(() => {
    if (locale === 'ru') {
      return `Здравствуйте! Вот моя страница для записи${profileName ? ` к ${profileName}` : ''}: ${fullUrl}\nНа странице уже есть услуги, свободные слоты и быстрый способ оставить заявку${profession ? ` для ${profession}` : ''}.`;
    }

    return `Hello! Here is my booking page${profileName ? ` for ${profileName}` : ''}: ${fullUrl}\nIt already includes services, available slots, and a quick request flow${profession ? ` for the ${profession}` : ''}.`;
  }, [fullUrl, locale, profession, profileName]);

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  const handleShare = async () => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return;
    try {
      await navigator.share({ title: profileName || 'КликБук', text: message, url: fullUrl });
    } catch {}
  };

  const labels = locale === 'ru'
    ? {
        title: 'Публичная ссылка',
        description: 'Скопируйте ссылку или готовое сообщение и отправьте клиенту без лишних шагов.',
        copy: copied ? 'Скопировано' : 'Скопировать ссылку',
        copyMessage: 'Скопировать сообщение',
        share: 'Поделиться',
      }
    : {
        title: locale === 'ru' ? 'Публичная ссылка' : 'Public link',
        description: 'Copy the URL or the ready message and send it to a client.',
        copy: copied ? 'Copied' : 'Copy link',
        copyMessage: 'Copy message',
        share: 'Share',
      };

  return (
    <div className="workspace-card h-full rounded-[18px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold text-foreground">{labels.title}</div>
          <div className="mt-1 text-[12px] leading-5 text-muted-foreground">{labels.description}</div>
        </div>
        <div className="flex size-10 items-center justify-center rounded-[12px] border border-border bg-accent text-muted-foreground">
          <Globe2 className="size-4" />
        </div>
      </div>

      <div className="rounded-[14px] border border-border bg-accent/40 px-3.5 py-3 text-[12px] text-muted-foreground">
        <div className="truncate text-foreground">{fullUrl}</div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" onClick={() => copyValue(fullUrl)}>
          <Copy className="size-4" />
          {labels.copy}
        </Button>
        <Button type="button" variant="outline" onClick={() => copyValue(message)}>
          <Copy className="size-4" />
          {labels.copyMessage}
        </Button>
      </div>

      <Button type="button" variant="ghost" onClick={handleShare}>
        <Share2 className="size-4" />
        {labels.share}
      </Button>
    </div>
  );
}
