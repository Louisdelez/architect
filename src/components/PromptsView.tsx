import { useState, useRef, useEffect } from 'react';
import { Plus, Sparkles, ChevronDown, ChevronRight, Copy, Check, Trash2 } from 'lucide-react';
import { copyToClipboard } from '../utils/export';
import { formatTimestamp } from '../utils/format';
import type { Prompt } from '../types';

interface PromptsViewProps {
  prompts: Prompt[];
  onAddPrompt: (title: string, content: string) => void;
  onUpdatePrompt: (promptId: string, fields: Partial<Pick<Prompt, 'title' | 'content'>>) => void;
  onDeletePrompt: (promptId: string) => void;
}

export default function PromptsView({ prompts, onAddPrompt, onUpdatePrompt, onDeletePrompt }: PromptsViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const newTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) newTitleRef.current?.focus();
  }, [isCreating]);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    onAddPrompt(newTitle, newContent);
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleTitleBlur = (prompt: Prompt, value: string) => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== prompt.title) {
      onUpdatePrompt(prompt.id, { title: trimmed });
    }
  };

  const handleContentBlur = (prompt: Prompt, value: string) => {
    if (value !== prompt.content) {
      onUpdatePrompt(prompt.id, { content: value });
    }
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDeletePrompt(id);
      setConfirmDeleteId(null);
      if (expandedId === id) setExpandedId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleCopy = async (prompt: Prompt) => {
    await copyToClipboard(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center">
            <Sparkles size={18} strokeWidth={1.5} className="text-text-muted" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-text">Prompts</h2>
            <p className="text-[12px] text-text-muted">
              {prompts.length === 0 ? 'Aucun prompt' : `${prompts.length} prompt${prompts.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover rounded-full apple-transition apple-press cursor-pointer"
        >
          <Plus size={15} strokeWidth={2} />
          <span className="hidden sm:inline">Nouveau prompt</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        {/* Create form */}
        {isCreating && (
          <div className="mb-5 p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] animate-fadeIn">
            <input
              ref={newTitleRef}
              type="text"
              placeholder="Titre du prompt..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newTitle.trim()) handleCreate(); }}
              className="w-full px-4 py-2.5 text-[15px] font-medium bg-black/[0.03] dark:bg-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition placeholder:text-text-muted"
            />
            <textarea
              placeholder="Contenu du prompt..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={6}
              className="w-full mt-3 px-4 py-2.5 text-[14px] bg-black/[0.03] dark:bg-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition placeholder:text-text-muted resize-none font-mono text-[13px]"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setIsCreating(false); setNewTitle(''); setNewContent(''); }}
                className="px-4 py-2 text-[13px] font-medium text-accent hover:text-accent-hover apple-transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-5 py-2 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-full apple-transition apple-press cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {prompts.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] flex items-center justify-center mb-5">
              <Sparkles size={28} strokeWidth={1.5} className="text-text-muted" />
            </div>
            <p className="text-[15px] font-medium text-text mb-1.5">Aucun prompt</p>
            <p className="text-[13px] text-text-muted mb-6">Créez et stockez vos prompts pour les copier en un clic</p>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover rounded-full apple-transition apple-press cursor-pointer"
            >
              <Plus size={15} strokeWidth={2} />
              Nouveau prompt
            </button>
          </div>
        )}

        {/* Prompts list */}
        <div className="space-y-3">
          {prompts.map((prompt) => {
            const isExpanded = expandedId === prompt.id;
            return (
              <div
                key={prompt.id}
                className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] apple-transition overflow-hidden"
              >
                {/* Collapsed header */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03] apple-transition"
                  onClick={() => setExpandedId(isExpanded ? null : prompt.id)}
                >
                  {isExpanded
                    ? <ChevronDown size={16} strokeWidth={1.5} className="text-text-muted shrink-0" />
                    : <ChevronRight size={16} strokeWidth={1.5} className="text-text-muted shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <span className="text-[11px] font-mono text-text-muted">
                        {formatTimestamp(prompt.createdAt)}
                      </span>
                      {prompt.updatedAt !== prompt.createdAt && (
                        <span className="text-[10px] font-mono text-text-muted opacity-60">
                          (modifié)
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-medium text-text truncate">{prompt.title}</p>
                    {!isExpanded && prompt.content && (
                      <p className="text-[13px] text-text-muted mt-0.5 line-clamp-2">{prompt.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCopy(prompt)}
                      className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent-light apple-transition cursor-pointer"
                      title="Copier le contenu"
                    >
                      {copiedId === prompt.id ? (
                        <Check size={14} strokeWidth={2} className="text-success" />
                      ) : (
                        <Copy size={14} strokeWidth={1.5} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className={`p-2 rounded-lg apple-transition cursor-pointer ${
                        confirmDeleteId === prompt.id
                          ? 'bg-danger/20 hover:bg-danger/30 text-danger'
                          : 'text-text-muted hover:text-danger hover:bg-danger/10'
                      }`}
                      title={confirmDeleteId === prompt.id ? 'Confirmer la suppression' : 'Supprimer'}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-border/50 animate-fadeIn">
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-1.5">Titre</label>
                    <input
                      type="text"
                      defaultValue={prompt.title}
                      onBlur={(e) => handleTitleBlur(prompt, e.target.value)}
                      className="w-full px-4 py-2.5 text-[14px] font-medium bg-black/[0.03] dark:bg-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition"
                    />
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mt-4 mb-1.5">Contenu</label>
                    <textarea
                      defaultValue={prompt.content}
                      onBlur={(e) => handleContentBlur(prompt, e.target.value)}
                      rows={8}
                      className="w-full px-4 py-2.5 text-[13px] font-mono bg-black/[0.03] dark:bg-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition resize-none"
                    />
                    {prompt.updatedAt !== prompt.createdAt && (
                      <p className="text-[11px] font-mono text-text-muted mt-2">
                        Dernière modification : {formatTimestamp(prompt.updatedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
