import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DocumentList from './components/DocumentList';
import Editor from './components/Editor';
import PreviewModal from './components/PreviewModal';
import CreateProjectModal from './components/CreateProjectModal';
import EmptyState from './components/EmptyState';
import JournalView from './components/JournalView';
import PromptsView from './components/PromptsView';
import KanbanView from './components/KanbanView';
import CalendarView from './components/CalendarView';
import AuthScreen from './components/AuthScreen';
import { loadProjects, saveProjects, createProject, updateDocumentContent, addJournalEntry, updateJournalEntry, deleteJournalEntry, addPrompt, updatePrompt, deletePrompt, addKanbanCard, updateKanbanCard, moveKanbanCard, deleteKanbanCard, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent, addCalendarEventException, deleteCalendarEventOccurrence } from './store';
import { downloadProjectZip } from './utils/export';
import { useAuth } from './contexts/AuthContext';
import { FileText, BookOpen, Sparkles, Columns3, Calendar, Loader2, Menu, ChevronLeft, List } from 'lucide-react';
import type { Project, JournalEntry, Prompt, KanbanColumnId, KanbanCard, CalendarEvent, RecurrenceException } from './types';

function App() {
  const { user, loading } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'journal' | 'prompts' | 'kanban' | 'calendar'>('documents');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [docListOpen, setDocListOpen] = useState(false);

  // Load projects when user changes
  useEffect(() => {
    if (user) {
      setProjects(loadProjects(user.uid));
    } else {
      setProjects([]);
      setActiveProjectId(null);
      setActiveDocumentId(null);
    }
  }, [user]);

  // Persist to localStorage on change
  useEffect(() => {
    if (user) {
      saveProjects(projects, user.uid);
    }
  }, [projects, user]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const activeDocument = activeProject?.documents.find((d) => d.id === activeDocumentId) ?? null;

  const handleCreateProject = useCallback((name: string) => {
    const project = createProject(name);
    setProjects((prev) => [...prev, project]);
    setActiveProjectId(project.id);
    setActiveDocumentId(project.documents[0]?.id ?? null);
    setShowCreateModal(false);
  }, []);

  const handleDeleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
        setActiveDocumentId(null);
      }
    },
    [activeProjectId]
  );

  const handleSelectProject = useCallback(
    (id: string) => {
      setActiveProjectId(id);
      setActiveTab('documents');
      setSidebarOpen(false);
      const project = projects.find((p) => p.id === id);
      if (project) {
        setActiveDocumentId(project.documents[0]?.id ?? null);
      }
    },
    [projects]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (!activeProjectId || !activeDocumentId) return;
      setProjects((prev) =>
        updateDocumentContent(prev, activeProjectId, activeDocumentId, content)
      );
    },
    [activeProjectId, activeDocumentId]
  );

  const handleDownloadProject = useCallback(async (project: Project) => {
    await downloadProjectZip(project);
  }, []);

  const handleAddJournalEntry = useCallback(
    (title: string, content: string) => {
      if (!activeProjectId) return;
      setProjects((prev) => addJournalEntry(prev, activeProjectId, title, content));
    },
    [activeProjectId]
  );

  const handleUpdateJournalEntry = useCallback(
    (entryId: string, fields: Partial<Pick<JournalEntry, 'title' | 'content'>>) => {
      if (!activeProjectId) return;
      setProjects((prev) => updateJournalEntry(prev, activeProjectId, entryId, fields));
    },
    [activeProjectId]
  );

  const handleDeleteJournalEntry = useCallback(
    (entryId: string) => {
      if (!activeProjectId) return;
      setProjects((prev) => deleteJournalEntry(prev, activeProjectId, entryId));
    },
    [activeProjectId]
  );

  const handleAddPrompt = useCallback(
    (title: string, content: string) => {
      if (!activeProjectId) return;
      setProjects((prev) => addPrompt(prev, activeProjectId, title, content));
    },
    [activeProjectId]
  );

  const handleUpdatePrompt = useCallback(
    (promptId: string, fields: Partial<Pick<Prompt, 'title' | 'content'>>) => {
      if (!activeProjectId) return;
      setProjects((prev) => updatePrompt(prev, activeProjectId, promptId, fields));
    },
    [activeProjectId]
  );

  const handleDeletePrompt = useCallback(
    (promptId: string) => {
      if (!activeProjectId) return;
      setProjects((prev) => deletePrompt(prev, activeProjectId, promptId));
    },
    [activeProjectId]
  );

  const handleAddKanbanCard = useCallback(
    (title: string, column: KanbanColumnId) => {
      if (!activeProjectId) return;
      setProjects((prev) => addKanbanCard(prev, activeProjectId, title, column));
    },
    [activeProjectId]
  );

  const handleUpdateKanbanCard = useCallback(
    (cardId: string, fields: Partial<Pick<KanbanCard, 'title' | 'description' | 'priority' | 'tags' | 'dueDate'>>) => {
      if (!activeProjectId) return;
      setProjects((prev) => updateKanbanCard(prev, activeProjectId, cardId, fields));
    },
    [activeProjectId]
  );

  const handleMoveKanbanCard = useCallback(
    (cardId: string, toColumn: KanbanColumnId, newOrder: number) => {
      if (!activeProjectId) return;
      setProjects((prev) => moveKanbanCard(prev, activeProjectId, cardId, toColumn, newOrder));
    },
    [activeProjectId]
  );

  const handleDeleteKanbanCard = useCallback(
    (cardId: string) => {
      if (!activeProjectId) return;
      setProjects((prev) => deleteKanbanCard(prev, activeProjectId, cardId));
    },
    [activeProjectId]
  );

  const handleAddCalendarEvent = useCallback(
    (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!activeProjectId) return;
      setProjects((prev) => addCalendarEvent(prev, activeProjectId, event));
    },
    [activeProjectId]
  );

  const handleUpdateCalendarEvent = useCallback(
    (eventId: string, fields: Partial<Pick<CalendarEvent, 'title' | 'description' | 'date' | 'startTime' | 'endTime' | 'color' | 'recurrence' | 'exceptions'>>) => {
      if (!activeProjectId) return;
      setProjects((prev) => updateCalendarEvent(prev, activeProjectId, eventId, fields));
    },
    [activeProjectId]
  );

  const handleDeleteCalendarEvent = useCallback(
    (eventId: string) => {
      if (!activeProjectId) return;
      setProjects((prev) => deleteCalendarEvent(prev, activeProjectId, eventId));
    },
    [activeProjectId]
  );

  const handleUpdateCalendarOccurrence = useCallback(
    (eventId: string, occurrenceDate: string, fields: Partial<Pick<RecurrenceException, 'title' | 'description' | 'date' | 'startTime' | 'endTime' | 'color'>>) => {
      if (!activeProjectId) return;
      const exception: RecurrenceException = {
        originalDate: occurrenceDate,
        ...fields,
      };
      setProjects((prev) => addCalendarEventException(prev, activeProjectId, eventId, exception));
    },
    [activeProjectId]
  );

  const handleDeleteCalendarOccurrence = useCallback(
    (eventId: string, occurrenceDate: string) => {
      if (!activeProjectId) return;
      setProjects((prev) => deleteCalendarEventOccurrence(prev, activeProjectId, eventId, occurrenceDate));
    },
    [activeProjectId]
  );

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="h-full w-full flex p-0 lg:p-4">
      <div className="app-window flex flex-1 min-h-0 rounded-none lg:rounded-[16px]">
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={() => setShowCreateModal(true)}
          onDownloadProject={handleDownloadProject}
          onDeleteProject={handleDeleteProject}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {activeProject ? (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-2 sm:px-4 pt-3 pb-0 bg-surface border-b border-border overflow-x-auto">
              {/* Hamburger — mobile/tablet only */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer mr-1"
              >
                <Menu size={18} strokeWidth={1.5} />
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-2 px-2 sm:px-3 lg:px-4 py-2 text-[13px] font-medium rounded-t-xl apple-transition cursor-pointer shrink-0 ${
                  activeTab === 'documents'
                    ? 'text-accent bg-black/[0.04] dark:bg-white/[0.06]'
                    : 'text-text-muted hover:text-text hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                }`}
              >
                <FileText size={15} strokeWidth={1.5} />
                <span className="hidden sm:inline">Documents</span>
              </button>
              <button
                onClick={() => setActiveTab('journal')}
                className={`flex items-center gap-2 px-2 sm:px-3 lg:px-4 py-2 text-[13px] font-medium rounded-t-xl apple-transition cursor-pointer shrink-0 ${
                  activeTab === 'journal'
                    ? 'text-accent bg-black/[0.04] dark:bg-white/[0.06]'
                    : 'text-text-muted hover:text-text hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                }`}
              >
                <BookOpen size={15} strokeWidth={1.5} />
                <span className="hidden sm:inline">Journal</span>
                {activeProject.journalEntries.length > 0 && (
                  <span className="hidden sm:inline ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-black/[0.06] dark:bg-white/[0.1] text-text-muted">
                    {activeProject.journalEntries.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('prompts')}
                className={`flex items-center gap-2 px-2 sm:px-3 lg:px-4 py-2 text-[13px] font-medium rounded-t-xl apple-transition cursor-pointer shrink-0 ${
                  activeTab === 'prompts'
                    ? 'text-accent bg-black/[0.04] dark:bg-white/[0.06]'
                    : 'text-text-muted hover:text-text hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                }`}
              >
                <Sparkles size={15} strokeWidth={1.5} />
                <span className="hidden sm:inline">Prompts</span>
                {activeProject.prompts.length > 0 && (
                  <span className="hidden sm:inline ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-black/[0.06] dark:bg-white/[0.1] text-text-muted">
                    {activeProject.prompts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`flex items-center gap-2 px-2 sm:px-3 lg:px-4 py-2 text-[13px] font-medium rounded-t-xl apple-transition cursor-pointer shrink-0 ${
                  activeTab === 'kanban'
                    ? 'text-accent bg-black/[0.04] dark:bg-white/[0.06]'
                    : 'text-text-muted hover:text-text hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                }`}
              >
                <Columns3 size={15} strokeWidth={1.5} />
                <span className="hidden sm:inline">Kanban</span>
                {activeProject.kanbanCards.length > 0 && (
                  <span className="hidden sm:inline ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-black/[0.06] dark:bg-white/[0.1] text-text-muted">
                    {activeProject.kanbanCards.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-2 px-2 sm:px-3 lg:px-4 py-2 text-[13px] font-medium rounded-t-xl apple-transition cursor-pointer shrink-0 ${
                  activeTab === 'calendar'
                    ? 'text-accent bg-black/[0.04] dark:bg-white/[0.06]'
                    : 'text-text-muted hover:text-text hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                }`}
              >
                <Calendar size={15} strokeWidth={1.5} />
                <span className="hidden sm:inline">Calendrier</span>
                {(activeProject.calendarEvents.length + activeProject.kanbanCards.filter(c => c.dueDate).length) > 0 && (
                  <span className="hidden sm:inline ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-black/[0.06] dark:bg-white/[0.1] text-text-muted">
                    {activeProject.calendarEvents.length + activeProject.kanbanCards.filter(c => c.dueDate).length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'documents' ? (
              <div className="flex-1 flex min-h-0">
                <DocumentList
                  documents={activeProject.documents}
                  activeDocumentId={activeDocumentId}
                  onSelectDocument={(id) => {
                    setActiveDocumentId(id);
                    setDocListOpen(false);
                  }}
                  isOpen={docListOpen}
                  onClose={() => setDocListOpen(false)}
                />

                {activeDocument ? (
                  <div className="flex-1 flex flex-col min-h-0 min-w-0">
                    {/* Back button — mobile only */}
                    <button
                      onClick={() => setActiveDocumentId(null)}
                      className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-[13px] text-accent font-medium shrink-0"
                    >
                      <ChevronLeft size={16} strokeWidth={2} />
                      Documents
                    </button>
                    <Editor
                      document={activeDocument}
                      onContentChange={handleContentChange}
                      onPreview={() => setShowPreview(true)}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-surface animate-fadeIn">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center">
                        <FileText size={22} strokeWidth={1.5} className="text-text-muted" />
                      </div>
                      <p className="text-[14px] text-text-muted mb-3">Sélectionnez un document</p>
                      <button
                        onClick={() => setDocListOpen(true)}
                        className="lg:hidden flex items-center gap-2 mx-auto px-4 py-2 text-[13px] font-medium text-accent hover:bg-accent-light rounded-xl apple-transition cursor-pointer"
                      >
                        <List size={15} strokeWidth={1.5} />
                        Ouvrir la liste
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'journal' ? (
              <JournalView
                entries={activeProject.journalEntries}
                onAddEntry={handleAddJournalEntry}
                onUpdateEntry={handleUpdateJournalEntry}
                onDeleteEntry={handleDeleteJournalEntry}
              />
            ) : activeTab === 'prompts' ? (
              <PromptsView
                prompts={activeProject.prompts}
                onAddPrompt={handleAddPrompt}
                onUpdatePrompt={handleUpdatePrompt}
                onDeletePrompt={handleDeletePrompt}
              />
            ) : activeTab === 'kanban' ? (
              <KanbanView
                cards={activeProject.kanbanCards}
                onAddCard={handleAddKanbanCard}
                onUpdateCard={handleUpdateKanbanCard}
                onMoveCard={handleMoveKanbanCard}
                onDeleteCard={handleDeleteKanbanCard}
              />
            ) : (
              <CalendarView
                events={activeProject.calendarEvents}
                kanbanCards={activeProject.kanbanCards}
                onAddEvent={handleAddCalendarEvent}
                onUpdateEvent={handleUpdateCalendarEvent}
                onDeleteEvent={handleDeleteCalendarEvent}
                onUpdateOccurrence={handleUpdateCalendarOccurrence}
                onDeleteOccurrence={handleDeleteCalendarOccurrence}
              />
            )}
          </div>
        ) : (
          <EmptyState
            hasProjects={projects.length > 0}
            onCreateProject={() => setShowCreateModal(true)}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      )}

      {showPreview && activeDocument && (
        <PreviewModal
          document={activeDocument}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

export default App;
