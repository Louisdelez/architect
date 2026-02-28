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

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  documents: Document[];
  journalEntries: JournalEntry[];
  prompts: Prompt[];
}
