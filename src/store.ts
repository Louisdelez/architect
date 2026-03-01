import type { Project, Document, JournalEntry, Prompt, KanbanCard, KanbanColumnId } from './types';
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
    return data.map((p) => ({ ...p, journalEntries: p.journalEntries ?? [], prompts: p.prompts ?? [], kanbanCards: p.kanbanCards ?? [] }));
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
  }));

  return {
    id: generateId(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    documents,
    journalEntries: [],
    prompts: [],
    kanbanCards: [],
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
  fields: Partial<Pick<JournalEntry, 'title' | 'content'>>
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
    priority: 'moyenne',
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
