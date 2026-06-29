'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'rounded-[16px] border backdrop-blur-[18px] px-1 shadow-[0_24px_70px_rgba(0,0,0,0.18)]',
          title: 'text-[12.5px] font-semibold tracking-[-0.02em]',
          description: 'text-[11px] leading-4 opacity-75',
          closeButton: 'rounded-[10px] border',
        },
      }}
      style={
        {
          '--normal-bg': 'color-mix(in srgb, var(--popover) 92%, transparent)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'color-mix(in srgb, var(--border) 82%, transparent)',
          '--success-bg': 'color-mix(in srgb, var(--popover) 92%, transparent)',
          '--success-text': 'var(--popover-foreground)',
          '--success-border': 'color-mix(in srgb, var(--border) 82%, transparent)',
          '--error-bg': 'color-mix(in srgb, var(--popover) 92%, transparent)',
          '--error-text': 'var(--popover-foreground)',
          '--error-border': 'color-mix(in srgb, var(--border) 82%, transparent)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
