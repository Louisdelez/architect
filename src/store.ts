import type { Project, Document, JournalEntry, Prompt, KanbanCard, KanbanColumnId, CalendarEvent, RecurrenceException } from './types';
import { DOCUMENT_TEMPLATES } from './constants';

const LEGACY_KEY = 'project-docs-data';

function storageKey(userId: string): string {
  return `project-docs-${userId}`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function loadProjects(userId: string): Project[] {
  try {
    const key = storageKey(userId);
    let raw = localStorage.getItem(key);

    // Migration: copy legacy data to user-scoped key on first load
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        localStorage.setItem(key, legacy);
        raw = legacy;
      }
    }

    const data: Project[] = raw ? JSON.parse(raw) : [];
    // Migrate old French priority values to English
    const priorityMap: Record<string, 'high' | 'medium' | 'low'> = { haute: 'high', moyenne: 'medium', basse: 'low' };
    return data.map((p) => ({
      ...p,
      journalEntries: (p.journalEntries ?? []).map((e) => ({
        ...e,
        links: e.links ?? [],
      })),
      prompts: p.prompts ?? [],
      kanbanCards: (p.kanbanCards ?? []).map((c) => ({
        ...c,
        priority: priorityMap[c.priority] ?? c.priority,
      })),
      calendarEvents: p.calendarEvents ?? [],
      documents: (p.documents ?? []).map((d) => ({
        ...d,
        links: d.links ?? [],
      })),
    }));
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[], userId: string): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(projects));
}

export function createProject(name: string): Project {
  const documents: Document[] = DOCUMENT_TEMPLATES.map((docName) => ({
    id: slugify(docName),
    name: docName,
    content: '',
    links: [],
  }));

  return {
    id: generateId(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    documents,
    journalEntries: [],
    prompts: [],
    kanbanCards: [],
    calendarEvents: [],
  };
}

export function updateDocumentContent(
  projects: Project[],
  projectId: string,
  documentId: string,
  content: string
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      documents: p.documents.map((d) =>
        d.id === documentId ? { ...d, content } : d
      ),
    };
  });
}

export function updateDocumentLinks(
  projects: Project[],
  projectId: string,
  documentId: string,
  links: string[]
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      documents: p.documents.map((d) =>
        d.id === documentId ? { ...d, links } : d
      ),
    };
  });
}

export function addJournalEntry(
  projects: Project[],
  projectId: string,
  title: string,
  content: string
): Project[] {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: generateId(),
    title: title.trim(),
    content,
    links: [],
    createdAt: now,
    updatedAt: now,
  };
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return { ...p, journalEntries: [entry, ...p.journalEntries] };
  });
}

export function updateJournalEntry(
  projects: Project[],
  projectId: string,
  entryId: string,
  fields: Partial<Pick<JournalEntry, 'title' | 'content' | 'links'>>
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      journalEntries: p.journalEntries.map((e) =>
        e.id === entryId
          ? { ...e, ...fields, updatedAt: new Date().toISOString() }
          : e
      ),
    };
  });
}

export function deleteJournalEntry(
  projects: Project[],
  projectId: string,
  entryId: string
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      journalEntries: p.journalEntries.filter((e) => e.id !== entryId),
    };
  });
}

export function addPrompt(
  projects: Project[],
  projectId: string,
  title: string,
  content: string
): Project[] {
  const now = new Date().toISOString();
  const prompt: Prompt = {
    id: generateId(),
    title: title.trim(),
    content,
    createdAt: now,
    updatedAt: now,
  };
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return { ...p, prompts: [prompt, ...p.prompts] };
  });
}

export function updatePrompt(
  projects: Project[],
  projectId: string,
  promptId: string,
  fields: Partial<Pick<Prompt, 'title' | 'content'>>
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      prompts: p.prompts.map((pr) =>
        pr.id === promptId
          ? { ...pr, ...fields, updatedAt: new Date().toISOString() }
          : pr
      ),
    };
  });
}

export function deletePrompt(
  projects: Project[],
  projectId: string,
  promptId: string
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      prompts: p.prompts.filter((pr) => pr.id !== promptId),
    };
  });
}

export function addKanbanCard(
  projects: Project[],
  projectId: string,
  title: string,
  column: KanbanColumnId
): Project[] {
  const now = new Date().toISOString();
  const card: KanbanCard = {
    id: generateId(),
    title: title.trim(),
    description: '',
    column,
    order: Date.now(),
    priority: 'medium',
    tags: [],
    dueDate: null,
    createdAt: now,
    updatedAt: now,
  };
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return { ...p, kanbanCards: [...p.kanbanCards, card] };
  });
}

export function updateKanbanCard(
  projects: Project[],
  projectId: string,
  cardId: string,
  fields: Partial<Pick<KanbanCard, 'title' | 'description' | 'priority' | 'tags' | 'dueDate'>>
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      kanbanCards: p.kanbanCards.map((c) =>
        c.id === cardId
          ? { ...c, ...fields, updatedAt: new Date().toISOString() }
          : c
      ),
    };
  });
}

export function moveKanbanCard(
  projects: Project[],
  projectId: string,
  cardId: string,
  toColumn: KanbanColumnId,
  newOrder: number
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      kanbanCards: p.kanbanCards.map((c) =>
        c.id === cardId
          ? { ...c, column: toColumn, order: newOrder, updatedAt: new Date().toISOString() }
          : c
      ),
    };
  });
}

export function deleteKanbanCard(
  projects: Project[],
  projectId: string,
  cardId: string
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      kanbanCards: p.kanbanCards.filter((c) => c.id !== cardId),
    };
  });
}

export function addCalendarEvent(
  projects: Project[],
  projectId: string,
  event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
): Project[] {
  const now = new Date().toISOString();
  const calendarEvent: CalendarEvent = {
    ...event,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return { ...p, calendarEvents: [...p.calendarEvents, calendarEvent] };
  });
}

export function updateCalendarEvent(
  projects: Project[],
  projectId: string,
  eventId: string,
  fields: Partial<Pick<CalendarEvent, 'title' | 'description' | 'date' | 'startTime' | 'endTime' | 'color' | 'recurrence' | 'exceptions'>>
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      calendarEvents: p.calendarEvents.map((e) =>
        e.id === eventId
          ? { ...e, ...fields, updatedAt: new Date().toISOString() }
          : e
      ),
    };
  });
}

export function deleteCalendarEvent(
  projects: Project[],
  projectId: string,
  eventId: string
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      calendarEvents: p.calendarEvents.filter((e) => e.id !== eventId),
    };
  });
}

export function addCalendarEventException(
  projects: Project[],
  projectId: string,
  eventId: string,
  exception: RecurrenceException
): Project[] {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      calendarEvents: p.calendarEvents.map((e) => {
        if (e.id !== eventId) return e;
        const existing = e.exceptions ?? [];
        // Replace existing exception for this date, or add new one
        const filtered = existing.filter(ex => ex.originalDate !== exception.originalDate);
        return {
          ...e,
          exceptions: [...filtered, exception],
          updatedAt: new Date().toISOString(),
        };
      }),
    };
  });
}

export function deleteCalendarEventOccurrence(
  projects: Project[],
  projectId: string,
  eventId: string,
  occurrenceDate: string
): Project[] {
  return addCalendarEventException(projects, projectId, eventId, {
    originalDate: occurrenceDate,
    deleted: true,
  });
}
