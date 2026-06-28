'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ThemeProvider, useTheme, type ThemeMode } from './theme';
import { Icon } from './primitives/atoms';
import { useChats } from '@/hooks/use-chats';
import { useMiniData } from '@/hooks/use-mini-data';
import { ToastCtx, haptic, tgClose, type ToastItem, type MiniToastCtxValue } from './bridge';
import { buildMiniEventNotifications, unreadEventCount } from '@/lib/notification-events';
import { applyTelegramMiniAppBase, getTelegramWebApp } from '@/lib/telegram-webapp-safe';

const INTRO_BLACK = '#0b0b0b';
const INTRO_WHITE = '#ffffff';
const INTRO_SEEN_KEY = 'clickbook-mini-intro-seen';

type IntroVariant = 'ultra' | 'startup';

const introEase = {
  smooth: [0.16, 1, 0.3, 1] as const,
  cursor: [0.2, 1, 0.26, 1] as const,
  press: [0.68, -0.08, 0.22, 1.08] as const,
};

const INTRO_MODES = {
  ultra: {
    total: 6.2,
    startScale: 1.18,
    slideDuration: 1.12,
    wordDelay: 3.46,
    wordDuration: 1.08,
    bookSheenOpacity: 0.14,
    wordSheenOpacity: 0.18,
    clickRingOpacity: 0.28,
    innerRippleOpacity: 0.1,
    rayScale: 1.06,
    baselineOpacity: 0.08,
  },
  startup: {
    total: 5.8,
    startScale: 1.28,
    slideDuration: 0.94,
    wordDelay: 3.26,
    wordDuration: 0.92,
    bookSheenOpacity: 0.22,
    wordSheenOpacity: 0.28,
    clickRingOpacity: 0.44,
    innerRippleOpacity: 0.18,
    rayScale: 1.16,
    baselineOpacity: 0.16,
  },
} satisfies Record<IntroVariant, Record<string, number>>;

const introTimeline = {
  bookAppear: 0.08,
  cursorIn: 1.7,
  click: 2.78,
  slideStart: 3.14,
};

const introPaths = {
  book: `
    M 59 63 L 49 79 L 49 82 L 46 90 L 46 306 L 52 324 L 56 330 L 67 341 L 76 346 L 85 349 L 90 349 L 91 350 L 166 350 L 167 351 L 179 352 L 195 358 L 205 365 L 206 367 L 215 375 L 222 375 L 227 372 L 234 364 L 241 359 L 258 352 L 270 351 L 271 350 L 339 350 L 347 347 L 350 347 L 356 344 L 369 334 L 375 326 L 378 320 L 382 306 L 382 91 L 381 90 L 381 86 L 379 79 L 375 71 L 370 64 L 364 58 L 355 52 L 353 52 L 348 49 L 341 47 L 335 47 L 334 46 L 269 46 L 268 47 L 245 48 L 235 51 L 227 55 L 221 60 L 219 60 L 213 55 L 205 51 L 195 48 L 189 48 L 188 47 L 175 47 L 174 46 L 94 46 L 93 47 L 87 47 L 73 52 Z
    M 71 78 L 77 72 L 83 68 L 93 65 L 179 65 L 180 66 L 188 66 L 189 67 L 199 69 L 203 71 L 215 85 L 221 86 L 225 84 L 228 79 L 234 73 L 241 69 L 247 67 L 251 67 L 252 66 L 277 65 L 279 67 L 279 135 L 280 136 L 284 135 L 304 120 L 306 120 L 327 136 L 329 136 L 331 134 L 331 66 L 332 65 L 340 66 L 350 71 L 358 79 L 363 90 L 363 272 L 364 273 L 364 298 L 363 299 L 363 306 L 361 312 L 355 321 L 346 328 L 338 331 L 299 331 L 298 332 L 297 331 L 274 331 L 273 332 L 258 333 L 235 341 L 227 346 L 219 353 L 211 346 L 208 345 L 203 341 L 201 341 L 191 336 L 188 336 L 179 333 L 161 332 L 160 331 L 154 331 L 153 332 L 146 332 L 145 331 L 90 331 L 77 325 L 71 319 L 65 307 L 65 102 L 64 101 L 64 97 L 65 96 L 66 87 Z
  `,
  cursor: `
    M 167 181 L 166 183 L 167 197 L 169 204 L 170 221 L 171 222 L 171 228 L 172 229 L 172 237 L 173 238 L 173 244 L 174 245 L 174 252 L 175 253 L 175 260 L 177 267 L 177 274 L 178 275 L 178 283 L 179 286 L 182 288 L 188 287 L 203 268 L 205 267 L 208 270 L 226 300 L 231 300 L 242 294 L 245 291 L 246 288 L 233 267 L 230 260 L 226 255 L 228 253 L 242 251 L 246 249 L 251 249 L 255 246 L 255 241 L 176 183 L 171 180 Z
  `,
  rays: [
    `M 206 145 L 201 145 L 183 163 L 183 168 L 187 171 L 191 170 L 209 152 L 209 148 Z`,
    `M 127 148 L 127 153 L 146 171 L 150 171 L 153 169 L 154 165 L 150 161 L 150 160 L 149 160 L 148 158 L 147 158 L 145 155 L 144 155 L 143 153 L 142 153 L 140 150 L 139 150 L 134 145 L 130 145 Z`,
    `M 115 186 L 115 192 L 118 194 L 145 194 L 148 191 L 148 186 L 146 184 L 118 184 Z`,
    `M 165 130 L 163 132 L 163 134 L 162 135 L 163 137 L 163 159 L 166 162 L 169 162 L 171 161 L 173 158 L 173 134 L 170 130 Z`,
  ],
  letters: [
    `M 566 102 L 487 188 L 572 277 L 574 278 L 578 277 L 601 277 L 603 278 L 604 276 L 599 272 L 518 187 L 518 185 L 595 103 L 595 102 Z M 461 102 L 461 277 L 482 278 L 484 277 L 484 102 Z`,
    `M 684 156 L 675 173 L 668 190 L 665 194 L 655 218 L 653 220 L 653 222 L 627 277 L 628 278 L 631 277 L 649 278 L 651 277 L 651 275 L 656 266 L 659 257 L 661 255 L 664 246 L 666 244 L 690 188 L 692 187 L 696 194 L 699 203 L 701 205 L 704 214 L 706 216 L 725 261 L 727 263 L 732 277 L 734 278 L 737 277 L 754 277 L 755 278 L 756 276 L 751 267 L 748 258 L 746 256 L 741 243 L 739 241 L 736 232 L 730 221 L 730 219 L 728 217 L 728 215 L 715 189 L 710 176 L 708 174 L 700 156 Z`,
    `M 785 156 L 784 157 L 784 277 L 799 277 L 800 278 L 803 277 L 874 192 L 876 193 L 876 277 L 894 277 L 895 278 L 898 277 L 898 157 L 897 156 L 881 156 L 879 157 L 817 232 L 807 242 L 806 241 L 806 156 Z`,
    `M 1013 156 L 974 198 L 959 212 L 959 215 L 972 227 L 1017 277 L 1020 278 L 1021 277 L 1043 277 L 1044 278 L 1045 276 L 1041 273 L 1035 265 L 987 214 L 987 212 L 1025 172 L 1038 157 L 1038 156 Z M 935 156 L 934 157 L 934 277 L 935 278 L 955 277 L 956 276 L 956 157 L 955 156 Z`,
    `M 1189 102 L 1155 102 L 1150 101 L 1149 102 L 1077 102 L 1076 103 L 1076 276 L 1077 277 L 1083 277 L 1084 278 L 1102 278 L 1103 277 L 1147 277 L 1150 278 L 1151 277 L 1160 277 L 1171 274 L 1182 269 L 1196 255 L 1200 248 L 1203 239 L 1204 216 L 1199 200 L 1195 194 L 1185 184 L 1169 176 L 1153 173 L 1100 173 L 1099 172 L 1099 127 L 1100 126 L 1099 125 L 1101 123 L 1188 123 L 1189 121 Z M 1099 195 L 1100 194 L 1114 194 L 1115 193 L 1133 193 L 1134 194 L 1154 194 L 1166 198 L 1176 207 L 1180 216 L 1181 229 L 1176 243 L 1168 251 L 1160 255 L 1151 257 L 1101 257 L 1099 255 Z`,
    `M 1343 156 L 1321 156 L 1280 249 L 1278 248 L 1240 158 L 1238 156 L 1216 156 L 1215 157 L 1268 275 L 1255 306 L 1246 324 L 1244 331 L 1266 331 L 1268 329 L 1314 222 L 1316 220 L 1321 206 L 1327 195 L 1335 175 L 1337 173 L 1342 159 L 1344 157 Z`,
    `M 1444 156 L 1398 206 L 1390 212 L 1390 214 L 1413 237 L 1449 277 L 1470 277 L 1471 278 L 1474 277 L 1475 278 L 1476 276 L 1418 213 L 1470 157 L 1469 156 Z M 1366 156 L 1365 157 L 1365 277 L 1366 278 L 1387 277 L 1387 214 L 1388 213 L 1387 212 L 1387 157 L 1386 156 Z`,
  ],
};

function StaticIntroLogo() {
  return (
    <svg viewBox="0 0 1523 422" role="img" aria-labelledby="clickbook-static-title clickbook-static-desc" style={{ width: '60%', maxWidth: 720, height: 'auto' }}>
      <title id="clickbook-static-title">КликБук — логотип</title>
      <desc id="clickbook-static-desc">Минималистичный чёрно-белый логотип КликБук.</desc>
      <rect width="100%" height="100%" fill={INTRO_WHITE} />
      <g fill={INTRO_BLACK} fillRule="evenodd" clipRule="evenodd" shapeRendering="geometricPrecision">
        <path d={introPaths.book} />
        <path d={introPaths.cursor} />
        {introPaths.rays.map((ray, index) => <path key={index} d={ray} />)}
        {introPaths.letters.map((letter, index) => <path key={index} d={letter} />)}
      </g>
    </svg>
  );
}

function ClickBookLogoIntro({ variant = 'ultra', onDone }: { variant?: IntroVariant; onDone?: () => void }) {
  const [isSkipping, setIsSkipping] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const rawId = useId().replace(/:/g, '');
  const mode = INTRO_MODES[variant];

  const wordRevealId = `wordRevealClip-${rawId}`;
  const wordStaticId = `wordStaticClip-${rawId}`;
  const bookStaticId = `bookStaticClip-${rawId}`;
  const sheenId = `whiteSheen-${rawId}`;
  const titleId = `clickbook-intro-title-${rawId}`;
  const descId = `clickbook-intro-desc-${rawId}`;

  const slideStart = introTimeline.slideStart / mode.total;
  const slideEnd = (introTimeline.slideStart + mode.slideDuration) / mode.total;
  const iconTimes = [0, 0.1, 0.24, slideStart, slideEnd, 1];
  const overlayDuration = shouldReduceMotion ? 0.9 : mode.total + 0.35;
  const fadeStart = shouldReduceMotion ? 0.55 : mode.total / overlayDuration;

  const finishIntro = useCallback(() => {
    setIsSkipping(true);
    window.setTimeout(() => onDone?.(), 180);
  }, [onDone]);

  useEffect(() => {
    const timer = window.setTimeout(() => finishIntro(), overlayDuration * 1000);
    return () => window.clearTimeout(timer);
  }, [finishIntro, overlayDuration]);

  if (shouldReduceMotion) {
    return (
      <motion.div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          width: '100%',
          maxWidth: 390,
          height: 'var(--miniapp-viewport-height, 100dvh)',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: INTRO_WHITE,
          padding: 32,
          overflow: 'hidden',
        }}
        animate={{ opacity: isSkipping ? 0 : [1, 1, 0] }}
        transition={isSkipping ? { duration: 0.18, ease: 'easeOut' } : { duration: overlayDuration, times: [0, fadeStart, 1], ease: 'easeOut' }}
      >
        <StaticIntroLogo />
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        width: '100%',
        maxWidth: 390,
        height: 'var(--miniapp-viewport-height, 100dvh)',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: INTRO_WHITE,
        padding: 24,
        pointerEvents: 'auto',
      }}
      animate={{ opacity: isSkipping ? 0 : [1, 1, 0] }}
      transition={isSkipping ? { duration: 0.18, ease: 'easeOut' } : { duration: overlayDuration, times: [0, fadeStart, 1], ease: 'easeOut' }}
    >
      <motion.svg
        viewBox="0 0 1523 422"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        style={{ width: '60%', maxWidth: 720, height: 'auto' }}
        initial="hidden"
        animate="show"
      >
        <title id={titleId}>КликБук — premium UI brand logo animation</title>
        <desc id={descId}>
          Сначала крупным планом появляется только книга. Камера плавно отдаляется, затем курсор подъезжает справа снизу,
          кликает по книге, книга прожимается как кнопка, отъезжает влево и справа появляется текст КликБук.
        </desc>

        <defs>
          <clipPath id={wordRevealId}>
            <motion.rect
              x="432"
              y="72"
              height="300"
              initial={{ width: 0 }}
              animate={{ width: 1088 }}
              transition={{ delay: mode.wordDelay, duration: mode.wordDuration, ease: introEase.smooth }}
            />
          </clipPath>

          <clipPath id={wordStaticId}>
            <rect x="432" y="72" width="1088" height="300" />
          </clipPath>

          <clipPath id={bookStaticId}>
            <rect x="20" y="22" width="396" height="382" />
          </clipPath>

          <linearGradient id={sheenId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={INTRO_WHITE} stopOpacity="0" />
            <stop offset="0.44" stopColor={INTRO_WHITE} stopOpacity="0" />
            <stop offset="0.5" stopColor={INTRO_WHITE} stopOpacity="0.68" />
            <stop offset="0.56" stopColor={INTRO_WHITE} stopOpacity="0" />
            <stop offset="1" stopColor={INTRO_WHITE} stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill={INTRO_WHITE} />

        <motion.g
          id="wordmark"
          clipPath={`url(#${wordRevealId})`}
          fill={INTRO_BLACK}
          fillRule="evenodd"
          clipRule="evenodd"
          shapeRendering="geometricPrecision"
          initial={{ opacity: 0, x: -22, y: 6, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: mode.wordDelay + 0.02, duration: variant === 'startup' ? 0.78 : 0.9, ease: introEase.smooth }}
        >
          {introPaths.letters.map((letter, index) => (
            <motion.path
              key={index}
              d={letter}
              initial={{ opacity: 0, x: variant === 'startup' ? 20 : 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: mode.wordDelay + 0.04 + index * (variant === 'startup' ? 0.026 : 0.032),
                duration: variant === 'startup' ? 0.46 : 0.52,
                ease: introEase.smooth,
              }}
            />
          ))}
        </motion.g>

        <motion.rect
          id="wordmark-final-shine"
          x="330"
          y="70"
          width="180"
          height="304"
          fill={`url(#${sheenId})`}
          clipPath={`url(#${wordStaticId})`}
          initial={{ opacity: 0, x: 0, skewX: -16 }}
          animate={{ opacity: [0, mode.wordSheenOpacity, 0], x: [0, 1020, 1110], skewX: -16 }}
          transition={{ delay: mode.wordDelay + 1.08, duration: variant === 'startup' ? 0.86 : 1.0, times: [0, 0.48, 1], ease: introEase.smooth }}
        />

        <motion.rect
          id="temporary-baseline-accent"
          x="458"
          y="315"
          height="3"
          rx="1.5"
          fill={INTRO_BLACK}
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: [0, mode.baselineOpacity, 0], width: [0, variant === 'startup' ? 600 : 460, variant === 'startup' ? 600 : 460] }}
          transition={{ delay: mode.wordDelay + 1.22, duration: 0.74, ease: introEase.smooth }}
        />

        <motion.g
          id="icon"
          animate={{
            x: [548, 548, 548, 548, 0, 0],
            y: [0, 0, 0, 0, 0, 0],
            scale: [mode.startScale, mode.startScale, 1, 1, 1, 1],
          }}
          transition={{ duration: mode.total, times: iconTimes, ease: introEase.smooth }}
          style={{ transformOrigin: '214px 211px' }}
        >
          <motion.g
            id="book-button"
            initial={{ opacity: 0, scale: 0.965, y: 10 }}
            animate={{
              opacity: 1,
              scale: [0.965, 1, 1, 0.94, variant === 'startup' ? 1.022 : 1.014, 1],
              y: [10, 0, 0, 5, -1, 0],
            }}
            transition={{
              opacity: { delay: introTimeline.bookAppear, duration: 0.38, ease: introEase.smooth },
              scale: { delay: introTimeline.bookAppear, duration: 3.1, times: [0, 0.18, 0.77, 0.87, 0.95, 1], ease: introEase.press },
              y: { delay: introTimeline.bookAppear, duration: 3.1, times: [0, 0.18, 0.77, 0.87, 0.95, 1], ease: introEase.press },
            }}
            style={{ transformOrigin: '214px 211px' }}
          >
            <rect x="20" y="22" width="396" height="382" fill={INTRO_WHITE} />
            <path d={introPaths.book} fill={INTRO_BLACK} fillRule="evenodd" clipRule="evenodd" shapeRendering="geometricPrecision" />

            <motion.rect
              id="book-premium-sheen"
              x="-110"
              y="22"
              width="120"
              height="382"
              fill={`url(#${sheenId})`}
              clipPath={`url(#${bookStaticId})`}
              initial={{ opacity: 0, x: 0, skewX: -16 }}
              animate={{ opacity: [0, mode.bookSheenOpacity, 0], x: [0, 470, 520], skewX: -16 }}
              transition={{ delay: 0.62, duration: variant === 'startup' ? 0.72 : 0.86, times: [0, 0.48, 1], ease: introEase.smooth }}
            />
          </motion.g>

          <motion.path
            id="cursor"
            d={introPaths.cursor}
            fill={INTRO_BLACK}
            fillRule="evenodd"
            clipRule="evenodd"
            shapeRendering="geometricPrecision"
            initial={{ opacity: 0, x: 320, y: 240, scale: 0.9, rotate: -4 }}
            animate={{
              opacity: [0, 0, 1, 1, 1, 1],
              x: [320, 320, 142, 40, 0, 0],
              y: [240, 240, 108, 30, 0, 0],
              scale: [0.9, 0.9, 0.98, 1, 0.88, 1],
              rotate: [-4, -4, -1.2, 0, 0, 0],
            }}
            transition={{ delay: introTimeline.cursorIn, duration: variant === 'startup' ? 1.22 : 1.36, times: [0, 0.08, 0.5, 0.74, 0.88, 1], ease: introEase.cursor }}
            style={{ transformOrigin: '210px 248px' }}
          />

          <motion.circle
            id="click-halo"
            cx="166"
            cy="185"
            r="28"
            fill="none"
            stroke={INTRO_BLACK}
            strokeWidth={variant === 'startup' ? 4.8 : 4}
            initial={{ opacity: 0, scale: 0.45, pathLength: 0 }}
            animate={{ opacity: [0, mode.clickRingOpacity, 0], scale: [0.45, variant === 'startup' ? 1.42 : 1.25, variant === 'startup' ? 1.72 : 1.48], pathLength: [0, 1, 1] }}
            transition={{ delay: introTimeline.click + 0.04, duration: variant === 'startup' ? 0.64 : 0.58, times: [0, 0.48, 1], ease: introEase.cursor }}
            style={{ transformOrigin: '166px 185px' }}
          />

          <motion.circle
            id="inner-click-ripple"
            cx="166"
            cy="185"
            r="9"
            fill={INTRO_BLACK}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, mode.innerRippleOpacity, 0], scale: [0.2, variant === 'startup' ? 2.2 : 1.8, variant === 'startup' ? 2.8 : 2.4] }}
            transition={{ delay: introTimeline.click + 0.02, duration: variant === 'startup' ? 0.52 : 0.46, times: [0, 0.36, 1], ease: introEase.cursor }}
            style={{ transformOrigin: '166px 185px' }}
          />

          <motion.g
            id="click-rays"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { delayChildren: introTimeline.click + 0.08, staggerChildren: variant === 'startup' ? 0.022 : 0.028 } },
            }}
          >
            {introPaths.rays.map((ray, index) => (
              <motion.path
                key={index}
                d={ray}
                fill={INTRO_BLACK}
                fillRule="evenodd"
                clipRule="evenodd"
                shapeRendering="geometricPrecision"
                variants={{
                  hidden: { opacity: 0, scale: 0.64, y: 1 },
                  show: {
                    opacity: [0, 1, 0],
                    scale: [0.64, mode.rayScale, 0.98],
                    y: [1, 0, 0],
                    transition: { duration: variant === 'startup' ? 0.54 : 0.48, times: [0, 0.32, 1], ease: introEase.smooth },
                  },
                }}
                style={{ transformOrigin: '166px 174px' }}
              />
            ))}
          </motion.g>
        </motion.g>
      </motion.svg>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 'calc(8px + var(--miniapp-safe-bottom, 0px))',
          height: 2,
          borderRadius: 999,
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.08)',
        }}
      >
        <motion.div
          style={{ height: '100%', borderRadius: 999, background: INTRO_BLACK, transformOrigin: 'left center' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: overlayDuration, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}

function ToastHost({ items }: { items: ToastItem[] }) {
  const { T } = useTheme();
  return (
    <div style={{
      position: 'fixed', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, bottom: 96, zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none',
    }}>
      <style>{`@keyframes mini-toast-in { from { transform: translateY(8px) scale(.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }`}</style>
      {items.map((it) => (
        <div key={it.id} style={{
          background: it.tone === 'error' ? T.danger : it.tone === 'success' ? T.success : T.cardElev,
          color: it.tone === 'info' ? T.text : '#fff',
          border: `1px solid ${T.border}`,
          padding: '10px 16px', borderRadius: 14, fontSize: 13,
          maxWidth: '85%', boxShadow: T.cardShadow,
          animation: 'mini-toast-in 0.18s cubic-bezier(.2,.8,.2,1) both',
        }}>{it.text}</div>
      ))}
    </div>
  );
}

import { HomeScreen } from './screens/home';
import { AppointmentsScreen } from './screens/appointments';
import { ServicesScreen } from './screens/services';
import { ClientsScreen } from './screens/clients';
import { MoreScreen } from './screens/more';
import { ChatsScreen, ChatThreadScreen } from './screens/chats';
import { AnalyticsScreen } from './screens/analytics';
import { ScheduleScreen } from './screens/schedule';
import { TemplatesScreen } from './screens/templates';
import {
  ProfileScreen, AppearanceScreen, NotificationsScreen, SubscriptionScreen, LimitsScreen,
} from './screens/settings';
import {
  FinanceScreen, PaymentsScreen, IntegrationsScreen, SourcesScreen, MarketingScreen, ReviewsScreen,
} from './screens/money';

import type { Thread } from '@/lib/mini-demo';

const MINI_NOTIFICATION_READ_KEY = 'clickbook-mini-notification-read-ids';
const MINI_NOTIFICATION_READ_EVENT = 'clickbook-mini-notification-read-change';

function readMiniNotificationIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MINI_NOTIFICATION_READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

// ─── Tab definitions ─────────────────────────
type TabId = 'home' | 'appts' | 'chats' | 'clients' | 'more';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'home',     label: 'Главная',  icon: 'home' },
  { id: 'appts',    label: 'Записи',   icon: 'calendar' },
  { id: 'chats',    label: 'Чаты',     icon: 'message-square' },
  { id: 'clients',  label: 'Клиенты',  icon: 'users' },
  { id: 'more',     label: 'Ещё',      icon: 'more-horizontal' },
];

function miniGlass(mode: ThemeMode, edge: 'top' | 'bottom' = 'top'): CSSProperties {
  const dark = mode === 'dark';
  return {
    backgroundColor: dark ? 'rgba(10,10,13,0.62)' : 'rgba(250,250,254,0.58)',
    backdropFilter: 'blur(34px) saturate(2.15) brightness(0.98)',
    WebkitBackdropFilter: 'blur(34px) saturate(2.15) brightness(0.98)',
    boxShadow: edge === 'top'
      ? (dark
        ? 'inset 0 -1px 0 rgba(255,255,255,0.07), 0 12px 48px rgba(0,0,0,0.52)'
        : 'inset 0 -1px 0 rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.07)')
      : (dark
        ? 'inset 0 1px 0 rgba(255,255,255,0.07), 0 -24px 64px rgba(0,0,0,0.56)'
        : 'inset 0 1px 0 rgba(0,0,0,0.06), 0 -24px 64px rgba(0,0,0,0.05)'),
    transform: 'translate3d(0,0,0)',
    willChange: 'backdrop-filter',
    isolation: 'isolate',
  };
}

interface SubRoute {
  kind: string;
  payload?: Thread;
}

// ─── Bottom Nav ──────────────────────────────
function BottomNav({ active, onChange, chatUnreadCount = 0 }: { active: TabId; onChange: (id: TabId) => void; chatUnreadCount?: number }) {
  const { T, mode } = useTheme();
  const dark = mode === 'dark';
  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      bottom: 0,
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 390,
      padding: '4px 10px calc(2px + var(--miniapp-safe-bottom, var(--tg-content-safe-bottom, var(--tg-safe-bottom, env(safe-area-inset-bottom, 0px)))))',
      zIndex: 80,
      pointerEvents: 'auto',
    }}>
      <div style={{
        ...miniGlass(mode, 'bottom'),
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 3,
        padding: 4,
        border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)'}`,
        borderRadius: 20,
        backgroundColor: dark ? 'rgba(17,17,17,0.58)' : 'rgba(255,255,255,0.54)',
        boxShadow: dark
          ? '0 -16px 44px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.045)'
          : '0 -16px 44px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.78)',
      }}>
        {TABS.map((t) => {
          const isActive = active === t.id;
          const showBadge = t.id === 'chats' && chatUnreadCount > 0;
          return (
            <button key={t.id} onClick={() => { haptic('light'); onChange(t.id); }} style={{
              border: `1px solid ${isActive ? (dark ? 'rgba(255,255,255,0.075)' : 'rgba(0,0,0,0.06)') : 'transparent'}`,
              cursor: 'pointer',
              height: 46,
              minWidth: 0,
              borderRadius: 14,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
              background: isActive
                ? (dark ? 'rgba(255,255,255,0.065)' : 'rgba(0,0,0,0.045)')
                : 'transparent',
              color: isActive ? T.accent : T.text3,
              boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 22px rgba(0,0,0,0.24)' : 'none',
              transition: 'background 0.18s ease, color 0.18s ease, transform 0.12s ease, border-color 0.18s ease',
            }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={t.icon} size={17} stroke={isActive ? 2.05 : 1.6} />
                {showBadge && (
                  <span style={{
                    position: 'absolute', top: -8, right: -12, minWidth: 16, height: 16,
                    padding: '0 4px', borderRadius: 999,
                    background: T.danger, color: '#fff',
                    border: `2px solid ${dark ? 'rgba(17,17,17,0.92)' : 'rgba(255,255,255,0.95)'}`,
                    fontSize: 8, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontVariantNumeric: 'tabular-nums',
                    boxShadow: `0 4px 10px ${T.danger}44`,
                  }}>{chatUnreadCount > 9 ? '9+' : chatUnreadCount}</span>
                )}
              </div>
              <span style={{
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 9,
                lineHeight: 1,
                fontWeight: isActive ? 600 : 500,
                letterSpacing: '-0.04em',
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Telegram-style header ───────────────────
function TgHeader({ onToggleTheme, onNotifications, notificationCount = 0 }: { onToggleTheme: () => void; onNotifications: () => void; notificationCount?: number }) {
  const { T, mode } = useTheme();
  const { MASTER } = useMiniData();
  const dark = mode === 'dark';
  const iconBtn: CSSProperties = {
    width: 32, height: 32,
    background: dark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.045)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
    borderRadius: 11, cursor: 'pointer', color: T.text2, padding: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.045)',
  };
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 390,
      padding: 'calc(36px + var(--miniapp-safe-top, var(--tg-content-safe-top, 0px))) 10px 4px',
      zIndex: 80,
      pointerEvents: 'auto',
    }}>
      <div style={{
        ...miniGlass(mode, 'top'),
        padding: '8px 8px 8px 10px',
        minHeight: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
        borderRadius: 18,
        border: `1px solid ${dark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.045)'}`,
        backgroundColor: dark ? 'rgba(17,17,17,0.56)' : 'rgba(255,255,255,0.52)',
        boxShadow: dark
          ? '0 14px 42px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.045)'
          : '0 14px 42px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.72)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 11, flexShrink: 0,
            background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: dark ? '0 6px 18px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 6px 18px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            fontSize: 13, color: T.text, fontWeight: 800, letterSpacing: '-0.05em',
          }}>
            {MASTER.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={MASTER.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : 'К'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1, letterSpacing: '-0.045em' }}>КликБук</div>
            <div style={{ fontSize: 9, color: T.text3, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>MINI APP</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button onClick={() => { haptic('light'); onNotifications(); }} aria-label="notifications" style={{ ...iconBtn, position: 'relative' }}>
            <Icon name="bell" size={14} stroke={1.65} />
            {notificationCount > 0 && (
              <span className="notif-badge" style={{
                position: 'absolute', top: -3, right: -3, minWidth: 15, height: 15,
                padding: '0 4px', borderRadius: 999,
                background: T.danger, color: '#fff',
                border: `2px solid ${T.bg}`,
                fontSize: 8, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontVariantNumeric: 'tabular-nums',
                boxShadow: `0 2px 6px ${T.danger}66`,
              }}>{notificationCount > 9 ? '9+' : notificationCount}</span>
            )}
          </button>
          <button onClick={onToggleTheme} aria-label="theme" style={iconBtn}>
            <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={14} stroke={1.55} />
          </button>
          <button onClick={tgClose} aria-label="close" style={iconBtn}>
            <Icon name="x" size={14} stroke={1.85} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inner shell ─────────────────────────────
function MiniAppInner({ initialTab = 'home', initialSub = null }: { initialTab?: TabId; initialSub?: SubRoute | null }) {
  const { T, mode, toggle } = useTheme();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [sub, setSub] = useState<SubRoute | null>(initialSub);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== '1';
  });
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { threads } = useChats();
  const { APPOINTMENTS } = useMiniData();
  const notificationEvents = useMemo(() => (
    buildMiniEventNotifications(APPOINTMENTS, threads).map((event) => ({
      ...event,
      unread: event.unread && !readNotificationIds.includes(event.id),
    }))
  ), [APPOINTMENTS, threads, readNotificationIds]);
  const notificationCount = Math.min(99, unreadEventCount(notificationEvents));
  const unreadChatCount = Math.min(99, threads.reduce((sum, thread) => sum + thread.unread, 0));

  const closeIntro = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    }
    setShowIntro(false);
    haptic('success');
  }, []);

  const toastApi = useMemo<MiniToastCtxValue>(() => ({
    show: (text, tone = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, text, tone }]);
      window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2400);
      haptic(tone === 'error' ? 'error' : tone === 'success' ? 'success' : 'light');
    },
  }), []);

  useEffect(() => {
    setReadNotificationIds(readMiniNotificationIds());
    const sync = () => setReadNotificationIds(readMiniNotificationIds());
    window.addEventListener('storage', sync);
    window.addEventListener(MINI_NOTIFICATION_READ_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(MINI_NOTIFICATION_READ_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [tab, sub?.kind]);

  // Telegram WebApp init: keep viewport/safe areas in sync.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyViewport = () => {
      const tg = getTelegramWebApp();
      applyTelegramMiniAppBase(tg);
      const contentSafeArea = tg?.contentSafeAreaInset ?? {};
      const safeArea = tg?.safeAreaInset ?? {};
      const topInset = Number(contentSafeArea.top ?? 0);
      const bottomInset = Number(contentSafeArea.bottom ?? safeArea.bottom ?? 0);
      const viewportHeight = Number(tg?.viewportStableHeight ?? tg?.viewportHeight ?? window.innerHeight);

      // Не прибавляем native Telegram/header safe area второй раз: WebView уже стартует ниже него.
      document.documentElement.style.setProperty('--miniapp-header-top-offset', '12px');
      if (Number.isFinite(topInset)) document.documentElement.style.setProperty('--miniapp-safe-top', `${Math.max(0, Math.round(topInset))}px`);
      if (Number.isFinite(bottomInset)) document.documentElement.style.setProperty('--miniapp-safe-bottom', `${Math.max(0, Math.round(bottomInset))}px`);
      if (Number.isFinite(viewportHeight) && viewportHeight > 0) {
        document.documentElement.style.setProperty('--miniapp-viewport-height', `${Math.round(viewportHeight)}px`);
      }
    };

    applyViewport();
    const onChange = () => applyViewport();
    try { getTelegramWebApp()?.onEvent?.('viewportChanged', onChange); } catch {}
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    return () => {
      try { getTelegramWebApp()?.offEvent?.('viewportChanged', onChange); } catch {}
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
    };
  }, []);

  // Back button
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = getTelegramWebApp();
    const back = tg?.BackButton;
    if (!back) return;
    if (sub) {
      try { back.show(); } catch {}
    } else {
      try { back.hide(); } catch {}
    }
    const handler = () => setSub(null);
    try { back.onClick(handler); } catch {}
    return () => { try { back.offClick(handler); } catch {} };
  }, [sub]);

  const goSub = useCallback((kind: string, payload?: Thread) => {
    haptic('light');
    const tabAliases: Record<string, TabId> = {
      home: 'home',
      appts: 'appts',
      appointments: 'appts',
      chats: 'chats',
      clients: 'clients',
      more: 'more',
    };
    const nextTab = tabAliases[kind];
    if (nextTab) {
      setTab(nextTab);
      setSub(null);
      return;
    }
    setSub({ kind, payload });
  }, []);
  const back = useCallback(() => setSub(null), []);

  // Render screen content
  let content: ReactNode = null;
  if (sub) {
    switch (sub.kind) {
      case 'chats':         content = <ChatsScreen openThread={(t) => setSub({ kind: 'thread', payload: t })} back={back} />; break;
      case 'services':      content = <ServicesScreen back={back} />; break;
      case 'thread':        content = sub.payload ? <ChatThreadScreen thread={sub.payload} back={() => setSub({ kind: 'chats' })} /> : null; break;
      case 'analytics':     content = <AnalyticsScreen back={back} />; break;
      case 'schedule':      content = <ScheduleScreen back={back} />; break;
      case 'templates':     content = <TemplatesScreen back={back} />; break;
      case 'profile':       content = <ProfileScreen back={back} />; break;
      case 'appearance':    content = <AppearanceScreen back={back} />; break;
      case 'notifications': content = <NotificationsScreen back={back} />; break;
      case 'subscription':  content = <SubscriptionScreen back={back} />; break;
      case 'limits':        content = <LimitsScreen back={back} go={(g) => setSub({ kind: g })} />; break;
      case 'finance':       content = <FinanceScreen back={back} />; break;
      case 'payments':      content = <PaymentsScreen back={back} />; break;
      case 'integrations':  content = <IntegrationsScreen back={back} />; break;
      case 'sources':       content = <SourcesScreen back={back} />; break;
      case 'marketing':     content = <MarketingScreen back={back} />; break;
      case 'reviews':       content = <ReviewsScreen back={back} />; break;
      default: content = <div style={{ padding: 24, color: T.text2 }}>Coming soon</div>;
    }
  } else {
    if (tab === 'home') content = <HomeScreen go={goSub} />;
    else if (tab === 'appts') content = <AppointmentsScreen go={goSub} />;
    else if (tab === 'chats') content = <ChatsScreen openThread={(t) => setSub({ kind: 'thread', payload: t })} />;
    else if (tab === 'clients') content = <ClientsScreen go={goSub} />;
    else if (tab === 'more') content = <MoreScreen go={goSub} />;
  }

  // Chat thread = full height (no global mini header/nav)
  const isFullHeight = Boolean(sub && sub.kind === 'thread');

  return (
    <ToastCtx.Provider value={toastApi}>
      <motion.div
        className="cb-miniapp cb-mini-app-root"
        data-mini-theme={mode}
        data-mini-mode={mode}
        initial={false}
        animate={{
          opacity: showIntro ? 0.92 : 1,
          scale: showIntro ? 0.995 : 1,
        }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        style={{
        '--mini-bg': T.bg,
        '--mini-card': T.card,
        '--mini-input-bg': T.inputBg,
        '--mini-text': T.text,
        '--mini-text-muted': T.text3,
        '--mini-accent': T.accent,
        '--miniapp-accent': T.accent,
        width: '100%', maxWidth: 390, height: 'var(--miniapp-viewport-height, 100dvh)', minHeight: '100svh',
        background: T.bg, color: T.text, colorScheme: mode,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
        overflow: 'hidden',
        paddingTop: 0,
        paddingBottom: 0,
        margin: '0 auto',
        transition: 'background 0.34s cubic-bezier(.2,.8,.2,1), color 0.34s cubic-bezier(.2,.8,.2,1)',
        position: 'relative',
      } as CSSProperties}>
        <style>{`
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            overscroll-behavior: none;
          }

          .cb-miniapp, .cb-miniapp * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
          .cb-miniapp button:active { opacity: 0.7; transform: scale(0.94); }
          @keyframes badge-pop { 0% { transform: scale(0); } 70% { transform: scale(1.25); } 100% { transform: scale(1); } }
          .cb-miniapp .notif-badge { animation: badge-pop 0.28s cubic-bezier(.2,.8,.2,1) both; }
          .cb-miniapp input, .cb-miniapp textarea, .cb-miniapp select {
            -webkit-appearance: none !important;
            appearance: none !important;
            background: var(--mini-input-bg, #0d0d0d) !important;
            background-color: var(--mini-input-bg, #0d0d0d) !important;
            background-image: none !important;
            background-clip: padding-box !important;
            box-shadow: 0 0 0 1000px var(--mini-input-bg, #0d0d0d) inset !important;
            -webkit-box-shadow: 0 0 0 1000px var(--mini-input-bg, #0d0d0d) inset !important;
            border-color: var(--mini-control-border, rgba(255,255,255,0.08)) !important;
            color: var(--mini-text, #fafafa) !important;
            color-scheme: dark;
            caret-color: var(--miniapp-accent, #127dfe) !important;
            -webkit-text-fill-color: var(--mini-text, #fafafa) !important;
            border-radius: 10px;
            outline: none !important;
            transition: background-color .22s ease, border-color .22s ease, color .22s ease, box-shadow .22s ease;
          }
          .cb-miniapp textarea {
            resize: vertical;
          }
          .cb-miniapp select {
            background-image:
              linear-gradient(45deg, transparent 50%, var(--mini-text-muted, rgba(250,250,250,.48)) 50%),
              linear-gradient(135deg, var(--mini-text-muted, rgba(250,250,250,.48)) 50%, transparent 50%) !important;
            background-position: calc(100% - 17px) 50%, calc(100% - 12px) 50% !important;
            background-size: 5px 5px, 5px 5px !important;
            background-repeat: no-repeat !important;
            padding-right: 34px !important;
          }
          .cb-miniapp select option,
          .cb-miniapp select optgroup {
            background: var(--mini-input-bg, #0d0d0d) !important;
            color: var(--mini-text, #fafafa) !important;
          }
          .cb-miniapp input[type="date"], .cb-miniapp input[type="time"] {
            min-height: 44px;
            line-height: normal !important;
            color-scheme: dark;
          }
          .cb-miniapp input[type="date"]::-webkit-datetime-edit,
          .cb-miniapp input[type="date"]::-webkit-datetime-edit-fields-wrapper,
          .cb-miniapp input[type="date"]::-webkit-datetime-edit-text,
          .cb-miniapp input[type="date"]::-webkit-datetime-edit-month-field,
          .cb-miniapp input[type="date"]::-webkit-datetime-edit-day-field,
          .cb-miniapp input[type="date"]::-webkit-datetime-edit-year-field,
          .cb-miniapp input[type="time"]::-webkit-datetime-edit,
          .cb-miniapp input[type="time"]::-webkit-datetime-edit-fields-wrapper,
          .cb-miniapp input[type="time"]::-webkit-datetime-edit-text,
          .cb-miniapp input[type="time"]::-webkit-datetime-edit-hour-field,
          .cb-miniapp input[type="time"]::-webkit-datetime-edit-minute-field,
          .cb-miniapp input[type="time"]::-webkit-datetime-edit-ampm-field,
          .cb-miniapp input[type="date"]::-webkit-date-and-time-value,
          .cb-miniapp input[type="time"]::-webkit-date-and-time-value {
            background: transparent !important;
            color: var(--mini-text, #fafafa) !important;
            -webkit-text-fill-color: var(--mini-text, #fafafa) !important;
            text-align: left;
          }
          .cb-miniapp input[type="date"]::-webkit-calendar-picker-indicator,
          .cb-miniapp input[type="time"]::-webkit-calendar-picker-indicator {
            -webkit-appearance: none !important;
            appearance: none !important;
            background-color: transparent !important;
            background-image: none !important;
            border: 0 !important;
            color: var(--mini-text, #fafafa) !important;
            cursor: pointer;
            filter: invert(1) brightness(1.35) opacity(.72);
            opacity: .78;
          }
          .cb-miniapp input[type="date"]::-webkit-inner-spin-button,
          .cb-miniapp input[type="date"]::-webkit-clear-button,
          .cb-miniapp input[type="time"]::-webkit-inner-spin-button,
          .cb-miniapp input[type="time"]::-webkit-clear-button {
            -webkit-appearance: none !important;
            appearance: none !important;
            display: none !important;
          }
          .cb-miniapp input.cb-mini-transparent, .cb-miniapp textarea.cb-mini-transparent,
          .cb-miniapp input.cb-mini-input-reset, .cb-miniapp textarea.cb-mini-input-reset,
          .cb-miniapp input.cb-mini-input-reset:focus, .cb-miniapp textarea.cb-mini-input-reset:focus,
          .cb-miniapp input.cb-mini-input-reset:hover, .cb-miniapp textarea.cb-mini-input-reset:hover,
          .cb-miniapp input.cb-mini-input-reset:active, .cb-miniapp textarea.cb-mini-input-reset:active {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            border: 0 !important;
            outline: none !important;
            border-radius: 0 !important;
            background-clip: padding-box !important;
            color: var(--mini-text, #fafafa) !important;
            -webkit-text-fill-color: var(--mini-text, #fafafa) !important;
            caret-color: var(--miniapp-accent, #127dfe) !important;
          }
          .cb-miniapp input.cb-mini-input-reset::-webkit-search-decoration,
          .cb-miniapp input.cb-mini-input-reset::-webkit-search-cancel-button,
          .cb-miniapp input.cb-mini-input-reset::-webkit-search-results-button,
          .cb-miniapp input.cb-mini-input-reset::-webkit-search-results-decoration {
            -webkit-appearance: none;
            appearance: none;
            display: none;
          }
          .cb-miniapp input:-webkit-autofill, .cb-miniapp textarea:-webkit-autofill {
            box-shadow: 0 0 0 999px var(--mini-input-bg, #0d0d0d) inset !important;
            -webkit-box-shadow: 0 0 0 999px var(--mini-input-bg, #0d0d0d) inset !important;
            -webkit-text-fill-color: var(--mini-text, #fafafa) !important;
            caret-color: var(--miniapp-accent, #127dfe) !important;
          }
          .cb-miniapp[data-mini-mode="light"] input,
          .cb-miniapp[data-mini-mode="light"] textarea,
          .cb-miniapp[data-mini-mode="light"] select {
            color-scheme: light;
            background: var(--mini-input-bg, #ffffff) !important;
            background-color: var(--mini-input-bg, #ffffff) !important;
            box-shadow: 0 0 0 1000px var(--mini-input-bg, #ffffff) inset !important;
            -webkit-box-shadow: 0 0 0 1000px var(--mini-input-bg, #ffffff) inset !important;
          }
          .cb-miniapp[data-mini-mode="light"] input[type="date"]::-webkit-calendar-picker-indicator,
          .cb-miniapp[data-mini-mode="light"] input[type="time"]::-webkit-calendar-picker-indicator {
            filter: none;
            opacity: .62;
          }
          .cb-miniapp ::placeholder { color: ${T.text3}; opacity: 1; -webkit-text-fill-color: ${T.text3}; }
          .cb-miniapp { --miniapp-accent: ${T.accent}; --mini-control-border: ${T.border}; }
        `}</style>
        {!isFullHeight && (
          <TgHeader
            onToggleTheme={toggle}
            onNotifications={() => setSub({ kind: 'notifications' })}
            notificationCount={notificationCount}
          />
        )}
        {isFullHeight ? (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingTop: 'calc(54px + var(--miniapp-safe-top, var(--tg-content-safe-top, 0px)))',
              background: T.bg,
            }}
          >
            {content}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="scroll-area"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingTop: 'calc(100px + var(--miniapp-safe-top, 0px))',
              paddingBottom: 'calc(76px + var(--miniapp-safe-bottom, 0px))',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {content}
          </div>
        )}
        {!isFullHeight && <BottomNav active={tab} chatUnreadCount={unreadChatCount} onChange={(id) => { setTab(id); setSub(null); }} />}
        {showIntro && <ClickBookLogoIntro variant="ultra" onDone={closeIntro} />}
        <ToastHost items={toasts} />
      </motion.div>
    </ToastCtx.Provider>
  );
}

// ─── Public wrapper ──────────────────────────
export interface MiniAppProps {
  initialTab?: TabId;
  initialSub?: SubRoute | null;
  mode?: ThemeMode;
}

export function MiniApp({ initialTab = 'home', initialSub = null, mode = 'dark' }: MiniAppProps) {
  return (
    <ThemeProvider initialMode={mode}>
      <MiniAppInner initialTab={initialTab} initialSub={initialSub} />
    </ThemeProvider>
  );
}
