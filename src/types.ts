export interface Document {
  id: string;
  name: string;
  content: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
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

export type KanbanColumnId = 'todo' | 'in-progress' | 'done';
export type KanbanPriority = 'haute' | 'moyenne' | 'basse';

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
}
