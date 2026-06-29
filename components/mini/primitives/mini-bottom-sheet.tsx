'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from '../theme';

export function MiniBottomSheet({
  open,
  onClose,
  children,
  maxHeight = '72vh',
  tail = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string;
  tail?: boolean;
}) {
  const { T, mode } = useTheme();
  const dark = mode === 'dark';

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 240,
    background: dark ? 'rgba(0,0,0,0.24)' : 'rgba(255,255,255,0.14)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
  };

  const shellStyle: CSSProperties = {
    position: 'fixed',
    left: '50%',
    bottom: 'calc(82px + var(--miniapp-safe-bottom, 0px))',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 390,
    padding: '0 12px',
    zIndex: 260,
    pointerEvents: 'none',
  };

  const sheetStyle: CSSProperties = {
    pointerEvents: 'auto',
    width: '100%',
    maxHeight,
    overflow: 'hidden',
    borderRadius: 26,
    border: `1px solid ${dark ? 'rgba(255,255,255,0.09)' : 'rgba(10,10,10,0.07)'}`,
    background: dark ? 'rgba(20,20,22,0.86)' : 'rgba(255,255,255,0.90)',
    backdropFilter: 'blur(22px) saturate(1.35)',
    WebkitBackdropFilter: 'blur(22px) saturate(1.35)',
    boxShadow: dark
      ? '0 24px 70px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 24px 70px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.86)',
    color: T.text,
    position: 'relative',
    transform: 'translateZ(0)',
    willChange: 'transform, opacity',
  };

  const handleStyle: CSSProperties = {
    width: 38,
    height: 4,
    borderRadius: 999,
    background: dark ? 'rgba(255,255,255,0.20)' : 'rgba(10,10,10,0.14)',
    margin: '10px auto 8px',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            style={overlayStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
          />

          <div style={shellStyle}>
            <motion.div
              style={sheetStyle}
              initial={{ opacity: 0, y: 18, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.99 }}
              transition={{
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={handleStyle} />
              <div style={{ maxHeight: `calc(${maxHeight} - 22px)`, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 6 }}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
