import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  if (!user) return null;

  return (
    <div className="px-4 py-4 border-t border-border flex items-center gap-3">
      {/* Avatar */}
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-full shrink-0 object-cover"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[13px] font-semibold shrink-0">
          {getInitials(user.displayName)}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-text truncate">
          {user.displayName || t('userMenu.defaultName')}
        </p>
        <p className="text-[11px] text-text-muted truncate">
          {user.email}
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 apple-transition cursor-pointer shrink-0"
        title={t('userMenu.logout')}
      >
        <LogOut size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
