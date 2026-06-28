import type { LucideIcon } from 'lucide-react';

export type ScreenId =
  | 'dashboard'
  | 'schedule'
  | 'chats'
  | 'clients'
  | 'services'
  | 'analytics'
  | 'public'
  | 'appearance'
  | 'subscription'
  | 'account'
  | 'profile'
  | 'availability'
  | 'templates'
  | 'notifications'
  | 'integrations'
  | 'reviews'
  | 'settings'
  | 'finance'
  | 'marketing'
  | 'payments'
  | 'limits'
  | 'sources'
  | 'help';

export type UtilityScreenId = Extract<
  ScreenId,
  | 'profile'
  | 'availability'
  | 'templates'
  | 'notifications'
  | 'integrations'
  | 'reviews'
  | 'settings'
  | 'finance'
  | 'marketing'
  | 'payments'
  | 'limits'
  | 'sources'
  | 'help'
>;

export type ThemeMode = 'light' | 'dark';
export type Accent = 'clay' | 'sage' | 'indigo' | 'plum' | 'amber';
export type Density = 'compact' | 'default' | 'cozy';
export type Radius = 'sharp' | 'default' | 'round';
export type Language = 'ru' | 'en';

export type Preferences = {
  theme: ThemeMode;
  accent: Accent;
  density: Density;
  radius: Radius;
  language: Language;
};

export type NavItem = {
  id: ScreenId;
  label: string;
  icon: LucideIcon;
  count?: number;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export type MasterProfile = {
  name: string;
  profession: string;
  initials: string;
  city: string;
  studio: string;
  about: string;
  phone: string;
  email: string;
  username: string;
  publicUrl: string;
  rating: number;
  reviews: number;
};

export type ClientStatus = 'vip' | 'regular' | 'new' | 'inactive';

export type Client = {
  id: string;
  name: string;
  phone: string;
  tag: ClientStatus;
  visits: number;
  last: string;
  next: string;
  notes: string;
  status: ClientStatus;
};

export type Service = {
  id: string;
  cat: string;
  name: string;
  dur: number;
  price: number;
  active: boolean;
  public: boolean;
  short: string;
};

export type AppointmentStatus = 'new' | 'confirmed' | 'done' | 'cancelled' | 'noshow';

export type Appointment = {
  id: string;
  day: number;
  start: string;
  end: string;
  clientId: string;
  serviceId: string;
  status: AppointmentStatus;
  notes: string;
};

export type MessageReaction = {
  e: string;
  mine?: boolean;
};

export type ChatMessage = {
  id: string;
  from: 'me' | 'them' | 'system';
  text?: string;
  time: string;
  read?: boolean;
  type?: 'booking' | 'voice' | 'file';
  booking?: {
    serviceId: string;
    date: string;
    time: string;
    dur: number;
    price: number;
  };
  dur?: string;
  fileName?: string;
  fileSize?: string;
  reactions?: MessageReaction[];
  replyTo?: string;
};

export type Chat = {
  id: string;
  clientId: string;
  unread: number;
  time: string;
  pinned?: boolean;
  online: boolean;
  lastSeen?: string;
  preview: string;
  messages: ChatMessage[];
};

export type NotificationItem = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

export type TaskItem = {
  id: string;
  title: string;
  done: boolean;
  due: string;
};

export type DesktopState = {
  preferences: Preferences;
  clients: Client[];
  services: Service[];
  appointments: Appointment[];
  chats: Chat[];
  notifications: NotificationItem[];
  tasks: TaskItem[];
};

export type ToastKind = 'success' | 'info' | 'warning' | 'danger';

export type ToastMessage = {
  id: string;
  title: string;
  body?: string;
  kind: ToastKind;
};
