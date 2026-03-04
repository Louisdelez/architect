export interface Document {
  id: string;
  name: string;
  content: string;
  links: string[];
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  links: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type CalendarViewMode = 'year' | 'month' | 'week' | 'day';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type MonthlyMode =
  | { type: 'dayOfMonth'; day: number }
  | { type: 'nthWeekday'; nth: number; weekday: number }; // nth=5 means "last"

export type RecurrenceEnd =
  | { type: 'never' }
  | { type: 'count'; count: number }
  | { type: 'until'; date: string }; // "YYYY-MM-DD"

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // every N days/weeks/months/years
  weekdays?: number[]; // 0=Mon..6=Sun, used with weekly
  monthlyMode?: MonthlyMode;
  end: RecurrenceEnd;
}

export interface RecurrenceException {
  originalDate: string; // "YYYY-MM-DD" — the occurrence date being overridden
  deleted?: boolean;
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  color?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;        // "YYYY-MM-DD"
  startTime: string;   // "HH:mm" (24h)
  endTime: string;     // "HH:mm" (24h)
  color: string;       // hex
  recurrence?: RecurrenceRule;
  exceptions?: RecurrenceException[];
  createdAt: string;
  updatedAt: string;
}

export type KanbanColumnId = 'todo' | 'in-progress' | 'done';
export type KanbanPriority = 'high' | 'medium' | 'low';

export interface KanbanTag {
  label: string;
  color: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  column: KanbanColumnId;
  order: number;
  priority: KanbanPriority;
  tags: KanbanTag[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  documents: Document[];
  journalEntries: JournalEntry[];
  prompts: Prompt[];
  kanbanCards: KanbanCard[];
  calendarEvents: CalendarEvent[];
}
