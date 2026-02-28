import type { Project, Document, JournalEntry } from './types';
import { DOCUMENT_TEMPLATES } from './constants';

const STORAGE_KEY = 'project-docs-data';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data: Project[] = raw ? JSON.parse(raw) : [];
    return data.map((p) => ({ ...p, journalEntries: p.journalEntries ?? [] }));
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
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
