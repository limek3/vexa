export const accentToneValues = [
  'emerald',
  'violet',
  'sky',
  'rose',
  'amber',
  'cyan',
  'indigo',
  'peach',
  'teal',
  'cobalt',
  'ruby',
  'lime',
] as const;

export type AccentTone = (typeof accentToneValues)[number];

export interface AccentPaletteMeta {
  hue: string;
  sat: string;
  solid: string;
  soft: string;
  gradient: string;
}

export const accentPalette: Record<AccentTone, AccentPaletteMeta> = {
  emerald: {
    hue: '164',
    sat: '80%',
    solid: '#10b981',
    soft: 'rgba(16, 185, 129, 0.14)',
    gradient: 'linear-gradient(135deg, #10b981, #0f9f70)',
  },
  violet: {
    hue: '258',
    sat: '88%',
    solid: '#7c5cff',
    soft: 'rgba(124, 92, 255, 0.14)',
    gradient: 'linear-gradient(135deg, #8b6cff, #6f54ef)',
  },
  sky: {
    hue: '199',
    sat: '92%',
    solid: '#0ea5e9',
    soft: 'rgba(14, 165, 233, 0.14)',
    gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
  },
  rose: {
    hue: '340',
    sat: '82%',
    solid: '#f43f5e',
    soft: 'rgba(244, 63, 94, 0.14)',
    gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
  },
  amber: {
    hue: '38',
    sat: '92%',
    solid: '#f59e0b',
    soft: 'rgba(245, 158, 11, 0.14)',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  cyan: {
    hue: '188',
    sat: '94%',
    solid: '#06b6d4',
    soft: 'rgba(6, 182, 212, 0.14)',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
  },
  indigo: {
    hue: '236',
    sat: '83%',
    solid: '#6366f1',
    soft: 'rgba(99, 102, 241, 0.14)',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  },
  peach: {
    hue: '18',
    sat: '95%',
    solid: '#fb7185',
    soft: 'rgba(251, 113, 133, 0.14)',
    gradient: 'linear-gradient(135deg, #fb7185, #f43f5e)',
  },
  teal: {
    hue: '173',
    sat: '80%',
    solid: '#0f766e',
    soft: 'rgba(15, 118, 110, 0.14)',
    gradient: 'linear-gradient(135deg, #14b8a6, #0f766e)',
  },
  cobalt: {
    hue: '214',
    sat: '99%',
    solid: '#127dfe',
    soft: 'rgba(18, 125, 254, 0.14)',
    gradient: 'linear-gradient(135deg, #127dfe, #0f6fe1)',
  },
  ruby: {
    hue: '350',
    sat: '78%',
    solid: '#dc2626',
    soft: 'rgba(220, 38, 38, 0.14)',
    gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)',
  },
  lime: {
    hue: '84',
    sat: '80%',
    solid: '#79a96b',
    soft: 'rgba(121, 169, 107, 0.14)',
    gradient: 'linear-gradient(135deg, #8fc76b, #79a96b)',
  },
};
