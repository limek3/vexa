'use client';

import { useEffect, useState } from 'react';

export function FancyCursor() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const mediaQuery = window.matchMedia('(pointer: fine)');
    if (!mediaQuery.matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'fancy-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="fancy-cursor-ring"></span><span class="fancy-cursor-dot"></span>';

    const ring = cursor.querySelector<HTMLElement>('.fancy-cursor-ring');
    const dot = cursor.querySelector<HTMLElement>('.fancy-cursor-dot');

    if (!ring || !dot) return;

    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    let dotX = ringX;
    let dotY = ringY;
    let targetX = ringX;
    let targetY = ringY;
    let animationFrame = 0;
    let hovered = false;
    let pressed = false;

    const interactiveSelector = 'a,button,[role="button"],input,textarea,select,[data-slot="select-trigger"],label,[data-cursor="interactive"]';

    const syncState = () => {
      cursor.dataset.hovered = hovered ? 'true' : 'false';
      cursor.dataset.pressed = pressed ? 'true' : 'false';
    };

    const setInteractiveState = (event: MouseEvent) => {
      const interactiveTarget = event.target instanceof Element ? event.target.closest(interactiveSelector) : null;
      hovered = Boolean(interactiveTarget);
      syncState();
    };

    const syncPosition = () => {
      dotX += (targetX - dotX) * 0.58;
      dotY += (targetY - dotY) * 0.58;
      ringX += (targetX - ringX) * 0.16;
      ringY += (targetY - ringY) * 0.16;

      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

      animationFrame = window.requestAnimationFrame(syncPosition);
    };

    const handlePointerMove = (event: MouseEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      setInteractiveState(event);
    };

    const handlePointerDown = () => {
      pressed = true;
      syncState();
    };

    const handlePointerUp = (event: MouseEvent) => {
      pressed = false;
      setInteractiveState(event);
    };

    const handlePointerLeave = () => {
      cursor.style.opacity = '0';
    };

    const handlePointerEnter = () => {
      cursor.style.opacity = '1';
    };

    const handleVisibility = () => {
      cursor.style.opacity = document.visibilityState === 'hidden' ? '0' : '1';
    };

    document.body.dataset.customCursor = 'true';
    document.body.appendChild(cursor);
    setEnabled(true);
    syncState();

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mousedown', handlePointerDown, { passive: true });
    window.addEventListener('mouseup', handlePointerUp, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave, { passive: true });
    window.addEventListener('mouseenter', handlePointerEnter, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility, { passive: true });
    animationFrame = window.requestAnimationFrame(syncPosition);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('mouseenter', handlePointerEnter);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.body.removeAttribute('data-custom-cursor');
      cursor.remove();
      setEnabled(false);
    };
  }, []);

  return enabled ? null : null;
}
