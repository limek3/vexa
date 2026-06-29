import { accentPalette, accentToneValues, type AccentTone } from '@/lib/appearance-palette';

export type NeutralTone = 'zinc' | 'slate' | 'stone' | 'pearl' | 'sage' | 'sand';
export type DensityMode = 'compact' | 'standard' | 'airy';
export type RadiusMode = 'soft' | 'medium' | 'tight';
export type MotionMode = 'off' | 'fast' | 'smooth';
export type CardMode = 'flat' | 'soft' | 'glass';
export type PublicCover = 'gradient' | 'portrait' | 'minimal';
export type PublicButtonStyle = 'pill' | 'rounded' | 'contrast';
export type PublicCardStyle = 'editorial' | 'soft' | 'compact';
export type PublicServicesStyle = 'grid' | 'chips' | 'stacked';
export type PublicBookingStyle = 'panel' | 'step' | 'minimal';
export type PublicHeroLayout = 'split' | 'centered' | 'compact';
export type PublicSurface = 'soft' | 'contrast' | 'glass';
export type PublicSectionStyle = 'cards' | 'minimal' | 'dividers';
export type PublicGalleryStyle = 'grid' | 'editorial' | 'compact';
export type PublicNavigationStyle = 'side' | 'top' | 'hidden';
export type PublicStatsStyle = 'cards' | 'strip' | 'hidden';
export type PublicCtaMode = 'sticky' | 'inline' | 'quiet';
export type DashboardSurfaceMode = 'calm' | 'clear' | 'contrast';
export type DashboardControlStyle = 'capsule' | 'line' | 'solid';
export type PlatformWidth = 'focused' | 'balanced' | 'wide';
export type SidebarDensity = 'tight' | 'balanced' | 'roomy';
export type TopbarDensity = 'tight' | 'balanced' | 'roomy';
export type MobileFontScale = 'compact' | 'standard';

export type ConstructorPageKey =
  | 'dashboard'
  | 'today'
  | 'stats'
  | 'chats'
  | 'services'
  | 'availability'
  | 'public';

export type DashboardLayoutMode = 'balanced' | 'focus' | 'stacked';
export type TodayLayoutMode = 'balanced' | 'priority' | 'stacked';
export type StatsLayoutMode = 'balanced' | 'detail' | 'stacked';
export type ChatsLayoutMode = 'balanced' | 'focus' | 'assistant';
export type ServicesLayoutMode = 'split' | 'catalog' | 'stacked';
export type AvailabilityLayoutMode = 'split' | 'helper' | 'stacked';
export type PublicLayoutMode = 'split' | 'booking' | 'stacked';

export type DashboardSectionId = 'summary' | 'pipeline' | 'week' | 'highlights';
export type TodaySectionId = 'summary' | 'timeline' | 'queue' | 'insights';
export type StatsSectionId = 'summary' | 'journal' | 'activity' | 'signals';
export type ChatsSectionId = 'inbox' | 'conversation' | 'assistant' | 'clientCard';
export type ServicesSectionId = 'summary' | 'catalog' | 'preview' | 'quickAdd';
export type AvailabilitySectionId = 'summary' | 'editor' | 'presets';
export type PublicSectionId = 'hero' | 'services' | 'booking' | 'contacts' | 'faq' | 'gallery';

export interface LayoutConstructorSettings {
  dashboard: {
    layout: DashboardLayoutMode;
    order: DashboardSectionId[];
  };
  today: {
    layout: TodayLayoutMode;
    order: TodaySectionId[];
  };
  stats: {
    layout: StatsLayoutMode;
    order: StatsSectionId[];
  };
  chats: {
    layout: ChatsLayoutMode;
    order: ChatsSectionId[];
  };
  services: {
    layout: ServicesLayoutMode;
    order: ServicesSectionId[];
  };
  availability: {
    layout: AvailabilityLayoutMode;
    order: AvailabilitySectionId[];
  };
  public: {
    layout: PublicLayoutMode;
    order: PublicSectionId[];
  };
}

export interface AppearanceSettings {
  accentTone: AccentTone;
  neutralTone: NeutralTone;
  density: DensityMode;
  radius: RadiusMode;
  motion: MotionMode;
  cardStyle: CardMode;
  dashboardSurface: DashboardSurfaceMode;
  dashboardControlStyle: DashboardControlStyle;
  publicCover: PublicCover;
  publicAccent: AccentTone;
  publicButtonStyle: PublicButtonStyle;
  publicCardStyle: PublicCardStyle;
  publicServicesStyle: PublicServicesStyle;
  publicBookingStyle: PublicBookingStyle;
  publicHeroLayout: PublicHeroLayout;
  publicSurface: PublicSurface;
  publicSectionStyle: PublicSectionStyle;
  publicGalleryStyle: PublicGalleryStyle;
  publicNavigationStyle: PublicNavigationStyle;
  publicStatsStyle: PublicStatsStyle;
  publicCtaMode: PublicCtaMode;
  platformWidth: PlatformWidth;
  sidebarDensity: SidebarDensity;
  topbarDensity: TopbarDensity;
  mobileFontScale: MobileFontScale;
  layoutConstructor: LayoutConstructorSettings;
}

export const APPEARANCE_STORAGE_KEY = 'sloty-appearance-settings';

export const defaultLayoutConstructor: LayoutConstructorSettings = {
  dashboard: {
    layout: 'balanced',
    order: ['summary', 'pipeline', 'week', 'highlights'],
  },
  today: {
    layout: 'balanced',
    order: ['summary', 'timeline', 'queue', 'insights'],
  },
  stats: {
    layout: 'balanced',
    order: ['summary', 'journal', 'activity', 'signals'],
  },
  chats: {
    layout: 'balanced',
    order: ['inbox', 'conversation', 'assistant', 'clientCard'],
  },
  services: {
    layout: 'split',
    order: ['summary', 'catalog', 'preview', 'quickAdd'],
  },
  availability: {
    layout: 'split',
    order: ['summary', 'editor', 'presets'],
  },
  public: {
    layout: 'split',
    order: ['hero', 'services', 'booking', 'contacts', 'faq', 'gallery'],
  },
};

export const defaultAppearanceSettings: AppearanceSettings = {
  accentTone: 'violet',
  neutralTone: 'pearl',
  density: 'standard',
  radius: 'medium',
  motion: 'smooth',
  cardStyle: 'soft',
  dashboardSurface: 'calm',
  dashboardControlStyle: 'capsule',
  publicCover: 'gradient',
  publicAccent: 'lime',
  publicButtonStyle: 'pill',
  publicCardStyle: 'soft',
  publicServicesStyle: 'grid',
  publicBookingStyle: 'panel',
  publicHeroLayout: 'split',
  publicSurface: 'soft',
  publicSectionStyle: 'cards',
  publicGalleryStyle: 'grid',
  publicNavigationStyle: 'side',
  publicStatsStyle: 'cards',
  publicCtaMode: 'sticky',
  platformWidth: 'balanced',
  sidebarDensity: 'balanced',
  topbarDensity: 'balanced',
  mobileFontScale: 'compact',
  layoutConstructor: defaultLayoutConstructor,
};

const appearanceValueMap = {
  accentTone: accentToneValues,
  neutralTone: ['zinc', 'slate', 'stone', 'pearl', 'sage', 'sand'],
  density: ['compact', 'standard', 'airy'],
  radius: ['soft', 'medium', 'tight'],
  motion: ['off', 'fast', 'smooth'],
  cardStyle: ['flat', 'soft', 'glass'],
  dashboardSurface: ['calm', 'clear', 'contrast'],
  dashboardControlStyle: ['capsule', 'line', 'solid'],
  publicCover: ['gradient', 'portrait', 'minimal'],
  publicAccent: accentToneValues,
  publicButtonStyle: ['pill', 'rounded', 'contrast'],
  publicCardStyle: ['editorial', 'soft', 'compact'],
  publicServicesStyle: ['grid', 'chips', 'stacked'],
  publicBookingStyle: ['panel', 'step', 'minimal'],
  publicHeroLayout: ['split', 'centered', 'compact'],
  publicSurface: ['soft', 'contrast', 'glass'],
  publicSectionStyle: ['cards', 'minimal', 'dividers'],
  publicGalleryStyle: ['grid', 'editorial', 'compact'],
  publicNavigationStyle: ['side', 'top', 'hidden'],
  publicStatsStyle: ['cards', 'strip', 'hidden'],
  publicCtaMode: ['sticky', 'inline', 'quiet'],
  platformWidth: ['focused', 'balanced', 'wide'],
  sidebarDensity: ['tight', 'balanced', 'roomy'],
  topbarDensity: ['tight', 'balanced', 'roomy'],
  mobileFontScale: ['compact', 'standard'],
} as const satisfies {
  [Key in Exclude<keyof AppearanceSettings, 'layoutConstructor'>]: readonly AppearanceSettings[Key][];
};

const constructorOrderMap = {
  dashboard: defaultLayoutConstructor.dashboard.order,
  today: defaultLayoutConstructor.today.order,
  stats: defaultLayoutConstructor.stats.order,
  chats: defaultLayoutConstructor.chats.order,
  services: defaultLayoutConstructor.services.order,
  availability: defaultLayoutConstructor.availability.order,
  public: defaultLayoutConstructor.public.order,
} as const;

const constructorLayoutMap = {
  dashboard: ['balanced', 'focus', 'stacked'],
  today: ['balanced', 'priority', 'stacked'],
  stats: ['balanced', 'detail', 'stacked'],
  chats: ['balanced', 'focus', 'assistant'],
  services: ['split', 'catalog', 'stacked'],
  availability: ['split', 'helper', 'stacked'],
  public: ['split', 'booking', 'stacked'],
} as const;

function normalizeOrder<T extends string>(value: unknown, fallback: readonly T[]) {
  const allowed = new Set(fallback);
  const raw = Array.isArray(value) ? value : [];
  const valid = raw.filter((item): item is T => typeof item === 'string' && allowed.has(item as T));
  const unique = Array.from(new Set(valid));
  return [...unique, ...fallback.filter((item) => !unique.includes(item))];
}

export function normalizeLayoutConstructor(value?: Partial<LayoutConstructorSettings> | null): LayoutConstructorSettings {
  return {
    dashboard: {
      layout:
        value?.dashboard?.layout && constructorLayoutMap.dashboard.includes(value.dashboard.layout)
          ? value.dashboard.layout
          : defaultLayoutConstructor.dashboard.layout,
      order: normalizeOrder(value?.dashboard?.order, constructorOrderMap.dashboard),
    },
    today: {
      layout:
        value?.today?.layout && constructorLayoutMap.today.includes(value.today.layout)
          ? value.today.layout
          : defaultLayoutConstructor.today.layout,
      order: normalizeOrder(value?.today?.order, constructorOrderMap.today),
    },
    stats: {
      layout:
        value?.stats?.layout && constructorLayoutMap.stats.includes(value.stats.layout)
          ? value.stats.layout
          : defaultLayoutConstructor.stats.layout,
      order: normalizeOrder(value?.stats?.order, constructorOrderMap.stats),
    },
    chats: {
      layout:
        value?.chats?.layout && constructorLayoutMap.chats.includes(value.chats.layout)
          ? value.chats.layout
          : defaultLayoutConstructor.chats.layout,
      order: normalizeOrder(value?.chats?.order, constructorOrderMap.chats),
    },
    services: {
      layout:
        value?.services?.layout && constructorLayoutMap.services.includes(value.services.layout)
          ? value.services.layout
          : defaultLayoutConstructor.services.layout,
      order: normalizeOrder(value?.services?.order, constructorOrderMap.services),
    },
    availability: {
      layout:
        value?.availability?.layout && constructorLayoutMap.availability.includes(value.availability.layout)
          ? value.availability.layout
          : defaultLayoutConstructor.availability.layout,
      order: normalizeOrder(value?.availability?.order, constructorOrderMap.availability),
    },
    public: {
      layout:
        value?.public?.layout && constructorLayoutMap.public.includes(value.public.layout)
          ? value.public.layout
          : defaultLayoutConstructor.public.layout,
      order: normalizeOrder(value?.public?.order, constructorOrderMap.public),
    },
  };
}

export function normalizeAppearanceSettings(value?: Partial<AppearanceSettings> | null): AppearanceSettings {
  const next = { ...defaultAppearanceSettings };

  if (!value) {
    return next;
  }

  (Object.keys(appearanceValueMap) as Array<Exclude<keyof AppearanceSettings, 'layoutConstructor'>>).forEach((key) => {
    const candidate = value[key];
    const allowed = appearanceValueMap[key] as readonly string[];

    if (typeof candidate === 'string' && allowed.includes(candidate)) {
      next[key] = candidate as AppearanceSettings[typeof key];
    }
  });

  // Keep the exact accent selected in Appearance. Older builds forced several
  // tones back to violet/lime, which made /desktop chrome ignore the user's
  // selected colour after reload.
  if (next.neutralTone === 'zinc' || next.neutralTone === 'stone' || next.neutralTone === 'slate') {
    next.neutralTone = 'pearl';
  }

  next.layoutConstructor = normalizeLayoutConstructor(
    typeof value.layoutConstructor === 'object' && value.layoutConstructor ? value.layoutConstructor : null,
  );

  return next;
}

export function applyAppearanceToElement(element: HTMLElement, settings: AppearanceSettings) {
  const accent = accentPalette[settings.accentTone] ?? accentPalette.violet;
  const publicAccent = accentPalette[settings.publicAccent] ?? accent;

  element.style.setProperty('--accent-hue', accent.hue);
  element.style.setProperty('--accent-sat', accent.sat);
  element.style.setProperty('--accent-solid', accent.solid);
  element.style.setProperty('--accent-hover', accent.solid);
  element.style.setProperty('--accent-gradient', accent.gradient);
  element.style.setProperty('--accent-soft', accent.soft);
  element.style.setProperty('--primary', accent.solid);
  element.style.setProperty('--primary-hover', accent.solid);
  element.style.setProperty('--gradient-primary', accent.gradient);
  element.style.setProperty('--ring', `color-mix(in srgb, ${accent.solid} 18%, transparent)`);
  element.style.setProperty('--cb-public-accent', publicAccent.solid);
  element.style.setProperty('--cb-public-gradient', publicAccent.gradient);

  element.dataset.slotyAccent = settings.accentTone;
  element.dataset.slotyNeutral = settings.neutralTone;
  element.dataset.slotyDensity = settings.density;
  element.dataset.slotyRadius = settings.radius;
  element.dataset.slotyMotion = settings.motion;
  element.dataset.slotyCardStyle = settings.cardStyle;
  element.dataset.slotyDashboardSurface = settings.dashboardSurface;
  element.dataset.slotyDashboardControl = settings.dashboardControlStyle;
  element.dataset.slotyPublicCover = settings.publicCover;
  element.dataset.slotyPublicAccent = settings.publicAccent;
  element.dataset.slotyPublicButton = settings.publicButtonStyle;
  element.dataset.slotyPublicCard = settings.publicCardStyle;
  element.dataset.slotyPublicServices = settings.publicServicesStyle;
  element.dataset.slotyPublicBooking = settings.publicBookingStyle;
  element.dataset.slotyPublicHero = settings.publicHeroLayout;
  element.dataset.slotyPublicSurface = settings.publicSurface;
  element.dataset.slotyPublicSection = settings.publicSectionStyle;
  element.dataset.slotyPublicGallery = settings.publicGalleryStyle;
  element.dataset.slotyPublicNavigation = settings.publicNavigationStyle;
  element.dataset.slotyPublicStats = settings.publicStatsStyle;
  element.dataset.slotyPublicCta = settings.publicCtaMode;
  element.dataset.slotyPlatformWidth = settings.platformWidth;
  element.dataset.slotySidebarDensity = settings.sidebarDensity;
  element.dataset.slotyTopbarDensity = settings.topbarDensity;
  element.dataset.slotyMobileScale = settings.mobileFontScale;
}

export function buildAppearancePreferenceScript() {
  const fallback = JSON.stringify(defaultAppearanceSettings);
  const key = JSON.stringify(APPEARANCE_STORAGE_KEY);
  const palette = JSON.stringify(accentPalette);

  return `
    try {
      const fallback = ${fallback};
      const palette = ${palette};
      const raw = window.localStorage.getItem(${key});
      const parsed = raw ? JSON.parse(raw) : fallback;
      const settings = { ...fallback, ...parsed };
      // Keep the exact accent selected in Appearance.
      if (settings.neutralTone === 'zinc' || settings.neutralTone === 'stone' || settings.neutralTone === 'slate') settings.neutralTone = 'pearl';
      const accent = palette[settings.accentTone] || palette.violet;
      const publicAccent = palette[settings.publicAccent] || accent;
      const root = document.documentElement;
      root.style.setProperty('--accent-hue', accent.hue);
      root.style.setProperty('--accent-sat', accent.sat);
      root.style.setProperty('--accent-solid', accent.solid);
      root.style.setProperty('--accent-hover', accent.solid);
      root.style.setProperty('--accent-gradient', accent.gradient);
      root.style.setProperty('--accent-soft', accent.soft);
      root.style.setProperty('--primary', accent.solid);
      root.style.setProperty('--primary-hover', accent.solid);
      root.style.setProperty('--gradient-primary', accent.gradient);
      root.style.setProperty('--ring', 'color-mix(in srgb, ' + accent.solid + ' 18%, transparent)');
      root.style.setProperty('--cb-public-accent', publicAccent.solid);
      root.style.setProperty('--cb-public-gradient', publicAccent.gradient);
      root.dataset.slotyAccent = settings.accentTone;
      root.dataset.slotyNeutral = settings.neutralTone;
      root.dataset.slotyDensity = settings.density;
      root.dataset.slotyRadius = settings.radius;
      root.dataset.slotyMotion = settings.motion;
      root.dataset.slotyCardStyle = settings.cardStyle;
      root.dataset.slotyDashboardSurface = settings.dashboardSurface || 'calm';
      root.dataset.slotyDashboardControl = settings.dashboardControlStyle || 'capsule';
      root.dataset.slotyPublicCover = settings.publicCover;
      root.dataset.slotyPublicAccent = settings.publicAccent;
      root.dataset.slotyPublicButton = settings.publicButtonStyle;
      root.dataset.slotyPublicCard = settings.publicCardStyle;
      root.dataset.slotyPublicServices = settings.publicServicesStyle;
      root.dataset.slotyPublicBooking = settings.publicBookingStyle;
      root.dataset.slotyPublicHero = settings.publicHeroLayout;
      root.dataset.slotyPublicSurface = settings.publicSurface;
      root.dataset.slotyPublicSection = settings.publicSectionStyle;
      root.dataset.slotyPublicGallery = settings.publicGalleryStyle;
      root.dataset.slotyPublicNavigation = settings.publicNavigationStyle || 'side';
      root.dataset.slotyPublicStats = settings.publicStatsStyle || 'cards';
      root.dataset.slotyPublicCta = settings.publicCtaMode || 'sticky';
      root.dataset.slotyPlatformWidth = settings.platformWidth;
      root.dataset.slotySidebarDensity = settings.sidebarDensity;
      root.dataset.slotyTopbarDensity = settings.topbarDensity;
      root.dataset.slotyMobileScale = settings.mobileFontScale || 'compact';
    } catch (error) {
      const root = document.documentElement;
      root.dataset.slotyAccent = 'violet';
      root.dataset.slotyNeutral = 'pearl';
      root.dataset.slotyDensity = 'standard';
      root.dataset.slotyRadius = 'medium';
      root.dataset.slotyMotion = 'smooth';
      root.dataset.slotyCardStyle = 'soft';
      root.dataset.slotyDashboardSurface = 'calm';
      root.dataset.slotyDashboardControl = 'capsule';
      root.dataset.slotyPublicCover = 'gradient';
      root.dataset.slotyPublicAccent = 'lime';
      root.dataset.slotyPublicButton = 'pill';
      root.dataset.slotyPublicCard = 'soft';
      root.dataset.slotyPublicServices = 'grid';
      root.dataset.slotyPublicBooking = 'panel';
      root.dataset.slotyPublicHero = 'split';
      root.dataset.slotyPublicSurface = 'soft';
      root.dataset.slotyPublicSection = 'cards';
      root.dataset.slotyPublicGallery = 'grid';
      root.dataset.slotyPublicNavigation = 'side';
      root.dataset.slotyPublicStats = 'cards';
      root.dataset.slotyPublicCta = 'sticky';
      root.dataset.slotyPlatformWidth = 'balanced';
      root.dataset.slotySidebarDensity = 'balanced';
      root.dataset.slotyTopbarDensity = 'balanced';
      root.dataset.slotyMobileScale = 'compact';
    }
  `;
}

export function getPublicButtonClassName(style: PublicButtonStyle, variant: 'primary' | 'secondary' | 'ghost' = 'primary') {
  const shapeClass =
    style === 'pill' ? 'rounded-full' : style === 'rounded' ? 'rounded-[16px]' : 'rounded-[14px]';

  if (variant === 'primary') {
    if (style === 'contrast') {
      return `${shapeClass} bg-foreground text-background hover:opacity-92`;
    }

    return `${shapeClass}`;
  }

  if (variant === 'secondary') {
    if (style === 'contrast') {
      return `${shapeClass} border-foreground/14 bg-card/88 text-foreground hover:bg-accent`;
    }

    return `${shapeClass} border-border bg-card/88 text-foreground hover:bg-accent`;
  }

  return `${shapeClass} text-muted-foreground hover:bg-accent hover:text-foreground`;
}
