import type { SVGProps } from 'react';

const base = (props: SVGProps<SVGSVGElement>) => ({
  className: 'ico',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const Icons = {
  Home: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
  ),
  Calendar: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 11h18" /></svg>
  ),
  Clock: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  Users: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-7 7-7s7 3 7 7" /></svg>
  ),
  Chat: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M21 12a8 8 0 1 1-3-6.2L21 4l-1 4.5A8 8 0 0 1 21 12z" /></svg>
  ),
  Grid: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" /></svg>
  ),
  Staff: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M16 11a4 4 0 1 0-8 0M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
  ),
  Chart: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" /></svg>
  ),
  Cog: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.2-1.7l2.1-1.6-2-3.4-2.5.9a7 7 0 0 0-3-1.7L13 1.5h-2L10.6 4a7 7 0 0 0-3 1.7L5.1 4.8l-2 3.4L5.2 9.8A7 7 0 0 0 5 12c0 .6.1 1.1.2 1.7L3.1 15.3l2 3.4 2.5-.9a7 7 0 0 0 3 1.7L11 22h2l.4-2.5a7 7 0 0 0 3-1.7l2.5.9 2-3.4-2.1-1.6c.1-.6.2-1.1.2-1.7z" /></svg>
  ),
  Search: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base({ ...p, strokeWidth: 2 })}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
  ),
  Bell: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 21h4" /></svg>
  ),
  Plus: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
  ),
  ArrowLeft: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M15 18l-6-6 6-6" /></svg>
  ),
  ArrowRight: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M9 18l6-6-6-6" /></svg>
  ),
  Send: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="m3 11 18-8-8 18-2-8z" /></svg>
  ),
  Phone: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
  ),
  Paperclip: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M21 12.5V7a4 4 0 0 0-8 0v8a3 3 0 0 0 6 0V7" /></svg>
  ),
  More: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
  ),
  Close: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
  ),
};
