import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Download, FileDown, Trash2, BookOpen, ChevronDown, ChevronRight, Eye, Copy, Check, X, Link, ExternalLink, Printer } from 'lucide-react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { downloadJournalEntry, downloadAllJournalEntries, copyToClipboard, printMarkdownPreview, downloadPdf } from '../utils/export';
import { formatTimestamp } from '../utils/format';
import { useIsDark } from '../hooks/useIsDark';
import { useI18n } from '../i18n/I18nContext';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import type { JournalEntry } from '../types';

interface JournalViewProps {
  entries: JournalEntry[];
  onAddEntry: (title: string, content: string) => void;
  onUpdateEntry: (entryId: string, fields: Partial<Pick<JournalEntry, 'title' | 'content' | 'links'>>) => void;
  onDeleteEntry: (entryId: string) => void;
}

/* ── Inline CodeMirror for journal entry content ── */
function JournalEditor({
  entryId,
  content,
  isDark,
  onSave,
}: {
  entryId: string;
  content: string;
  isDark: boolean;
  onSave: (value: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const latestContent = useRef(content);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        markdown(),
        ...(isDark ? [oneDark] : []),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const value = update.state.doc.toString();
            onSave(value);
            latestContent.current = value;
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
            backgroundColor: 'var(--color-editor-bg)',
            color: 'var(--color-editor-text)',
            borderRadius: '12px',
            overflow: 'hidden',
          },
          '.cm-content': {
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
            padding: '16px 8px',
            caretColor: isDark ? '#fff' : '#1d1d1f',
          },
          '.cm-line': { padding: '0 8px' },
          '.cm-cursor': { borderLeftColor: isDark ? '#fff' : '#1d1d1f' },
          '.cm-scroller': { minHeight: '140px', maxHeight: '400px', overflow: 'auto' },
        }, { dark: isDark }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [entryId, isDark]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden bg-editor-bg"
    />
  );
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

/* ── Preview modal for a single journal entry ── */
function JournalPreviewModal({ entry, onClose }: { entry: JournalEntry; onClose: () => void }) {
  const { t, locale } = useI18n();
  const validLinks = entry.links.filter((l) => l.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} />
      <div className="modal-content relative w-full max-w-4xl h-[92vh] sm:h-[85vh] bg-surface rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden" style={{ boxShadow: 'var(--shadow-modal)' }}>
        {/* Header */}
        <div className="flex items-center justify-center px-5 sm:px-8 py-4 sm:py-5 border-b border-border shrink-0 relative">
          <div className="text-center">
            <h2 className="text-[16px] font-semibold text-text">{entry.title}</h2>
            <p className="text-[11px] font-mono text-text-muted mt-1">{formatTimestamp(entry.createdAt, locale)}</p>
          </div>
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
          {entry.content.trim().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
              <div className="w-20 h-20 rounded-[24px] bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center mb-5">
                <BookOpen size={28} strokeWidth={1.25} className="text-text-muted" />
              </div>
              <p className="text-[16px] text-text-muted">{t('journal.emptyEntry')}</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-5 sm:px-12 py-6 sm:py-10">
              <div className="markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {entry.content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main JournalView ── */
export default function JournalView({ entries, onAddEntry, onUpdateEntry, onDeleteEntry }: JournalViewProps) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<JournalEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadMenuId, setDownloadMenuId] = useState<string | null>(null);
  const newTitleRef = useRef<HTMLInputElement>(null);
  const isDark = useIsDark();
  const { t, tp, locale } = useI18n();

  useEffect(() => {
    if (isCreating) newTitleRef.current?.focus();
  }, [isCreating]);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    onAddEntry(newTitle, newContent);
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleTitleBlur = (entry: JournalEntry, value: string) => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== entry.title) {
      onUpdateEntry(entry.id, { title: trimmed });
    }
  };

  const handleContentSave = useCallback(
    (entryId: string, value: string) => {
      onUpdateEntry(entryId, { content: value });
    },
    [onUpdateEntry]
  );

  const handleDelete = (id: string) => {
    setDeleteEntryId(id);
  };

  const confirmDelete = () => {
    if (deleteEntryId) {
      onDeleteEntry(deleteEntryId);
      if (expandedEntryId === deleteEntryId) setExpandedEntryId(null);
      setDeleteEntryId(null);
    }
  };

  const handleCopyEntry = async (entry: JournalEntry) => {
    await copyToClipboard(entry.content);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center">
            <BookOpen size={18} strokeWidth={1.5} className="text-text-muted" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-text">{t('journal.title')}</h2>
            <p className="text-[12px] text-text-muted">
              {tp('journal.entryCount', entries.length, { count: entries.length })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <button
              onClick={() => downloadAllJournalEntries(entries)}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-text-muted hover:text-accent hover:bg-accent-light rounded-xl apple-transition cursor-pointer"
              title={t('journal.downloadAll')}
            >
              <FileDown size={15} strokeWidth={1.5} />
              <span className="hidden sm:inline">{t('journal.downloadAll')}</span>
            </button>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover rounded-full apple-transition apple-press cursor-pointer"
          >
            <Plus size={15} strokeWidth={2} />
            <span className="hidden sm:inline">{t('journal.newEntry')}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        {/* Create form */}
        {isCreating && (
          <div className="mb-5 p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] animate-fadeIn">
            <input
              ref={newTitleRef}
              type="text"
              placeholder={t('journal.titlePlaceholder')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newTitle.trim()) handleCreate(); }}
              className="w-full px-4 py-2.5 text-[15px] font-medium bg-black/[0.03] dark:bg-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition placeholder:text-text-muted"
            />
            <textarea
              placeholder={t('journal.contentPlaceholder')}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              className="w-full mt-3 px-4 py-2.5 text-[14px] bg-black/[0.03] dark:bg-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition placeholder:text-text-muted resize-none font-mono text-[13px]"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setIsCreating(false); setNewTitle(''); setNewContent(''); }}
                className="px-4 py-2 text-[13px] font-medium text-accent hover:text-accent-hover apple-transition cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-5 py-2 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-full apple-transition apple-press cursor-pointer"
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center mb-5">
              <BookOpen size={28} strokeWidth={1.5} className="text-text-muted" />
            </div>
            <p className="text-[15px] font-medium text-text mb-1.5">{t('journal.noEntries')}</p>
            <p className="text-[13px] text-text-muted mb-6">{t('journal.noEntriesHint')}</p>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover rounded-full apple-transition apple-press cursor-pointer"
            >
              <Plus size={15} strokeWidth={2} />
              {t('journal.newEntry')}
            </button>
          </div>
        )}

        {/* Entries list */}
        <div className="space-y-3">
          {entries.map((entry) => {
            const isExpanded = expandedEntryId === entry.id;
            return (
              <div
                key={entry.id}
                className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] apple-transition"
              >
                {/* Collapsed header */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03] apple-transition"
                  onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                >
                  {isExpanded
                    ? <ChevronDown size={16} strokeWidth={1.5} className="text-text-muted shrink-0" />
                    : <ChevronRight size={16} strokeWidth={1.5} className="text-text-muted shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <span className="text-[11px] font-mono text-text-muted">
                        {formatTimestamp(entry.createdAt, locale)}
                      </span>
                      {entry.updatedAt !== entry.createdAt && (
                        <span className="text-[10px] font-mono text-text-muted opacity-60">
                          {t('common.modified')}
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-medium text-text truncate">{entry.title}</p>
                    {!isExpanded && entry.content && (
                      <p className="text-[13px] text-text-muted mt-0.5 line-clamp-2">{entry.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCopyEntry(entry)}
                      className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent-light apple-transition cursor-pointer"
                      title={t('common.copyContent')}
                    >
                      {copiedId === entry.id ? (
                        <Check size={14} strokeWidth={2} className="text-success" />
                      ) : (
                        <Copy size={14} strokeWidth={1.5} />
                      )}
                    </button>
                    <button
                      onClick={() => setPreviewEntry(entry)}
                      className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent-light apple-transition cursor-pointer"
                      title="Preview"
                    >
                      <Eye size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => printMarkdownPreview(entry.content, entry.title)}
                      className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent-light apple-transition cursor-pointer"
                      title={t('editor.print')}
                    >
                      <Printer size={14} strokeWidth={1.5} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setDownloadMenuId(downloadMenuId === entry.id ? null : entry.id)}
                        className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent-light apple-transition cursor-pointer"
                        title={t('journal.downloadEntry')}
                      >
                        <Download size={14} strokeWidth={1.5} />
                      </button>
                      {downloadMenuId === entry.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setDownloadMenuId(null)} />
                          <div className="dropdown-menu absolute right-0 top-full mt-2 rounded-2xl shadow-lg z-20 py-1.5 min-w-[160px] border border-border">
                            <button
                              onClick={() => { downloadJournalEntry(entry); setDownloadMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
                            >
                              <FileDown size={15} className="text-text-muted" />
                              Markdown (.md)
                            </button>
                            <button
                              onClick={() => { downloadPdf({ id: entry.id, name: entry.title, content: entry.content, links: entry.links }); setDownloadMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
                            >
                              <FileDown size={15} className="text-text-muted" />
                              Document (.pdf)
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 rounded-lg apple-transition cursor-pointer text-text-muted hover:text-danger hover:bg-danger/10"
                      title={t('common.delete')}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-border/50 animate-fadeIn">
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-1.5">{t('common.title')}</label>
                    <input
                      type="text"
                      defaultValue={entry.title}
                      onBlur={(e) => handleTitleBlur(entry, e.target.value)}
                      className="w-full px-4 py-2.5 text-[14px] font-medium bg-black/[0.03] dark:bg-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition"
                    />
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mt-4 mb-1.5">{t('journal.contentLabel')}</label>
                    <JournalEditor
                      entryId={entry.id}
                      content={entry.content}
                      isDark={isDark}
                      onSave={(value) => handleContentSave(entry.id, value)}
                    />
                    {entry.updatedAt !== entry.createdAt && (
                      <p className="text-[11px] font-mono text-text-muted mt-2">
                        {t('common.lastModified', { date: formatTimestamp(entry.updatedAt, locale) })}
                      </p>
                    )}
                    {/* Links */}
                    <div className="mt-4 px-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Link size={13} className="text-text-muted" strokeWidth={1.5} />
                        <span className="text-[12px] font-medium text-text-muted">{t('editor.links')}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {[...entry.links, ''].map((link, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <input
                              type="url"
                              value={link}
                              placeholder={t('editor.addLink')}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newLinks = [...entry.links];
                                if (i < entry.links.length) {
                                  newLinks[i] = val;
                                } else if (val) {
                                  newLinks.push(val);
                                }
                                onUpdateEntry(entry.id, { links: newLinks });
                              }}
                              className="flex-1 min-w-0 px-3 py-1.5 text-[13px] rounded-lg bg-black/[0.03] dark:bg-white/[0.06] text-text placeholder:text-text-muted/50 outline-none focus:ring-1 focus:ring-accent/30 apple-transition"
                            />
                            {i < entry.links.length && (
                              <button
                                onClick={() => {
                                  const newLinks = entry.links.filter((_, j) => j !== i);
                                  onUpdateEntry(entry.id, { links: newLinks });
                                }}
                                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 apple-transition cursor-pointer"
                              >
                                <X size={14} strokeWidth={1.5} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview modal */}
      {previewEntry && (
        <JournalPreviewModal entry={previewEntry} onClose={() => setPreviewEntry(null)} />
      )}

      {/* Delete confirmation modal */}
      {deleteEntryId && (
        <ConfirmDeleteModal
          onConfirm={confirmDelete}
          onCancel={() => setDeleteEntryId(null)}
        />
      )}
    </div>
  );
}
