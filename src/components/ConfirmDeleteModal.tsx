import { Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface ConfirmDeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({ onConfirm, onCancel }: ConfirmDeleteModalProps) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 modal-backdrop"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="modal-content relative w-[90vw] max-w-[400px] bg-surface rounded-3xl overflow-hidden" style={{ boxShadow: 'var(--shadow-modal)' }}>
        <div className="px-8 pt-8 pb-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={22} strokeWidth={1.5} className="text-danger" />
          </div>
          <h2 className="text-[18px] font-semibold text-text">{t('common.confirmDelete')}</h2>
          <p className="text-[14px] text-text-muted mt-2 leading-relaxed">
            {t('common.confirmDeleteMessage')}
          </p>
        </div>

        <div className="flex justify-end items-center gap-4 px-8 pb-8 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-[14px] font-medium text-accent hover:text-accent-hover apple-transition cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-7 py-2.5 text-[14px] font-medium text-white bg-danger hover:bg-danger/90 rounded-full apple-transition apple-press cursor-pointer"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
