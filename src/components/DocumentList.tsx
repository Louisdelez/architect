import type { Document } from '../types';

interface DocumentListProps {
  documents: Document[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
}

export default function DocumentList({
  documents,
  activeDocumentId,
  onSelectDocument,
}: DocumentListProps) {
  return (
    <div className="w-[280px] h-full bg-surface-dim border-r border-border flex flex-col shrink-0">
      <div className="px-5 pt-6 pb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
          Documents
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {documents.map((doc, index) => {
          const isFilled = doc.content.trim().length > 0;
          const isActive = doc.id === activeDocumentId;

          return (
            <button
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left rounded-xl mb-0.5 apple-transition cursor-pointer ${
                isActive
                  ? 'bg-accent-light'
                  : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-[11px] text-text-muted/40 w-5 text-right font-mono shrink-0 tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                className={`text-[13px] flex-1 min-w-0 truncate ${
                  isActive ? 'font-medium text-accent' : 'text-text'
                }`}
              >
                {doc.name}
              </span>
              <span
                className={`w-[7px] h-[7px] rounded-full shrink-0 ${
                  isFilled ? 'bg-success' : 'bg-black/[0.08] dark:bg-white/[0.10]'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
