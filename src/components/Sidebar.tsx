import { Plus, FolderOpen, Search, Download, Trash2, Sun, Moon, Monitor, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Project } from '../types';
import { useState, useEffect, useCallback, useRef } from 'react';
import UserMenu from './UserMenu';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDownloadProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function ProgressRing({ filled, total }: { filled: number; total: number }) {
  const size = 20;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? filled / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="opacity-15"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

const themeOptions = [
  { value: 'light' as const, label: 'Clair', Icon: Sun },
  { value: 'dark' as const, label: 'Sombre', Icon: Moon },
  { value: 'system' as const, label: 'Système', Icon: Monitor },
];

function ThemeMenu({
  theme,
  onSelect,
  onClose,
}: {
  theme: 'light' | 'dark' | 'system';
  onSelect: (t: 'light' | 'dark' | 'system') => void;
  onClose: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Find the trigger button to position relative to it
    const trigger = document.querySelector<HTMLElement>('[data-theme-trigger]');
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, left: rect.left });
    }
  }, []);

  return createPortal(
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="dropdown-menu fixed rounded-2xl shadow-lg z-50 py-1.5 w-[180px] border border-border"
        style={{ top: pos.top, left: pos.left }}
      >
        {themeOptions.map(({ value, label, Icon }) => (
          <button
            key={value}
            ref={value === theme ? btnRef : undefined}
            onClick={() => onSelect(value)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] apple-transition cursor-pointer ${
              theme === value
                ? 'text-accent font-medium'
                : 'text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            }`}
          >
            <Icon size={15} strokeWidth={1.5} className={theme === value ? 'text-accent' : 'text-text-muted'} />
            {label}
          </button>
        ))}
      </div>
    </>,
    document.body,
  );
}

export default function Sidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDownloadProject,
  onDeleteProject,
  isOpen,
  onClose,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });

  const applyTheme = useCallback((t: 'light' | 'dark' | 'system') => {
    const isDark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = t;
    localStorage.setItem('theme', t);
  }, []);

  const selectTheme = useCallback((t: 'light' | 'dark' | 'system') => {
    setTheme(t);
    applyTheme(t);
    setShowThemeMenu(false);
  }, [applyTheme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Backdrop — mobile/tablet only */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
        />
      )}

      <aside className={`w-[272px] h-full apple-vibrancy border-r border-border flex flex-col shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto lg:rounded-l-[16px] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
            <h1 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
              Projets
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                data-theme-trigger
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-accent hover:bg-accent-light apple-transition cursor-pointer"
                title="Changer le thème"
              >
                {theme === 'light' && <Sun size={16} strokeWidth={1.5} />}
                {theme === 'dark' && <Moon size={16} strokeWidth={1.5} />}
                {theme === 'system' && <Monitor size={16} strokeWidth={1.5} />}
              </button>
              {showThemeMenu && (
                <ThemeMenu theme={theme} onSelect={selectTheme} onClose={() => setShowThemeMenu(false)} />
              )}
            </div>
            <button
              onClick={onCreateProject}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-accent hover:bg-accent-light apple-transition cursor-pointer"
              title="Nouveau projet"
            >
              <Plus size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-black/[0.04] dark:bg-white/[0.06] rounded-xl focus:outline-none focus:bg-black/[0.06] dark:focus:bg-white/[0.08] focus:ring-2 focus:ring-accent/20 apple-transition placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto py-1 px-3">
        {filtered.length === 0 && (
          <p className="text-[13px] text-text-muted text-center py-12">
            {projects.length === 0 ? 'Aucun projet' : 'Aucun résultat'}
          </p>
        )}
        {filtered.map((project) => {
          const filledCount = project.documents.filter((d) => d.content.trim().length > 0).length;
          const totalCount = project.documents.length;
          const isActive = project.id === activeProjectId;

          return (
            <div
              key={project.id}
              className={`group mb-1 rounded-xl cursor-pointer apple-transition ${
                isActive
                  ? 'bg-accent text-white shadow-md'
                  : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-text'
              }`}
            >
              <div
                className="flex items-center gap-3 px-3 py-2.5"
                onClick={() => onSelectProject(project.id)}
              >
                <FolderOpen
                  size={18}
                  strokeWidth={1.5}
                  className={isActive ? 'text-white/90 shrink-0' : 'text-text-muted shrink-0'}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{project.name}</p>
                </div>
                <ProgressRing filled={filledCount} total={totalCount} />
                <div className="flex items-center gap-0.5 lg:opacity-0 lg:group-hover:opacity-100 apple-transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadProject(project);
                    }}
                    className={`p-1.5 rounded-lg apple-transition cursor-pointer ${
                      isActive ? 'hover:bg-white/20' : 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                    }`}
                    title="Télécharger le projet (.zip)"
                  >
                    <Download size={13} className={isActive ? 'text-white/80' : 'text-text-muted'} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirmDelete === project.id) {
                        onDeleteProject(project.id);
                        setConfirmDelete(null);
                      } else {
                        setConfirmDelete(project.id);
                        setTimeout(() => setConfirmDelete(null), 3000);
                      }
                    }}
                    className={`p-1.5 rounded-lg apple-transition cursor-pointer ${
                      confirmDelete === project.id
                        ? 'bg-danger/20 hover:bg-danger/30'
                        : isActive
                          ? 'hover:bg-white/20'
                          : 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                    }`}
                    title={confirmDelete === project.id ? 'Confirmer la suppression' : 'Supprimer'}
                  >
                    <Trash2
                      size={13}
                      className={
                        confirmDelete === project.id
                          ? 'text-danger'
                          : isActive
                            ? 'text-white/80'
                            : 'text-text-muted'
                      }
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <UserMenu />
    </aside>
    </>
  );
}
