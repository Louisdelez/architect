import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  format,
  addMonths, subMonths,
  addWeeks, subWeeks,
  addDays, subDays,
  addYears, subYears,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  isSameMonth, isToday,
  getHours, getMinutes,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Plus, Columns3, Trash2, X, Repeat } from 'lucide-react';
import type { CalendarEvent, CalendarViewMode, KanbanCard, RecurrenceRule, RecurrenceFrequency, RecurrenceEnd, MonthlyMode, RecurrenceException } from '../types';
import { expandAllEvents, getViewDateRange } from '../recurrence';
import type { CalendarItem } from '../recurrence';
import { useI18n } from '../i18n/I18nContext';

const EVENT_COLORS = [
  '#007aff', '#ff9500', '#ff3b30', '#34c759',
  '#af52de', '#ff2d55', '#5ac8fa', '#ffcc00',
];

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface DragState {
  item: CalendarItem;
  originX: number;
  originY: number;
  offsetY: number;
  gridRect: DOMRect;
  dayDates: string[];
  colWidth: number;
  currentDate: string;
  currentStartTime: string;
  currentEndTime: string;
  active: boolean;
  view: 'week' | 'day' | 'month';
}

interface CalendarViewProps {
  events: CalendarEvent[];
  kanbanCards: KanbanCard[];
  onAddEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEvent: (eventId: string, fields: Partial<Pick<CalendarEvent, 'title' | 'description' | 'date' | 'startTime' | 'endTime' | 'color' | 'recurrence' | 'exceptions'>>) => void;
  onDeleteEvent: (eventId: string) => void;
  onUpdateOccurrence: (eventId: string, occurrenceDate: string, fields: Partial<Pick<RecurrenceException, 'title' | 'description' | 'date' | 'startTime' | 'endTime' | 'color'>>) => void;
  onDeleteOccurrence: (eventId: string, occurrenceDate: string) => void;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function clampMinutes(mins: number): number {
  return Math.max(0, Math.min(23 * 60 + 45, mins));
}

function snapTo15(mins: number): number {
  return Math.round(mins / 15) * 15;
}

function minutesToTop(time: string): number {
  return (timeToMinutes(time) / 60) * HOUR_HEIGHT;
}

function eventHeight(start: string, end: string): number {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return Math.max((diff / 60) * HOUR_HEIGHT, 4);
}

// ─── RecurrenceActionDialog ──────────────────────────────────────
interface RecurrenceActionDialogProps {
  actionLabel: string; // "Modifier" | "Supprimer" | "Déplacer"
  onThis: () => void;
  onAll: () => void;
  onCancel: () => void;
}

function RecurrenceActionDialog({ actionLabel, onThis, onAll, onCancel }: RecurrenceActionDialogProps) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-backdrop" onClick={onCancel} />
      <div className="modal-content relative w-full max-w-sm bg-surface rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-modal)' }}>
        <div className="px-6 pt-5 pb-2">
          <h3 className="text-[15px] font-semibold text-text text-center">
            {t('calendar.recurrenceActionTitle', { action: actionLabel })}
          </h3>
          <p className="text-[13px] text-text-muted text-center mt-1">
            {t('calendar.recurrenceActionHint')}
          </p>
        </div>
        <div className="p-4 space-y-2">
          <button
            onClick={onThis}
            className="w-full px-4 py-2.5 text-[13px] font-medium rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-text hover:bg-black/[0.07] dark:hover:bg-white/[0.1] apple-transition cursor-pointer"
          >
            {t('calendar.thisEventOnly')}
          </button>
          <button
            onClick={onAll}
            className="w-full px-4 py-2.5 text-[13px] font-medium rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-text hover:bg-black/[0.07] dark:hover:bg-white/[0.1] apple-transition cursor-pointer"
          >
            {t('calendar.allEvents')}
          </button>
        </div>
        <div className="px-4 pb-4">
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 text-[13px] font-medium rounded-xl text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RecurrencePicker ────────────────────────────────────────────
interface RecurrencePickerProps {
  rule: RecurrenceRule | undefined;
  onChange: (rule: RecurrenceRule | undefined) => void;
  eventDate: string; // to compute default monthlyMode
}

function RecurrencePicker({ rule, onChange, eventDate }: RecurrencePickerProps) {
  const { t } = useI18n();

  const FREQ_OPTIONS: { value: 'none' | RecurrenceFrequency | 'custom'; label: string }[] = [
    { value: 'none', label: t('calendar.recurrenceNone') },
    { value: 'daily', label: t('calendar.recurrenceDaily') },
    { value: 'weekly', label: t('calendar.recurrenceWeekly') },
    { value: 'monthly', label: t('calendar.recurrenceMonthly') },
    { value: 'yearly', label: t('calendar.recurrenceYearly') },
    { value: 'custom', label: t('calendar.recurrenceCustom') },
  ];

  const weekdayLabels = t('calendar.weekdayLabels').split(',');
  const weekdayNames = t('calendar.weekdayNames').split(',');

  const FREQ_UNIT_LABELS: Record<RecurrenceFrequency, string> = {
    daily: t('calendar.freqDays'),
    weekly: t('calendar.freqWeeks'),
    monthly: t('calendar.freqMonths'),
    yearly: t('calendar.freqYears'),
  };

  const preset = !rule ? 'none'
    : (rule.interval === 1 && !rule.weekdays?.length && !rule.monthlyMode) ? rule.frequency
    : 'custom';
  const [mode, setMode] = useState<'none' | RecurrenceFrequency | 'custom'>(preset);
  const [freq, setFreq] = useState<RecurrenceFrequency>(rule?.frequency ?? 'weekly');
  const [interval, setInterval] = useState(rule?.interval ?? 1);
  const [weekdays, setWeekdays] = useState<number[]>(rule?.weekdays ?? []);
  const [monthlyMode, setMonthlyMode] = useState<MonthlyMode | undefined>(rule?.monthlyMode);
  const [endType, setEndType] = useState<RecurrenceEnd['type']>(rule?.end.type ?? 'never');
  const [endCount, setEndCount] = useState(rule?.end.type === 'count' ? rule.end.count : 10);
  const [endDate, setEndDate] = useState(rule?.end.type === 'until' ? rule.end.date : eventDate);

  // Compute nth weekday info from event date
  const eventDateObj = useMemo(() => {
    const [y, m, d] = eventDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [eventDate]);
  const eventDayOfMonth = eventDateObj.getDate();
  const eventWeekday = (eventDateObj.getDay() + 6) % 7; // Mon=0
  const eventNth = Math.ceil(eventDayOfMonth / 7);
  const isLastOccurrence = useMemo(() => {
    const next = new Date(eventDateObj);
    next.setDate(next.getDate() + 7);
    return next.getMonth() !== eventDateObj.getMonth();
  }, [eventDateObj]);
  const nthLabel = eventNth === 1
    ? t('calendar.nthFirst')
    : isLastOccurrence
    ? t('calendar.nthLast')
    : t('calendar.nthOther', { n: eventNth });

  const buildRule = useCallback((): RecurrenceRule | undefined => {
    if (mode === 'none') return undefined;

    const actualFreq = mode === 'custom' ? freq : mode as RecurrenceFrequency;
    const actualInterval = mode === 'custom' ? interval : 1;
    const end: RecurrenceEnd =
      endType === 'count' ? { type: 'count', count: endCount }
      : endType === 'until' ? { type: 'until', date: endDate }
      : { type: 'never' };

    const r: RecurrenceRule = { frequency: actualFreq, interval: actualInterval, end };

    if (mode === 'custom' && actualFreq === 'weekly' && weekdays.length > 0) {
      r.weekdays = weekdays;
    }
    if (actualFreq === 'monthly' && monthlyMode) {
      r.monthlyMode = monthlyMode;
    }
    return r;
  }, [mode, freq, interval, weekdays, monthlyMode, endType, endCount, endDate]);

  // Emit changes
  useEffect(() => {
    onChange(buildRule());
  }, [mode, freq, interval, weekdays, monthlyMode, endType, endCount, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeChange = (v: string) => {
    const val = v as typeof mode;
    setMode(val);
    if (val !== 'none' && val !== 'custom') {
      setFreq(val);
      setInterval(1);
    }
  };

  const toggleWeekday = (wd: number) => {
    setWeekdays(prev => prev.includes(wd) ? prev.filter(w => w !== wd) : [...prev, wd].sort());
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[12px] font-medium text-text-muted mb-1.5">{t('calendar.recurrenceLabel')}</label>
        <select
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
          className="w-full px-3 py-2 text-[13px] rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30 dark:[color-scheme:dark]"
        >
          {FREQ_OPTIONS.map(o => (
            <option key={o.value} value={o.value} className="dark:bg-[#1c1c1e] dark:text-white">{o.label}</option>
          ))}
        </select>
      </div>

      {mode === 'custom' && (
        <div className="space-y-3 pl-1 border-l-2 border-accent/20 ml-1">
          {/* Frequency + interval */}
          <div className="flex items-center gap-2 pl-3">
            <span className="text-[12px] text-text-muted shrink-0">{t('calendar.every')}</span>
            <input
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1.5 text-[13px] rounded-lg bg-black/[0.03] dark:bg-white/[0.06] border border-border text-text text-center focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <select
              value={freq}
              onChange={(e) => setFreq(e.target.value as RecurrenceFrequency)}
              className="px-2 py-1.5 text-[13px] rounded-lg bg-black/[0.03] dark:bg-white/[0.06] border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30 dark:[color-scheme:dark]"
            >
              {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrenceFrequency[]).map(f => (
                <option key={f} value={f} className="dark:bg-[#1c1c1e] dark:text-white">{FREQ_UNIT_LABELS[f]}</option>
              ))}
            </select>
          </div>

          {/* Weekly: weekday toggles */}
          {freq === 'weekly' && (
            <div className="pl-3">
              <div className="text-[11px] text-text-muted mb-1.5">{t('calendar.weekdays')}</div>
              <div className="flex gap-1">
                {weekdayLabels.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleWeekday(i)}
                    className={`w-8 h-8 rounded-full text-[11px] font-semibold apple-transition cursor-pointer ${
                      weekdays.includes(i)
                        ? 'bg-accent text-white'
                        : 'bg-black/[0.04] dark:bg-white/[0.06] text-text-muted hover:bg-black/[0.07] dark:hover:bg-white/[0.1]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: dayOfMonth vs nthWeekday */}
          {freq === 'monthly' && (
            <div className="pl-3 space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="monthlyMode"
                  checked={!monthlyMode || monthlyMode.type === 'dayOfMonth'}
                  onChange={() => setMonthlyMode({ type: 'dayOfMonth', day: eventDayOfMonth })}
                  className="accent-accent"
                />
                <span className="text-[12px] text-text">{t('calendar.dayOfMonth', { day: eventDayOfMonth })}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="monthlyMode"
                  checked={monthlyMode?.type === 'nthWeekday'}
                  onChange={() => setMonthlyMode({ type: 'nthWeekday', nth: isLastOccurrence ? 5 : eventNth, weekday: eventWeekday })}
                  className="accent-accent"
                />
                <span className="text-[12px] text-text">{t('calendar.nthWeekday', { nth: nthLabel, weekday: weekdayNames[eventWeekday] })}</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* End condition (shown for any recurrence mode except none) */}
      {mode !== 'none' && (
        <div className="space-y-2">
          <label className="block text-[12px] font-medium text-text-muted">{t('calendar.endCondition')}</label>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="endType" checked={endType === 'never'} onChange={() => setEndType('never')} className="accent-accent" />
              <span className="text-[12px] text-text">{t('calendar.endNever')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="endType" checked={endType === 'count'} onChange={() => setEndType('count')} className="accent-accent" />
              <span className="text-[12px] text-text">{t('calendar.endAfter')}</span>
              {endType === 'count' && (
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={endCount}
                  onChange={(e) => setEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 text-[12px] rounded-lg bg-black/[0.03] dark:bg-white/[0.06] border border-border text-text text-center focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              )}
              {endType === 'count' && <span className="text-[12px] text-text">{t('calendar.endOccurrences')}</span>}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="endType" checked={endType === 'until'} onChange={() => setEndType('until')} className="accent-accent" />
              <span className="text-[12px] text-text">{t('calendar.endUntil')}</span>
              {endType === 'until' && (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 text-[12px] rounded-lg bg-black/[0.03] dark:bg-white/[0.06] border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              )}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CurrentTimeLine ────────────────────────────────────────────
function CurrentTimeLine({ style }: { style?: React.CSSProperties }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const top = ((getHours(now) * 60 + getMinutes(now)) / 60) * HOUR_HEIGHT;

  return (
    <div className="absolute right-0 pointer-events-none z-20" style={{ top, left: 0, ...style }}>
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-danger -ml-1 shrink-0" />
        <div className="flex-1 h-[2px] bg-danger" />
      </div>
    </div>
  );
}

// ─── EventModal ─────────────────────────────────────────────────
interface EventModalProps {
  event: CalendarEvent | null;
  defaultDate?: string;
  defaultStartTime?: string;
  isOccurrence?: boolean;
  occurrenceDate?: string;
  onSave: (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate?: (eventId: string, fields: Partial<Pick<CalendarEvent, 'title' | 'description' | 'date' | 'startTime' | 'endTime' | 'color' | 'recurrence' | 'exceptions'>>) => void;
  onDelete?: (eventId: string) => void;
  onUpdateOccurrence?: (eventId: string, occurrenceDate: string, fields: Partial<Pick<RecurrenceException, 'title' | 'description' | 'date' | 'startTime' | 'endTime' | 'color'>>) => void;
  onDeleteOccurrence?: (eventId: string, occurrenceDate: string) => void;
  onClose: () => void;
}

function EventModal({ event, defaultDate, defaultStartTime, isOccurrence, occurrenceDate, onSave, onUpdate, onDelete, onUpdateOccurrence, onDeleteOccurrence, onClose }: EventModalProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [date, setDate] = useState(event?.date ?? defaultDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(event?.startTime ?? defaultStartTime ?? '09:00');
  const [endTime, setEndTime] = useState(event?.endTime ?? (defaultStartTime ? `${String(Math.min(23, parseInt(defaultStartTime.split(':')[0]) + 1)).padStart(2, '0')}:00` : '10:00'));
  const [color, setColor] = useState(event?.color ?? EVENT_COLORS[0]);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | undefined>(event?.recurrence);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (isOccurrence && event && onUpdateOccurrence && occurrenceDate) {
      onUpdateOccurrence(event.id, occurrenceDate, { title: title.trim(), description, date, startTime, endTime, color });
    } else if (event && onUpdate) {
      onUpdate(event.id, { title: title.trim(), description, date, startTime, endTime, color, recurrence: recurrenceRule });
    } else {
      onSave({ title: title.trim(), description, date, startTime, endTime, color, recurrence: recurrenceRule });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!event) return;
    if (isOccurrence && onDeleteOccurrence && occurrenceDate) {
      if (confirmDelete) {
        onDeleteOccurrence(event.id, occurrenceDate);
        onClose();
      } else {
        setConfirmDelete(true);
        deleteTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
      }
    } else if (onDelete) {
      if (confirmDelete) {
        onDelete(event.id);
        onClose();
      } else {
        setConfirmDelete(true);
        deleteTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} />
      <div className="modal-content relative w-full max-w-lg bg-surface rounded-3xl flex flex-col overflow-hidden" style={{ boxShadow: 'var(--shadow-modal)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold text-text">
            {event
              ? isOccurrence ? t('calendar.editOccurrence') : t('calendar.editEvent')
              : t('calendar.newEvent')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="block text-[12px] font-medium text-text-muted mb-1.5">{t('calendar.eventTitleLabel')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('calendar.eventTitlePlaceholder')}
              className="w-full px-3 py-2 text-[13px] rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-border text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-muted mb-1.5">{t('calendar.eventDescriptionLabel')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('calendar.eventDescriptionPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 text-[13px] rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-border text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-muted mb-1.5">{t('calendar.dateLabel')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[12px] font-medium text-text-muted mb-1.5">{t('calendar.startLabel')}</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[12px] font-medium text-text-muted mb-1.5">{t('calendar.endLabel')}</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-border text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-muted mb-2">{t('calendar.colorLabel')}</label>
            <div className="flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full apple-transition cursor-pointer ${color === c ? 'ring-2 ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Recurrence picker — hidden when editing a single occurrence */}
          {!isOccurrence && (
            <RecurrencePicker
              rule={recurrenceRule}
              onChange={setRecurrenceRule}
              eventDate={date}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div>
            {event && (onDelete || (isOccurrence && onDeleteOccurrence)) && (
              <button
                onClick={handleDelete}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg apple-transition cursor-pointer ${
                  confirmDelete
                    ? 'bg-danger/20 text-danger'
                    : 'text-text-muted hover:text-danger hover:bg-danger/10'
                }`}
              >
                <Trash2 size={13} />
                {confirmDelete ? t('common.confirm') : isOccurrence ? t('calendar.deleteOccurrence') : t('common.delete')}
              </button>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-1.5 text-[13px] font-medium rounded-xl bg-accent text-white hover:bg-accent-hover apple-transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {event ? t('common.save') : t('calendar.create')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Recurring indicator ────────────────────────────────────────
function RecurringIcon({ color }: { color: string }) {
  return <Repeat size={9} style={{ color }} className="shrink-0" />;
}

// ─── YearGrid ───────────────────────────────────────────────────
interface YearGridProps {
  currentDate: Date;
  items: CalendarItem[];
  onDrillDown: (date: Date) => void;
}

function YearGrid({ currentDate, items, onDrillDown }: YearGridProps) {
  const { t, dateFnsLocale } = useI18n();
  const year = currentDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  const dayLabels = t('calendar.monthDayLabelsFull').split(',');

  const eventsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    items.forEach((item) => {
      const colors = map.get(item.date) ?? [];
      if (!colors.includes(item.color)) colors.push(item.color);
      map.set(item.date, colors);
    });
    return map;
  }, [items]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {months.map((monthDate) => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: calStart, end: calEnd });

        return (
          <button
            key={monthDate.getMonth()}
            onClick={() => onDrillDown(monthDate)}
            className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer text-left"
          >
            <div className="text-[12px] font-semibold text-text mb-2 capitalize">
              {format(monthDate, 'MMMM', { locale: dateFnsLocale })}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {dayLabels.map((d, i) => (
                <div key={i} className="text-[8px] text-text-muted text-center font-medium">{d}</div>
              ))}
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, monthDate);
                const today = isToday(day);
                const colors = eventsByDate.get(dateStr);
                return (
                  <div key={dateStr} className="flex flex-col items-center py-px">
                    <span className={`text-[9px] w-4 h-4 flex items-center justify-center rounded-full leading-none ${
                      !inMonth ? 'text-transparent' : today ? 'bg-accent text-white font-bold' : 'text-text'
                    }`}>
                      {day.getDate()}
                    </span>
                    {inMonth && colors && (
                      <div className="flex gap-px mt-px">
                        {colors.slice(0, 3).map((c, i) => (
                          <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── MonthGrid ──────────────────────────────────────────────────
interface MonthGridProps {
  currentDate: Date;
  items: CalendarItem[];
  onDrillDown: (date: Date) => void;
  onClickEvent: (item: CalendarItem) => void;
  dragState: DragState | null;
  onDragStart: (ds: DragState) => void;
}

function MonthGrid({ currentDate, items, onDrillDown, onClickEvent, dragState, onDragStart }: MonthGridProps) {
  const { t } = useI18n();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const dayLabels = t('calendar.monthDayLabelsShort').split(',');

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    items.forEach((item) => {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    });
    return map;
  }, [items]);

  return (
    <div className="flex-1 flex flex-col p-4 overflow-auto">
      <div className="grid grid-cols-7 mb-1">
        {dayLabels.map((d) => (
          <div key={d} className="text-[11px] font-medium text-text-muted text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 border-t border-l border-border">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const dayItems = itemsByDate.get(dateStr) ?? [];
          const isDropTarget = dragState?.active && dragState.view === 'month' && dragState.currentDate === dateStr;
          const maxShow = 3;
          const overflow = dayItems.length - maxShow;

          const ghostItem = isDropTarget && !dayItems.some(i => i.id === dragState.item.id)
            ? dragState.item : null;

          return (
            <div
              key={dateStr}
              data-date={dateStr}
              onClick={() => {
                if (!dragState?.active) onDrillDown(day);
              }}
              className={`border-r border-b border-border p-1.5 min-h-[90px] cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03] apple-transition ${
                !inMonth ? 'bg-black/[0.01] dark:bg-white/[0.01]' : ''
              } ${isDropTarget ? 'ring-2 ring-inset ring-accent/40 bg-accent/5' : ''}`}
            >
              <div className="flex justify-center mb-1">
                <span className={`text-[12px] w-6 h-6 flex items-center justify-center rounded-full ${
                  today ? 'bg-accent text-white font-bold' : inMonth ? 'text-text' : 'text-text-muted/40'
                }`}>
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayItems.slice(0, maxShow).map((item) => {
                  const isDragging = dragState?.active && dragState.item.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onMouseDown={(e) => {
                        if (item.isKanban || e.button !== 0) return;
                        e.preventDefault();
                        e.stopPropagation();
                        onDragStart({
                          item,
                          originX: e.clientX,
                          originY: e.clientY,
                          offsetY: 0,
                          gridRect: new DOMRect(),
                          dayDates: [],
                          colWidth: 0,
                          currentDate: item.date,
                          currentStartTime: item.startTime,
                          currentEndTime: item.endTime,
                          active: false,
                          view: 'month',
                        });
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!item.isKanban && !dragState?.active) onClickEvent(item);
                      }}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate ${
                        item.isKanban ? 'cursor-default' : 'cursor-grab hover:brightness-95'
                      } ${isDragging ? 'opacity-30' : ''}`}
                      style={{ backgroundColor: item.color + '20', color: item.color }}
                    >
                      {item.isKanban && <Columns3 size={9} />}
                      {item.isRecurring && <RecurringIcon color={item.color} />}
                      <span className="truncate">{item.title}</span>
                    </div>
                  );
                })}
                {ghostItem && (
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate pointer-events-none ring-1 ring-accent/50"
                    style={{ backgroundColor: ghostItem.color + '30', color: ghostItem.color }}
                  >
                    <span className="truncate">{ghostItem.title}</span>
                  </div>
                )}
                {overflow > 0 && (
                  <div className="text-[10px] text-text-muted px-1.5">+{overflow}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WeekGrid ───────────────────────────────────────────────────
interface WeekGridProps {
  currentDate: Date;
  items: CalendarItem[];
  onClickEvent: (item: CalendarItem) => void;
  onClickSlot: (date: string, hour: string) => void;
  dragState: DragState | null;
  onDragStart: (ds: DragState) => void;
}

function WeekGrid({ currentDate, items, onClickEvent, onClickSlot, dragState, onDragStart }: WeekGridProps) {
  const { dateFnsLocale } = useI18n();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 8 * HOUR_HEIGHT;
    }
  }, []);

  const hasToday = days.some((d) => isToday(d));

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    items.forEach((item) => {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    });
    return map;
  }, [items]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-border shrink-0 overflow-x-auto">
        <div className="w-10 sm:w-14 shrink-0 sticky left-0 bg-surface z-10" />
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div key={day.toISOString()} className="flex-1 min-w-[100px] sm:min-w-0 text-center py-2 border-l border-border">
              <div className={`text-[11px] font-medium ${today ? 'text-accent' : 'text-text-muted'}`}>
                {format(day, 'EEE', { locale: dateFnsLocale }).replace('.', '')}
              </div>
              <div className={`text-[18px] font-semibold w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                today ? 'bg-accent text-white' : 'text-text'
              }`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-auto">
        <div ref={gridRef} className="flex relative" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Time gutter */}
          <div className="w-10 sm:w-14 shrink-0 relative sticky left-0 bg-surface z-10">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-2 text-[10px] text-text-muted -translate-y-1/2"
                style={{ top: h * HOUR_HEIGHT }}
              >
                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayItems = itemsByDate.get(dateStr) ?? [];

            return (
              <div key={dateStr} className="flex-1 min-w-[100px] sm:min-w-0 relative border-l border-border">
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-border/50 cursor-pointer"
                    style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={() => onClickSlot(dateStr, `${String(h).padStart(2, '0')}:00`)}
                  />
                ))}

                {/* Events */}
                {dayItems.map((item) => {
                  const isDragging = dragState?.active && dragState.item.id === item.id;
                  const top = minutesToTop(item.startTime);
                  const height = eventHeight(item.startTime, item.endTime);
                  return (
                    <div
                      key={item.id}
                      onMouseDown={(e) => {
                        if (item.isKanban || e.button !== 0) return;
                        e.preventDefault();
                        const grid = gridRef.current;
                        const scroll = containerRef.current;
                        if (!grid || !scroll) return;
                        const rect = grid.getBoundingClientRect();
                        const gutterWidth = 56;
                        const columnsRect = new DOMRect(
                          rect.left + gutterWidth, rect.top,
                          rect.width - gutterWidth, rect.height
                        );
                        const dayDates = days.map(d => format(d, 'yyyy-MM-dd'));
                        const colWidth = columnsRect.width / dayDates.length;
                        const elTop = minutesToTop(item.startTime);
                        const offsetY = e.clientY - rect.top + scroll.scrollTop - elTop;
                        const gridRectWithScroll = Object.assign(columnsRect, { _scrollTop: scroll.scrollTop });
                        onDragStart({
                          item,
                          originX: e.clientX,
                          originY: e.clientY,
                          offsetY,
                          gridRect: gridRectWithScroll,
                          dayDates,
                          colWidth,
                          currentDate: item.date,
                          currentStartTime: item.startTime,
                          currentEndTime: item.endTime,
                          active: false,
                          view: 'week',
                        });
                      }}
                      onTouchStart={(e) => {
                        if (item.isKanban) return;
                        const touch = e.touches[0];
                        if (!touch) return;
                        const grid = gridRef.current;
                        const scroll = containerRef.current;
                        if (!grid || !scroll) return;
                        const rect = grid.getBoundingClientRect();
                        const gutterWidth = 56;
                        const columnsRect = new DOMRect(
                          rect.left + gutterWidth, rect.top,
                          rect.width - gutterWidth, rect.height
                        );
                        const dayDates = days.map(d => format(d, 'yyyy-MM-dd'));
                        const colWidth = columnsRect.width / dayDates.length;
                        const elTop = minutesToTop(item.startTime);
                        const offsetY = touch.clientY - rect.top + scroll.scrollTop - elTop;
                        const gridRectWithScroll = Object.assign(columnsRect, { _scrollTop: scroll.scrollTop });
                        onDragStart({
                          item,
                          originX: touch.clientX,
                          originY: touch.clientY,
                          offsetY,
                          gridRect: gridRectWithScroll,
                          dayDates,
                          colWidth,
                          currentDate: item.date,
                          currentStartTime: item.startTime,
                          currentEndTime: item.endTime,
                          active: false,
                          view: 'week',
                        });
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!item.isKanban && !dragState?.active) onClickEvent(item);
                      }}
                      className={`absolute left-0.5 right-1 rounded-lg px-2 py-1 overflow-hidden z-10 ${
                        item.isKanban ? 'cursor-default' : 'cursor-grab hover:brightness-95'
                      } ${isDragging ? 'opacity-30' : ''}`}
                      style={{
                        top,
                        height,
                        borderLeft: `3px solid ${item.color}`,
                        backgroundColor: item.color + '20',
                      }}
                    >
                      <div className="text-[10px] font-semibold truncate flex items-center gap-1" style={{ color: item.color }}>
                        {item.isKanban && <Columns3 size={9} className="-mt-px" />}
                        {item.isRecurring && <RecurringIcon color={item.color} />}
                        <span className="truncate">{item.title}</span>
                      </div>
                      {height > 30 && (
                        <div className="text-[9px] text-text-muted mt-0.5">
                          {item.startTime} – {item.endTime}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Ghost event during drag */}
                {dragState?.active && dragState.view === 'week' && dragState.currentDate === dateStr && (
                  <div
                    className="absolute left-0.5 right-1 rounded-lg px-2 py-1 overflow-hidden z-30 pointer-events-none ring-2 ring-accent/50"
                    style={{
                      top: minutesToTop(dragState.currentStartTime),
                      height: eventHeight(dragState.currentStartTime, dragState.currentEndTime),
                      borderLeft: `3px solid ${dragState.item.color}`,
                      backgroundColor: dragState.item.color + '30',
                    }}
                  >
                    <div className="text-[10px] font-semibold truncate" style={{ color: dragState.item.color }}>
                      {dragState.item.title}
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5">
                      {dragState.currentStartTime} – {dragState.currentEndTime}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Current time line spanning all columns */}
          {hasToday && <CurrentTimeLine style={{ left: 56 }} />}
        </div>
      </div>
    </div>
  );
}

// ─── DayGrid ────────────────────────────────────────────────────
interface DayGridProps {
  currentDate: Date;
  items: CalendarItem[];
  onClickEvent: (item: CalendarItem) => void;
  onClickSlot: (date: string, hour: string) => void;
  dragState: DragState | null;
  onDragStart: (ds: DragState) => void;
}

function DayGrid({ currentDate, items, onClickEvent, onClickSlot, dragState, onDragStart }: DayGridProps) {
  const { dateFnsLocale } = useI18n();
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const today = isToday(currentDate);

  const dayItems = useMemo(() => items.filter((item) => item.date === dateStr), [items, dateStr]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 8 * HOUR_HEIGHT;
    }
  }, [currentDate]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day header */}
      <div className="text-center py-3 border-b border-border shrink-0">
        <div className={`text-[12px] font-medium capitalize ${today ? 'text-accent' : 'text-text-muted'}`}>
          {format(currentDate, 'EEEE', { locale: dateFnsLocale })}
        </div>
        <div className={`text-[28px] font-semibold w-11 h-11 mx-auto flex items-center justify-center rounded-full ${
          today ? 'bg-accent text-white' : 'text-text'
        }`}>
          {currentDate.getDate()}
        </div>
        <div className="text-[12px] text-text-muted capitalize mt-0.5">
          {format(currentDate, 'MMMM yyyy', { locale: dateFnsLocale })}
        </div>
      </div>

      {/* Time grid */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div ref={gridRef} className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Time gutter */}
          <div className="w-12 sm:w-16 shrink-0 relative">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-3 text-[11px] text-text-muted -translate-y-1/2"
                style={{ top: h * HOUR_HEIGHT }}
              >
                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Single column */}
          <div className="flex-1 relative border-l border-border">
            {/* Hour lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-border/50 cursor-pointer"
                style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                onClick={() => onClickSlot(dateStr, `${String(h).padStart(2, '0')}:00`)}
              />
            ))}

            {/* Events */}
            {dayItems.map((item) => {
              const isDragging = dragState?.active && dragState.item.id === item.id;
              const top = minutesToTop(item.startTime);
              const height = eventHeight(item.startTime, item.endTime);
              return (
                <div
                  key={item.id}
                  onMouseDown={(e) => {
                    if (item.isKanban || e.button !== 0) return;
                    e.preventDefault();
                    const grid = gridRef.current;
                    const scroll = containerRef.current;
                    if (!grid || !scroll) return;
                    const rect = grid.getBoundingClientRect();
                    const gutterWidth = 64;
                    const columnsRect = new DOMRect(
                      rect.left + gutterWidth, rect.top,
                      rect.width - gutterWidth, rect.height
                    );
                    const elTop = minutesToTop(item.startTime);
                    const offsetY = e.clientY - rect.top + scroll.scrollTop - elTop;
                    const gridRectWithScroll = Object.assign(columnsRect, { _scrollTop: scroll.scrollTop });
                    onDragStart({
                      item,
                      originX: e.clientX,
                      originY: e.clientY,
                      offsetY,
                      gridRect: gridRectWithScroll,
                      dayDates: [dateStr],
                      colWidth: columnsRect.width,
                      currentDate: item.date,
                      currentStartTime: item.startTime,
                      currentEndTime: item.endTime,
                      active: false,
                      view: 'day',
                    });
                  }}
                  onTouchStart={(e) => {
                    if (item.isKanban) return;
                    const touch = e.touches[0];
                    if (!touch) return;
                    const grid = gridRef.current;
                    const scroll = containerRef.current;
                    if (!grid || !scroll) return;
                    const rect = grid.getBoundingClientRect();
                    const gutterWidth = 64;
                    const columnsRect = new DOMRect(
                      rect.left + gutterWidth, rect.top,
                      rect.width - gutterWidth, rect.height
                    );
                    const elTop = minutesToTop(item.startTime);
                    const offsetY = touch.clientY - rect.top + scroll.scrollTop - elTop;
                    const gridRectWithScroll = Object.assign(columnsRect, { _scrollTop: scroll.scrollTop });
                    onDragStart({
                      item,
                      originX: touch.clientX,
                      originY: touch.clientY,
                      offsetY,
                      gridRect: gridRectWithScroll,
                      dayDates: [dateStr],
                      colWidth: columnsRect.width,
                      currentDate: item.date,
                      currentStartTime: item.startTime,
                      currentEndTime: item.endTime,
                      active: false,
                      view: 'day',
                    });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.isKanban && !dragState?.active) onClickEvent(item);
                  }}
                  className={`absolute left-1 right-4 rounded-lg px-3 py-1.5 overflow-hidden z-10 ${
                    item.isKanban ? 'cursor-default' : 'cursor-grab hover:brightness-95'
                  } ${isDragging ? 'opacity-30' : ''}`}
                  style={{
                    top,
                    height,
                    borderLeft: `3px solid ${item.color}`,
                    backgroundColor: item.color + '20',
                  }}
                >
                  <div className="text-[12px] font-semibold truncate flex items-center gap-1" style={{ color: item.color }}>
                    {item.isKanban && <Columns3 size={11} className="-mt-px" />}
                    {item.isRecurring && <RecurringIcon color={item.color} />}
                    <span className="truncate">{item.title}</span>
                  </div>
                  {height > 30 && (
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {item.startTime} – {item.endTime}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ghost event during drag */}
            {dragState?.active && dragState.view === 'day' && dragState.currentDate === dateStr && (
              <div
                className="absolute left-1 right-4 rounded-lg px-3 py-1.5 overflow-hidden z-30 pointer-events-none ring-2 ring-accent/50"
                style={{
                  top: minutesToTop(dragState.currentStartTime),
                  height: eventHeight(dragState.currentStartTime, dragState.currentEndTime),
                  borderLeft: `3px solid ${dragState.item.color}`,
                  backgroundColor: dragState.item.color + '30',
                }}
              >
                <div className="text-[12px] font-semibold truncate" style={{ color: dragState.item.color }}>
                  {dragState.item.title}
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">
                  {dragState.currentStartTime} – {dragState.currentEndTime}
                </div>
              </div>
            )}

            {today && <CurrentTimeLine />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CalendarView (main) ────────────────────────────────────────
export default function CalendarView({ events, kanbanCards, onAddEvent, onUpdateEvent, onDeleteEvent, onUpdateOccurrence, onDeleteOccurrence }: CalendarViewProps) {
  const { t, dateFnsLocale } = useI18n();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingOccurrenceDate, setEditingOccurrenceDate] = useState<string | undefined>();
  const [editingIsOccurrence, setEditingIsOccurrence] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDate, setCreateDate] = useState<string | undefined>();
  const [createHour, setCreateHour] = useState<string | undefined>();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  // Recurrence action dialog state
  const [recurrenceAction, setRecurrenceAction] = useState<{
    item: CalendarItem;
    action: 'edit' | 'delete' | 'move';
    moveData?: { date: string; startTime: string; endTime: string };
  } | null>(null);

  // Keep ref in sync
  useEffect(() => { dragRef.current = dragState; }, [dragState]);

  // Document-level mouse handlers for drag
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const ds = dragRef.current;
      if (!ds) return;

      if (!ds.active) {
        const dx = e.clientX - ds.originX;
        const dy = e.clientY - ds.originY;
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        setDragState(prev => prev ? { ...prev, active: true } : null);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        return;
      }

      if (ds.view === 'month') {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el?.closest<HTMLElement>('[data-date]');
        if (cell && cell.dataset.date) {
          setDragState(prev => prev ? { ...prev, currentDate: cell.dataset.date! } : null);
        }
        return;
      }

      const relY = e.clientY - ds.gridRect.top + (ds.gridRect as any)._scrollTop;
      const rawMinutes = ((relY - ds.offsetY) / HOUR_HEIGHT) * 60;
      const duration = timeToMinutes(ds.item.endTime) - timeToMinutes(ds.item.startTime);
      const snapped = clampMinutes(snapTo15(rawMinutes));
      const endMins = clampMinutes(snapped + duration);
      const startMins = endMins - duration;

      let targetDate = ds.currentDate;
      if (ds.view === 'week' && ds.dayDates.length > 1) {
        const relX = e.clientX - ds.gridRect.left;
        const colIdx = Math.max(0, Math.min(ds.dayDates.length - 1, Math.floor(relX / ds.colWidth)));
        targetDate = ds.dayDates[colIdx];
      }

      setDragState(prev => prev ? {
        ...prev,
        currentDate: targetDate,
        currentStartTime: minutesToTime(startMins),
        currentEndTime: minutesToTime(endMins),
      } : null);
    };

    const handleMouseUp = () => {
      const ds = dragRef.current;
      if (ds?.active && !ds.item.isKanban) {
        const changed = ds.currentDate !== ds.item.date ||
          ds.currentStartTime !== ds.item.startTime ||
          ds.currentEndTime !== ds.item.endTime;
        if (changed) {
          if (ds.item.isRecurring && ds.item.masterEventId && ds.item.occurrenceDate) {
            // Show recurrence action dialog for drag
            setRecurrenceAction({
              item: ds.item,
              action: 'move',
              moveData: {
                date: ds.currentDate,
                startTime: ds.currentStartTime,
                endTime: ds.currentEndTime,
              },
            });
          } else {
            const eventId = ds.item.masterEventId ?? ds.item.id;
            onUpdateEvent(eventId, {
              date: ds.currentDate,
              startTime: ds.currentStartTime,
              endTime: ds.currentEndTime,
            });
          }
        }
      }
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      setDragState(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    };

    const handleTouchEnd = () => handleMouseUp();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [dragState !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge calendar events (expanded) + kanban cards
  const calendarItems: CalendarItem[] = useMemo(() => {
    const [rangeStart, rangeEnd] = getViewDateRange(currentDate, viewMode);
    const fromEvents = expandAllEvents(events, rangeStart, rangeEnd);

    const fromKanban: CalendarItem[] = kanbanCards
      .filter((c) => c.dueDate !== null && c.dueDate >= rangeStart && c.dueDate <= rangeEnd)
      .map((c) => ({
        id: `kanban-${c.id}`,
        title: c.title,
        description: c.description,
        date: c.dueDate!,
        startTime: '09:00',
        endTime: '09:30',
        color: '#ff9500',
        isKanban: true,
      }));

    return [...fromEvents, ...fromKanban];
  }, [events, kanbanCards, currentDate, viewMode]);

  // Navigation
  const navigate = useCallback((direction: -1 | 1) => {
    setCurrentDate((d) => {
      switch (viewMode) {
        case 'year': return direction === 1 ? addYears(d, 1) : subYears(d, 1);
        case 'month': return direction === 1 ? addMonths(d, 1) : subMonths(d, 1);
        case 'week': return direction === 1 ? addWeeks(d, 1) : subWeeks(d, 1);
        case 'day': return direction === 1 ? addDays(d, 1) : subDays(d, 1);
      }
    });
  }, [viewMode]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  // Drill-down
  const handleDrillDown = useCallback((date: Date) => {
    setCurrentDate(date);
    if (viewMode === 'year') setViewMode('month');
    else if (viewMode === 'month') setViewMode('day');
  }, [viewMode]);

  // Click event — handle recurring vs non-recurring
  const handleClickEvent = useCallback((item: CalendarItem) => {
    if (item.isKanban) return;
    if (item.isRecurring && item.masterEventId) {
      setRecurrenceAction({ item, action: 'edit' });
    } else {
      const eventId = item.masterEventId ?? item.id;
      const ev = events.find((e) => e.id === eventId);
      if (ev) {
        setEditingEvent(ev);
        setEditingIsOccurrence(false);
        setEditingOccurrenceDate(undefined);
      }
    }
  }, [events]);

  // Click empty slot
  const handleClickSlot = useCallback((date: string, hour: string) => {
    setCreateDate(date);
    setCreateHour(hour);
    setShowCreateModal(true);
  }, []);

  // Handle recurrence action dialog choices
  const handleRecurrenceThis = useCallback(() => {
    if (!recurrenceAction) return;
    const { item, action, moveData } = recurrenceAction;
    const masterId = item.masterEventId!;
    const occDate = item.occurrenceDate!;

    if (action === 'edit') {
      // Open modal for this occurrence
      const ev = events.find(e => e.id === masterId);
      if (ev) {
        // Build a pseudo-event with occurrence overrides applied
        const exception = ev.exceptions?.find(ex => ex.originalDate === occDate);
        const pseudoEvent: CalendarEvent = {
          ...ev,
          title: exception?.title ?? ev.title,
          description: exception?.description ?? ev.description,
          date: exception?.date ?? occDate,
          startTime: exception?.startTime ?? ev.startTime,
          endTime: exception?.endTime ?? ev.endTime,
          color: exception?.color ?? ev.color,
        };
        setEditingEvent(pseudoEvent);
        setEditingIsOccurrence(true);
        setEditingOccurrenceDate(occDate);
      }
    } else if (action === 'delete') {
      onDeleteOccurrence(masterId, occDate);
    } else if (action === 'move' && moveData) {
      onUpdateOccurrence(masterId, occDate, {
        date: moveData.date,
        startTime: moveData.startTime,
        endTime: moveData.endTime,
      });
    }
    setRecurrenceAction(null);
  }, [recurrenceAction, events, onDeleteOccurrence, onUpdateOccurrence]);

  const handleRecurrenceAll = useCallback(() => {
    if (!recurrenceAction) return;
    const { item, action, moveData } = recurrenceAction;
    const masterId = item.masterEventId!;

    if (action === 'edit') {
      const ev = events.find(e => e.id === masterId);
      if (ev) {
        setEditingEvent(ev);
        setEditingIsOccurrence(false);
        setEditingOccurrenceDate(undefined);
      }
    } else if (action === 'delete') {
      onDeleteEvent(masterId);
    } else if (action === 'move' && moveData) {
      onUpdateEvent(masterId, {
        date: moveData.date,
        startTime: moveData.startTime,
        endTime: moveData.endTime,
      });
    }
    setRecurrenceAction(null);
  }, [recurrenceAction, events, onDeleteEvent, onUpdateEvent]);

  // Header title
  const headerTitle = useMemo(() => {
    switch (viewMode) {
      case 'year': return format(currentDate, 'yyyy');
      case 'month': return format(currentDate, 'MMMM yyyy', { locale: dateFnsLocale });
      case 'week': {
        const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
        const we = addDays(ws, 6);
        if (ws.getMonth() === we.getMonth()) {
          return `${format(ws, 'd', { locale: dateFnsLocale })} – ${format(we, 'd MMMM yyyy', { locale: dateFnsLocale })}`;
        }
        return `${format(ws, 'd MMM', { locale: dateFnsLocale })} – ${format(we, 'd MMM yyyy', { locale: dateFnsLocale })}`;
      }
      case 'day': return format(currentDate, 'EEEE d MMMM yyyy', { locale: dateFnsLocale });
    }
  }, [viewMode, currentDate, dateFnsLocale]);

  const viewLabels: { mode: CalendarViewMode; label: string; short: string }[] = [
    { mode: 'year', label: t('calendar.viewYear'), short: t('calendar.viewYearShort') },
    { mode: 'month', label: t('calendar.viewMonth'), short: t('calendar.viewMonthShort') },
    { mode: 'week', label: t('calendar.viewWeek'), short: t('calendar.viewWeekShort') },
    { mode: 'day', label: t('calendar.viewDay'), short: t('calendar.viewDayShort') },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 border-b border-border shrink-0">
        {/* Line 1 : icon + title + nav + add button */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Calendar size={18} strokeWidth={1.5} className="text-accent shrink-0" />
          <h2 className="text-[15px] font-semibold text-text capitalize truncate min-w-0">{headerTitle}</h2>

          {/* Nav buttons */}
          <div className="flex items-center gap-1 ml-auto sm:ml-0">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1 text-[12px] font-medium rounded-lg text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
            >
              {t('calendar.today')}
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={() => {
              setCreateDate(undefined);
              setCreateHour(undefined);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-xl bg-accent text-white hover:bg-accent-hover apple-transition cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">{t('calendar.event')}</span>
          </button>
        </div>

        {/* Line 2 : view picker */}
        <div className="flex bg-black/[0.04] dark:bg-white/[0.06] rounded-xl p-0.5 sm:ml-auto">
          {viewLabels.map(({ mode, label, short }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-[12px] font-medium rounded-lg apple-transition cursor-pointer ${
                viewMode === mode
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {viewMode === 'year' && (
        <div className="flex-1 overflow-auto">
          <YearGrid currentDate={currentDate} items={calendarItems} onDrillDown={handleDrillDown} />
        </div>
      )}
      {viewMode === 'month' && (
        <MonthGrid currentDate={currentDate} items={calendarItems} onDrillDown={handleDrillDown} onClickEvent={handleClickEvent} dragState={dragState} onDragStart={setDragState} />
      )}
      {viewMode === 'week' && (
        <WeekGrid currentDate={currentDate} items={calendarItems} onClickEvent={handleClickEvent} onClickSlot={handleClickSlot} dragState={dragState} onDragStart={setDragState} />
      )}
      {viewMode === 'day' && (
        <DayGrid currentDate={currentDate} items={calendarItems} onClickEvent={handleClickEvent} onClickSlot={handleClickSlot} dragState={dragState} onDragStart={setDragState} />
      )}

      {/* Modals */}
      {showCreateModal && (
        <EventModal
          event={null}
          defaultDate={createDate}
          defaultStartTime={createHour}
          onSave={onAddEvent}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      {editingEvent && (
        <EventModal
          event={editingEvent}
          isOccurrence={editingIsOccurrence}
          occurrenceDate={editingOccurrenceDate}
          onSave={onAddEvent}
          onUpdate={onUpdateEvent}
          onDelete={onDeleteEvent}
          onUpdateOccurrence={onUpdateOccurrence}
          onDeleteOccurrence={onDeleteOccurrence}
          onClose={() => {
            setEditingEvent(null);
            setEditingIsOccurrence(false);
            setEditingOccurrenceDate(undefined);
          }}
        />
      )}

      {/* Recurrence action dialog */}
      {recurrenceAction && (
        <RecurrenceActionDialog
          actionLabel={
            recurrenceAction.action === 'edit' ? t('calendar.recurrenceEdit')
            : recurrenceAction.action === 'delete' ? t('calendar.recurrenceDelete')
            : t('calendar.recurrenceMove')
          }
          onThis={handleRecurrenceThis}
          onAll={handleRecurrenceAll}
          onCancel={() => setRecurrenceAction(null)}
        />
      )}
    </div>
  );
}
