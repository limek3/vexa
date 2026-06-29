'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/app-context';
import {
  adaptMaster, adaptServices, adaptAppointments, adaptClients,
  adaptRevenueWeek,
  adaptSchedule, adaptTemplates, adaptSubscription,
  type SubscriptionInfo,
} from '@/lib/mini-adapter';
import type {
  MasterInfo, Service, Appointment, Client, Thread, Message,
  Template, ScheduleDay,
} from '@/lib/mini-demo';

interface MiniData {
  MASTER: MasterInfo;
  SERVICES: Service[];
  APPOINTMENTS: Appointment[];
  CLIENTS: Client[];
  THREADS: Thread[];
  MESSAGES: Message[];
  TEMPLATES: Template[];
  SCHEDULE: ScheduleDay[];
  REVENUE_WEEK: { d: string; v: number; active: boolean }[];
  SUBSCRIPTION: SubscriptionInfo;
  isLoading: boolean;
  refresh: () => Promise<void>;
  updateBookingStatus: (id: string, status: string) => Promise<void>;
  updateSection: <T>(section: string, value: T) => Promise<boolean>;
}

export function useMiniData(): MiniData {
  const app = useApp();
  const [billing, setBilling] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    if (!app.workspaceId) return;

    fetch('/api/subscription', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled) setBilling(data); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [app.workspaceId]);

  const services = adaptServices(app.ownedProfile, app.workspaceData, app.bookings);
  const templates = adaptTemplates(app.workspaceData);

  return {
    MASTER: adaptMaster(app.ownedProfile, app.workspaceData),
    SERVICES: services,
    APPOINTMENTS: adaptAppointments(app.bookings),
    CLIENTS: adaptClients(app.bookings),
    THREADS: [],
    MESSAGES: [],
    TEMPLATES: templates,
    SCHEDULE: adaptSchedule(app.workspaceData),
    REVENUE_WEEK: adaptRevenueWeek(app.bookings),
    SUBSCRIPTION: adaptSubscription(billing, app.bookings, services.length, templates.length),
    isLoading: !app.hasHydrated,
    refresh: app.refreshWorkspace,
    updateBookingStatus: async (id, status) => app.updateBookingStatus(id, status as any),
    updateSection: app.updateWorkspaceSection,
  };
}
