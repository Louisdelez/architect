import { X } from 'lucide-react';
import type { Document } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface DocumentListProps {
  documents: Document[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DocumentList({
  documents,
  activeDocumentId,
  onSelectDocument,
  isOpen,
  onClose,
}: DocumentListProps) {
  const { t } = useI18n();

  return (
    <>
      {/* Backdrop — mobile/tablet only */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/20"
          onClick={() => onClose?.()}
        />
      )}

      <div className={`w-[280px] h-full bg-surface-dim border-r border-border flex flex-col shrink-0 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 pt-6 pb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
            {t('documents.title')}
          </h2>
          <button
            onClick={() => onClose?.()}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
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
    </>
  );
}
