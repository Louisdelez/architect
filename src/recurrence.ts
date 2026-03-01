import type { CalendarEvent, CalendarViewMode, RecurrenceRule } from './types';

const MAX_ITERATIONS = 3650;

export interface CalendarItem {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  isKanban: boolean;
  masterEventId?: string;
  occurrenceDate?: string;
  isRecurring?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysToDate(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function dayOfWeekMon0(d: Date): number {
  // 0=Mon..6=Sun
  return (d.getDay() + 6) % 7;
}

function getNthWeekdayOfMonth(year: number, month: number, nth: number, weekday: number): Date | null {
  // weekday: 0=Mon..6=Sun, nth: 1-5 (5=last)
  const jsWeekday = (weekday + 1) % 7; // convert to JS 0=Sun..6=Sat
  const lastDay = new Date(year, month + 1, 0);

  if (nth === 5) {
    // last occurrence
    for (let d = lastDay.getDate(); d >= 1; d--) {
      const date = new Date(year, month, d);
      if (date.getDay() === jsWeekday) return date;
    }
    return null;
  }

  let count = 0;
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    if (date.getDay() === jsWeekday) {
      count++;
      if (count === nth) return date;
    }
  }
  return null;
}

function advanceDate(current: Date, rule: RecurrenceRule): Date {
  const r = new Date(current);
  switch (rule.frequency) {
    case 'daily':
      r.setDate(r.getDate() + rule.interval);
      break;
    case 'weekly':
      r.setDate(r.getDate() + 7 * rule.interval);
      break;
    case 'monthly':
      r.setMonth(r.getMonth() + rule.interval);
      break;
    case 'yearly':
      r.setFullYear(r.getFullYear() + rule.interval);
      break;
  }
  return r;
}

// ─── Expand single event ──────────────────────────────────────────

export function expandRecurrences(
  event: CalendarEvent,
  rangeStart: string,
  rangeEnd: string
): CalendarItem[] {
  const rule = event.recurrence;
  if (!rule) {
    // Non-recurring: return as-is if in range
    if (event.date >= rangeStart && event.date <= rangeEnd) {
      return [{
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        color: event.color,
        isKanban: false,
        isRecurring: false,
      }];
    }
    return [];
  }

  const exceptions = event.exceptions ?? [];
  const exceptionMap = new Map(exceptions.map(ex => [ex.originalDate, ex]));
  const items: CalendarItem[] = [];
  const startDate = parseDate(event.date);
  let count = 0;
  let iterations = 0;

  // For weekly with specific weekdays
  const useWeekdays = rule.frequency === 'weekly' && rule.weekdays && rule.weekdays.length > 0;

  let current = new Date(startDate);

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Generate dates for this iteration
    let dates: Date[];
    if (useWeekdays) {
      dates = [];
      for (const wd of rule.weekdays!.sort((a, b) => a - b)) {
        const diff = wd - dayOfWeekMon0(current);
        const d = addDaysToDate(current, diff);
        // For first iteration, skip days before the event start
        if (iterations === 1 && d < startDate) continue;
        dates.push(d);
      }
    } else if (rule.frequency === 'monthly' && rule.monthlyMode?.type === 'nthWeekday') {
      const { nth, weekday } = rule.monthlyMode;
      const result = getNthWeekdayOfMonth(current.getFullYear(), current.getMonth(), nth, weekday);
      dates = result ? [result] : [];
    } else if (rule.frequency === 'monthly' && rule.monthlyMode?.type === 'dayOfMonth') {
      const day = rule.monthlyMode.day;
      const lastDayOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      const actualDay = Math.min(day, lastDayOfMonth);
      dates = [new Date(current.getFullYear(), current.getMonth(), actualDay)];
    } else {
      dates = [new Date(current)];
    }

    for (const d of dates) {
      const dateStr = formatDate(d);

      // Check end conditions
      if (rule.end.type === 'until' && dateStr > rule.end.date) return items;
      if (rule.end.type === 'count' && count >= rule.end.count) return items;

      // Skip dates before range start but still count them
      if (dateStr < rangeStart) {
        count++;
        continue;
      }
      // Stop if past range end
      if (dateStr > rangeEnd) return items;

      count++;

      // Check exceptions
      const exception = exceptionMap.get(dateStr);
      if (exception?.deleted) continue;

      items.push({
        id: `${event.id}__${dateStr}`,
        title: exception?.title ?? event.title,
        description: exception?.description ?? event.description,
        date: exception?.date ?? dateStr,
        startTime: exception?.startTime ?? event.startTime,
        endTime: exception?.endTime ?? event.endTime,
        color: exception?.color ?? event.color,
        isKanban: false,
        masterEventId: event.id,
        occurrenceDate: dateStr,
        isRecurring: true,
      });
    }

    // Advance to next iteration
    current = advanceDate(current, rule);
  }

  return items;
}

// ─── Expand all events ────────────────────────────────────────────

export function expandAllEvents(
  events: CalendarEvent[],
  rangeStart: string,
  rangeEnd: string
): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const event of events) {
    items.push(...expandRecurrences(event, rangeStart, rangeEnd));
  }
  return items;
}

// ─── View date range ──────────────────────────────────────────────

export function getViewDateRange(
  currentDate: Date,
  viewMode: CalendarViewMode
): [string, string] {
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const d = currentDate.getDate();

  switch (viewMode) {
    case 'year': {
      return [`${y}-01-01`, `${y}-12-31`];
    }
    case 'month': {
      // Include surrounding days for the calendar grid (up to 6 weeks)
      const firstOfMonth = new Date(y, m, 1);
      const lastOfMonth = new Date(y, m + 1, 0);
      // Go back to Monday of the first week
      const startOffset = dayOfWeekMon0(firstOfMonth);
      const start = addDaysToDate(firstOfMonth, -startOffset);
      // Go forward to Sunday of the last week
      const endOffset = 6 - dayOfWeekMon0(lastOfMonth);
      const end = addDaysToDate(lastOfMonth, endOffset);
      return [formatDate(start), formatDate(end)];
    }
    case 'week': {
      const dow = dayOfWeekMon0(currentDate);
      const start = addDaysToDate(new Date(y, m, d), -dow);
      const end = addDaysToDate(start, 6);
      return [formatDate(start), formatDate(end)];
    }
    case 'day': {
      const dateStr = formatDate(currentDate);
      return [dateStr, dateStr];
    }
  }
}
