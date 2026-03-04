import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { Download, Eye, Copy, FileDown, Check, Link, X, Printer } from 'lucide-react';
import type { Document } from '../types';
import { copyToClipboard, downloadMarkdown, downloadPdf, printMarkdownPreview } from '../utils/export';
import { useIsDark } from '../hooks/useIsDark';
import { useI18n } from '../i18n/I18nContext';

interface EditorProps {
  document: Document;
  onContentChange: (content: string) => void;
  onLinksChange: (links: string[]) => void;
  onPreview: () => void;
}

export default function Editor({ document, onContentChange, onLinksChange, onPreview }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const isDark = useIsDark();
  const { t, tp } = useI18n();
  const onChangeRef = useRef(onContentChange);
  onChangeRef.current = onContentChange;

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: document.content,
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
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            backgroundColor: 'var(--color-editor-bg)',
            color: 'var(--color-editor-text)',
          },
          '.cm-content': {
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
            padding: '24px 12px',
            caretColor: isDark ? '#fff' : '#1d1d1f',
          },
          '.cm-line': {
            padding: '0 8px',
          },
          '.cm-cursor': {
            borderLeftColor: isDark ? '#fff' : '#1d1d1f',
          },
        }, { dark: isDark }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [document.id, isDark]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentContent = view.state.doc.toString();
    if (currentContent !== document.content) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: document.content,
        },
      });
    }
  }, [document.content, document.id]);

  const handleCopy = async () => {
    await copyToClipboard(document.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = document.content.split('\n').length;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-surface">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-[14px] sm:text-[16px] font-semibold text-text truncate">{document.name}</h2>
          <p className="text-[12px] text-text-muted mt-1 hidden sm:block">
            {document.content.trim().length > 0
              ? tp('editor.lineCount', lineCount, { count: lineCount })
              : t('editor.emptyDocument')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
            title={t('editor.copyToClipboard')}
          >
            {copied ? (
              <Check size={16} className="text-success" strokeWidth={2} />
            ) : (
              <Copy size={16} strokeWidth={1.5} />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
              title={t('editor.download')}
            >
              <Download size={16} strokeWidth={1.5} />
            </button>
            {showDownloadMenu && (
              <>
                <div data-testid="download-overlay" className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
                <div data-testid="download-menu" className="dropdown-menu absolute right-0 top-full mt-2 rounded-2xl shadow-lg z-20 py-1.5 min-w-[160px] border border-border">
                  <button
                    onClick={() => {
                      downloadMarkdown(document);
                      setShowDownloadMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
                  >
                    <FileDown size={15} className="text-text-muted" />
                    Markdown (.md)
                  </button>
                  <button
                    onClick={() => {
                      downloadPdf(document);
                      setShowDownloadMenu(false);
                    }}
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
            onClick={() => printMarkdownPreview(document.content, document.name)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
            title={t('editor.print')}
          >
            <Printer size={16} strokeWidth={1.5} />
          </button>

          <div className="w-px h-6 bg-border mx-1.5" />

          <button
            onClick={onPreview}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover rounded-full apple-transition apple-press cursor-pointer"
            title={t('editor.preview')}
          >
            <Eye size={15} />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </div>

      {/* Editor + Links (scroll down to see links) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-5">
        <div className="h-full overflow-hidden bg-editor-bg rounded-2xl" ref={editorRef} />
        {/* Links — scroll down to access */}
        <div className="mt-3 px-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Link size={13} className="text-text-muted" strokeWidth={1.5} />
            <span className="text-[12px] font-medium text-text-muted">{t('editor.links')}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {[...document.links, ''].map((link, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={link}
                  placeholder={t('editor.addLink')}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newLinks = [...document.links];
                    if (i < document.links.length) {
                      newLinks[i] = val;
                    } else if (val) {
                      newLinks.push(val);
                    }
                    onLinksChange(newLinks);
                  }}
                  className="flex-1 min-w-0 px-3 py-1.5 text-[13px] rounded-lg bg-black/[0.03] dark:bg-white/[0.06] text-text placeholder:text-text-muted/50 outline-none focus:ring-1 focus:ring-accent/30 apple-transition"
                />
                {i < document.links.length && (
                  <button
                    onClick={() => {
                      const newLinks = document.links.filter((_, j) => j !== i);
                      onLinksChange(newLinks);
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
    </div>
  );
}
