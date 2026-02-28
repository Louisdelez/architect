import { useState, useRef, useEffect } from 'react';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}

export default function CreateProjectModal({ onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="modal-content relative w-[90vw] max-w-[480px] bg-surface rounded-3xl overflow-hidden" style={{ boxShadow: 'var(--shadow-modal)' }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-3 text-center">
          <h2 className="text-[20px] font-semibold text-text">Nouveau projet</h2>
          <p className="text-[14px] text-text-muted mt-2 leading-relaxed">
            23 documents seront créés automatiquement.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-4">
          <input
            ref={inputRef}
            type="text"
            placeholder="Nom du projet..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-5 py-3 text-[15px] bg-black/[0.03] dark:bg-white/[0.06] rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition placeholder:text-text-muted"
          />

          <div className="flex justify-end items-center gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-[14px] font-medium text-accent hover:text-accent-hover apple-transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-7 py-2.5 text-[14px] font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-full apple-transition apple-press cursor-pointer"
            >
              Créer le projet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
