import { FolderPlus } from 'lucide-react';

interface EmptyStateProps {
  hasProjects: boolean;
  onCreateProject: () => void;
}

export default function EmptyState({ hasProjects, onCreateProject }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-surface rounded-r-[16px] animate-fadeIn">
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
