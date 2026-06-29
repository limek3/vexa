'use client';

import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  Appointment,
  AppointmentStatus,
  DesktopState,
  Preferences,
  ScreenId,
  Service,
  ToastKind,
} from './types';

export type DesktopContextValue = {
  state: DesktopState;
  setState: Dispatch<SetStateAction<DesktopState>>;
  screen: ScreenId;
  go: (screen: ScreenId) => void;
  openCreate: (preset?: Partial<Appointment>) => void;
  notify: (title: string, body?: string, kind?: ToastKind) => void;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  toggleTask: (id: string) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  updateService: (service: Service) => void;
  sendMessage: (chatId: string, text: string) => void;
  markNotificationsRead: () => void;
};

export const DesktopContext = createContext<DesktopContextValue | null>(null);

export function useDesktop() {
  const context = useContext(DesktopContext);
  if (!context) {
    throw new Error('useDesktop must be used inside DesktopContext.Provider');
  }
  return context;
}
