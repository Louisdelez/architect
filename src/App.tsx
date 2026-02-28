import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DocumentList from './components/DocumentList';
import Editor from './components/Editor';
import PreviewModal from './components/PreviewModal';
import CreateProjectModal from './components/CreateProjectModal';
import EmptyState from './components/EmptyState';
import JournalView from './components/JournalView';
import { loadProjects, saveProjects, createProject, updateDocumentContent, addJournalEntry, updateJournalEntry, deleteJournalEntry } from './store';
import { downloadProjectZip } from './utils/export';
import { FileText, BookOpen } from 'lucide-react';
import type { Project, JournalEntry } from './types';

function App() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'journal'>('documents');

  // Persist to localStorage on change
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

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

  return (
    <div className="h-full w-full flex p-4">
      <div className="app-window flex flex-1 min-h-0">
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={() => setShowCreateModal(true)}
          onDownloadProject={handleDownloadProject}
          onDeleteProject={handleDeleteProject}
        />

        {activeProject ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-0 bg-surface border-b border-border">
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-t-xl apple-transition cursor-pointer ${
                  activeTab === 'documents'
                    ? 'text-accent bg-black/[0.04] dark:bg-white/[0.06]'
                    : 'text-text-muted hover:text-text hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                }`}
              >
                <FileText size={15} strokeWidth={1.5} />
                Documents
              </button>
              <button
                onClick={() => setActiveTab('journal')}
                className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-t-xl apple-transition cursor-pointer ${
                  activeTab === 'journal'
                    ? 'text-accent bg-black/[0.04] dark:bg-white/[0.06]'
                    : 'text-text-muted hover:text-text hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                }`}
              >
                <BookOpen size={15} strokeWidth={1.5} />
                Journal de bord
                {activeProject.journalEntries.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-black/[0.06] dark:bg-white/[0.1] text-text-muted">
                    {activeProject.journalEntries.length}
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
                  onSelectDocument={setActiveDocumentId}
                />

                {activeDocument ? (
                  <Editor
                    document={activeDocument}
                    onContentChange={handleContentChange}
                    onPreview={() => setShowPreview(true)}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-surface animate-fadeIn">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center">
                        <FileText size={22} strokeWidth={1.5} className="text-text-muted" />
                      </div>
                      <p className="text-[14px] text-text-muted">Sélectionnez un document</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <JournalView
                entries={activeProject.journalEntries}
                onAddEntry={handleAddJournalEntry}
                onUpdateEntry={handleUpdateJournalEntry}
                onDeleteEntry={handleDeleteJournalEntry}
              />
            )}
          </div>
        ) : (
          <EmptyState
            hasProjects={projects.length > 0}
            onCreateProject={() => setShowCreateModal(true)}
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
