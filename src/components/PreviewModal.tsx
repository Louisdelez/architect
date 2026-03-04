import { X, FileText, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Document } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface PreviewModalProps {
  document: Document;
  onClose: () => void;
}

function getLinkLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const name = hostname.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return url;
  }
}

export default function PreviewModal({ document, onClose }: PreviewModalProps) {
  const { t } = useI18n();
  const validLinks = document.links.filter((l) => l.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="modal-content relative w-full max-w-4xl h-[92vh] sm:h-[85vh] bg-surface rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden" style={{ boxShadow: 'var(--shadow-modal)' }}>
        {/* Header */}
        <div className="flex items-center justify-center px-5 sm:px-8 py-4 sm:py-5 border-b border-border shrink-0 relative">
          <h2 className="text-[16px] font-semibold text-text">{document.name}</h2>
          <button
            onClick={onClose}
            className="absolute right-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.10] apple-transition cursor-pointer"
          >
            <X size={14} className="text-text-secondary" />
          </button>
        </div>

        {/* Links */}
        {validLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 px-5 sm:px-8 py-3 border-b border-border shrink-0">
            {validLinks.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-full apple-transition"
              >
                {getLinkLabel(link)}
                <ExternalLink size={12} strokeWidth={2} />
              </a>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {document.content.trim().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
              <div className="w-20 h-20 rounded-[24px] bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center mb-5">
                <FileText size={28} strokeWidth={1.25} className="text-text-muted" />
              </div>
              <p className="text-[16px] text-text-muted">{t('preview.emptyDocument')}</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-5 sm:px-12 py-6 sm:py-10">
              <div className="markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {document.content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
