'use client';

import { useEffect, useMemo, useState } from 'react';

function getSearchString() {
  if (typeof window === 'undefined') return '';
  return window.location.search || '';
}

function patchHistoryMethod(method: 'pushState' | 'replaceState') {
  if (typeof window === 'undefined') return () => {};

  const historyRef = window.history as History & {
    __klikbukPatchedPushState?: boolean;
    __klikbukPatchedReplaceState?: boolean;
  };
  const flag = method === 'pushState' ? '__klikbukPatchedPushState' : '__klikbukPatchedReplaceState';

  if (historyRef[flag]) {
    return () => {};
  }

  historyRef[flag] = true;
  const original = window.history[method];

  window.history[method] = function patchedHistoryMethod(this: History, ...args: Parameters<History[typeof method]>) {
    const result = original.apply(this, args);

    window.setTimeout(() => {
      window.dispatchEvent(new Event('klikbuk:searchchange'));
    }, 0);

    return result;
  };

  return () => {
    window.history[method] = original;
    historyRef[flag] = false;
  };
}

export function useBrowserSearchParams() {
  const [search, setSearch] = useState(() => getSearchString());

  useEffect(() => {
    let frameId = 0;

    const sync = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const nextSearch = getSearchString();
        setSearch((current) => (current === nextSearch ? current : nextSearch));
      });
    };

    sync();

    const unpatchPush = patchHistoryMethod('pushState');
    const unpatchReplace = patchHistoryMethod('replaceState');

    window.addEventListener('popstate', sync);
    window.addEventListener('klikbuk:searchchange', sync);

    return () => {
      window.cancelAnimationFrame(frameId);
      unpatchPush();
      unpatchReplace();
      window.removeEventListener('popstate', sync);
      window.removeEventListener('klikbuk:searchchange', sync);
    };
  }, []);

  return useMemo(() => new URLSearchParams(search), [search]);
}

export default useBrowserSearchParams;
