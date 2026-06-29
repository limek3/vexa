import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const ignored = [
  '.next/**',
  '.next-sbx/**',
  '.next-preview/**',
  'node_modules/**',
  'public/**',
  'supabase/**',
  '*.md',
  '*.sql',
  // Legacy desktop prototypes — superseded by components/desktop-html-exact.
  // Kept on disk but excluded from lint/build so they cannot conflict.
  '.codex_tmp/**',
  'components/desktop-claude/**',
  'components/desktop-redesign/**',
];

export default [
  { ignores: ignored },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];
