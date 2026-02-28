import { useEffect, useRef, useCallback, useState, useSyncExternalStore } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { Download, Eye, Copy, FileDown, Check } from 'lucide-react';
import type { Document } from '../types';
import { copyToClipboard, downloadMarkdown, downloadPdf } from '../utils/export';

function useIsDark() {
  return useSyncExternalStore(
    (cb) => {
      const obs = new MutationObserver(cb);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => obs.disconnect();
    },
    () => document.documentElement.classList.contains('dark'),
  );
}

interface EditorProps {
  document: Document;
  onContentChange: (content: string) => void;
  onPreview: () => void;
}

export default function Editor({ document, onContentChange, onPreview }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const isDark = useIsDark();

  const handleChange = useCallback(
    (content: string) => {
      onContentChange(content);
    },
    [onContentChange]
  );

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
            handleChange(update.state.doc.toString());
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

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-surface">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-[16px] font-semibold text-text">{document.name}</h2>
          <p className="text-[12px] text-text-muted mt-1">
            {document.content.trim().length > 0
              ? `${document.content.split('\n').length} lignes`
              : 'Document vide'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] apple-transition cursor-pointer"
            title="Copier dans le presse-papier"
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
              title="Télécharger"
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

          <div className="w-px h-6 bg-border mx-1.5" />

          <button
            onClick={onPreview}
            className="flex items-center gap-2 px-5 py-2 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover rounded-full apple-transition apple-press cursor-pointer"
            title="Prévisualiser"
          >
            <Eye size={15} />
            Preview
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 p-5">
        <div className="h-full overflow-hidden bg-editor-bg rounded-2xl" ref={editorRef} />
      </div>
    </div>
  );
}
