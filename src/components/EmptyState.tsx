import { FolderPlus, Menu } from 'lucide-react';

interface EmptyStateProps {
  hasProjects: boolean;
  onCreateProject: () => void;
  onOpenSidebar?: () => void;
}

export default function EmptyState({ hasProjects, onCreateProject, onOpenSidebar }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface rounded-r-[16px] animate-fadeIn">
      {/* Hamburger for mobile/tablet when sidebar is hidden */}
      {onOpenSidebar && (
        <button
          onClick={onOpenSidebar}
          className="lg:hidden absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
      )}
      <div className="text-center max-w-sm px-8">
        <div className="w-24 h-24 mx-auto mb-8 rounded-[28px] bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center">
          <FolderPlus size={36} strokeWidth={1.25} className="text-text-muted" />
        </div>
        <h2 className="text-[20px] font-semibold text-text mb-3">
          {hasProjects ? 'Sélectionnez un projet' : 'Aucun projet'}
        </h2>
        <p className="text-[14px] text-text-muted mb-8 leading-relaxed">
          {hasProjects
            ? 'Choisissez un projet dans la barre latérale pour commencer.'
            : 'Créez votre premier projet pour commencer à organiser vos documents.'}
        </p>
        {hasProjects && onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="lg:hidden inline-flex items-center gap-2.5 px-6 py-3 text-[14px] font-medium text-accent hover:bg-accent-light rounded-full apple-transition cursor-pointer mb-4"
          >
            <Menu size={17} strokeWidth={1.5} />
            Ouvrir les projets
          </button>
        )}
        {!hasProjects && (
          <button
            onClick={onCreateProject}
            className="inline-flex items-center gap-2.5 px-7 py-3 text-[14px] font-medium text-white bg-accent hover:bg-accent-hover rounded-full apple-transition apple-press cursor-pointer shadow-md"
          >
            <FolderPlus size={17} strokeWidth={1.5} />
            Créer un projet
          </button>
        )}
      </div>
    </div>
  );
}
