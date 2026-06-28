
'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Inbox, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Booking, BookingStatus } from '@/lib/types';
import { useLocale } from '@/lib/locale-context';
import { formatCreatedAt, formatDateTime } from '@/lib/utils';
import { BookingStatusBadge, useBookingStatusOptions } from '@/components/booking/booking-status-badge';
import { Button } from '@/components/ui/button';
import { HelpHint } from '@/components/ui/help-hint';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BookingsListProps {
  title: string;
  description: string;
  bookings: Booking[];
  onStatusChange?: (bookingId: string, status: BookingStatus) => void;
  pageSize?: number;
}

type SortMode = 'newest' | 'oldest' | 'visitSoon';

function compareVisitDate(a: Booking, b: Booking) {
  const aDate = new Date(`${a.date}T${a.time}`).getTime();
  const bDate = new Date(`${b.date}T${b.time}`).getTime();
  return aDate - bDate;
}

export function BookingsList({ title, description, bookings, onStatusChange, pageSize = 0 }: BookingsListProps) {
  const { locale } = useLocale();
  const statusOptions = useBookingStatusOptions();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [page, setPage] = useState(1);

  const labels = locale === 'ru'
    ? {
        search: 'Поиск по имени, номеру, услуге или комментарию',
        all: 'Все',
        newest: 'Сначала новые',
        oldest: 'Сначала старые',
        visitSoon: 'Ближайшие визиты',
        clear: 'Сбросить',
        emptyTitle: 'Ничего не найдено',
        emptyDescription: 'Смените фильтр или очистите поиск, чтобы вернуть полный список.',
        total: 'Всего',
        new: 'Новые',
        upcoming: 'Ближайшие',
        filtersHint: 'Фильтры и сортировка помогают быстро переключаться между новыми заявками, старыми обращениями и ближайшими визитами.',
        page: 'Страница',
        created: 'Создано',
        visit: 'Визит',
        action: 'Статус',
      }
    : {
        search: 'Search by client, phone, service or note',
        all: 'All',
        newest: 'Newest first',
        oldest: 'Oldest first',
        visitSoon: 'Upcoming visits',
        clear: 'Reset',
        emptyTitle: 'Nothing matched',
        emptyDescription: 'Change the filter or clear search to see all requests.',
        total: 'Total',
        new: 'New',
        upcoming: 'Upcoming',
        filtersHint: 'Filters let you jump between new requests, older bookings, and the nearest visits without leaving the table.',
        page: 'Page',
        created: 'Created',
        visit: 'Visit',
        action: 'Status',
      };

  const filteredBookings = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const result = bookings.filter((booking) => {
      const matchesQuery =
        !normalized ||
        [booking.clientName, booking.clientPhone, booking.service, booking.comment || ''].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    if (sortMode === 'newest') {
      return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (sortMode === 'oldest') {
      return [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return [...result].sort(compareVisitDate);
  }, [bookings, query, sortMode, statusFilter]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(filteredBookings.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);

  const visibleBookings = useMemo(() => {
    if (pageSize <= 0) return filteredBookings;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBookings.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredBookings, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [query, sortMode, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const upcomingCount = bookings.filter((booking) => new Date(`${booking.date}T${booking.time}`).getTime() >= Date.now()).length;
  const newCount = bookings.filter((booking) => booking.status === 'new').length;
  const hasFilters = Boolean(query) || statusFilter !== 'all' || sortMode !== 'newest';

  return (
    <section className="workspace-card rounded-[18px] p-3.5 md:p-5">
      <div className="flex flex-col gap-4 border-b border-border pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-foreground md:text-[18px]">{title}</h2>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground md:text-[13px] md:leading-6">{description}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[320px]">
            {[
              { label: labels.total, value: bookings.length },
              { label: labels.new, value: newCount },
              { label: labels.upcoming, value: upcomingCount },
            ].map((item) => (
              <div key={item.label} className="rounded-[14px] border border-border bg-accent/40 px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground md:text-[11px]">{item.label}</div>
                <div className="mt-1 text-[17px] font-semibold text-foreground md:text-[18px]">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.search} className="pl-9" />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | BookingStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={labels.all} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{labels.all}</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={labels.newest} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{labels.newest}</SelectItem>
              <SelectItem value="oldest">{labels.oldest}</SelectItem>
              <SelectItem value="visitSoon">{labels.visitSoon}</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setQuery('');
                setStatusFilter('all');
                setSortMode('newest');
              }}
            >
              <X className="size-4" />
              {labels.clear}
            </Button>
          ) : (
            <div className="hidden items-center justify-end gap-2 text-[12px] text-muted-foreground xl:flex">
              <SlidersHorizontal className="size-4" />
              <span>{locale === 'ru' ? 'Фильтры активны по требованию' : 'Filters stay quiet by default'}</span>
              <HelpHint
                content={labels.filtersHint}
                className="h-5 w-5 border-border/60 bg-accent/50"
                iconClassName="size-3"
              />
            </div>
          )}
        </div>
      </div>

      {filteredBookings.length > 0 ? (
        <>
          <div className="mt-4 grid gap-2.5 md:hidden">
            {visibleBookings.map((booking) => (
              <div key={booking.id} className="rounded-[16px] border border-border bg-card/94 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-foreground">{booking.clientName}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{booking.clientPhone}</div>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>

                <div className="mt-3 rounded-[14px] border border-border/80 bg-accent/20 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-foreground">{booking.service}</div>
                  {booking.comment ? <div className="mt-1 text-[10.5px] leading-4.5 text-muted-foreground">{booking.comment}</div> : null}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-[12px] border border-border/80 bg-background/76 px-3 py-2">
                    <div className="text-[10px] text-muted-foreground">{labels.visit}</div>
                    <div className="mt-1 inline-flex items-center gap-2 text-[11px] font-medium text-foreground">
                      <CalendarClock className="size-3.5 text-muted-foreground" />
                      {formatDateTime(booking.date, booking.time, locale)}
                    </div>
                  </div>
                  <div className="rounded-[12px] border border-border/80 bg-background/76 px-3 py-2">
                    <div className="text-[10px] text-muted-foreground">{labels.created}</div>
                    <div className="mt-1 text-[11px] font-medium text-foreground">{formatCreatedAt(booking.createdAt, locale)}</div>
                  </div>
                </div>

                <div className="mt-3">
                  {onStatusChange ? (
                    <Select value={booking.status} onValueChange={(value) => onStatusChange(booking.id, value as BookingStatus)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={labels.action} />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === 'ru' ? 'Клиент' : 'Client'}</TableHead>
                  <TableHead>{locale === 'ru' ? 'Услуга' : 'Service'}</TableHead>
                  <TableHead>{locale === 'ru' ? 'Визит' : 'Visit'}</TableHead>
                  <TableHead>{locale === 'ru' ? 'Статус' : 'Status'}</TableHead>
                  <TableHead>{locale === 'ru' ? 'Создано' : 'Created'}</TableHead>
                  <TableHead className="w-[150px]">{locale === 'ru' ? 'Действие' : 'Action'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{booking.clientName}</div>
                      <div className="mt-1 text-[12px] text-muted-foreground">{booking.clientPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{booking.service}</div>
                      {booking.comment ? (
                        <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{booking.comment}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-2 text-foreground">
                        <CalendarClock className="size-4 text-muted-foreground" />
                        {formatDateTime(booking.date, booking.time, locale)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>{formatCreatedAt(booking.createdAt, locale)}</TableCell>
                    <TableCell>
                      {onStatusChange ? (
                        <Select value={booking.status} onValueChange={(value) => onStatusChange(booking.id, value as BookingStatus)}>
                          <SelectTrigger size="sm" className="w-full min-w-[132px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
              <div className="text-[12px] text-muted-foreground">
                {labels.page} {currentPage} / {totalPages}
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={
                      pageNumber === currentPage
                        ? 'inline-flex size-8 items-center justify-center rounded-[12px] border border-primary/28 bg-primary/12 text-[12px] font-semibold text-primary md:size-9'
                        : 'inline-flex size-8 items-center justify-center rounded-[12px] border border-border bg-background text-[12px] font-medium text-foreground transition hover:border-primary/20 hover:text-foreground md:size-9'
                    }
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-4 rounded-[16px] border border-dashed border-border bg-accent/20 px-5 py-10 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
            <Inbox className="size-5" />
          </div>
          <div className="mt-4 text-[16px] font-medium text-foreground">{labels.emptyTitle}</div>
          <div className="mx-auto mt-2 max-w-[440px] text-[13px] leading-6 text-muted-foreground">{labels.emptyDescription}</div>
        </div>
      )}
    </section>
  );
}
