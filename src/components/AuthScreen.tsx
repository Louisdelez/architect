import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { FolderOpen, Globe } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import type { Locale } from '../i18n/types';

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'es', label: 'Español' },
];

export default function AuthScreen() {
  const { register, login, loginWithGoogle } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, [mode]);

  function translateFirebaseError(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return t('auth.errorEmailInUse');
      case 'auth/invalid-email':
        return t('auth.errorInvalidEmail');
      case 'auth/weak-password':
        return t('auth.errorWeakPassword');
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return t('auth.errorWrongCredentials');
      case 'auth/too-many-requests':
        return t('auth.errorTooManyRequests');
      case 'auth/network-request-failed':
        return t('auth.errorNetwork');
      case 'auth/popup-closed-by-user':
        return '';
      default:
        return t('auth.errorGeneric');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      setError(translateFirebaseError(code));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 relative">
      {/* Language selector — top right */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-text-muted hover:text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl apple-transition cursor-pointer"
          >
            <Globe size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">{LOCALE_OPTIONS.find(o => o.value === locale)?.label}</span>
          </button>
          {showLangMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
              <div className="dropdown-menu absolute right-0 top-full mt-1 rounded-2xl shadow-lg z-20 py-1.5 w-[160px] border border-border">
                {LOCALE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setLocale(value); setShowLangMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] apple-transition cursor-pointer ${
                      locale === value
                        ? 'text-accent font-medium'
                        : 'text-text hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="w-full max-w-[420px]">
        {/* Logo / branding */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-3xl bg-accent/10 flex items-center justify-center">
            <FolderOpen size={28} strokeWidth={1.5} className="text-accent" />
          </div>
          <h1 className="text-[24px] font-semibold text-text">Architect</h1>
          <p className="text-[14px] text-text-muted mt-2">
            {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-surface rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-modal)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <input
                ref={firstInputRef}
                type="text"
                placeholder={t('auth.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-5 py-3 text-[15px] bg-black/[0.03] dark:bg-white/[0.06] rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition placeholder:text-text-muted"
              />
            )}
            <input
              ref={mode === 'login' ? firstInputRef : undefined}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3 text-[15px] bg-black/[0.03] dark:bg-white/[0.06] rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition placeholder:text-text-muted"
            />
            <input
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-5 py-3 text-[15px] bg-black/[0.03] dark:bg-white/[0.06] rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition placeholder:text-text-muted"
            />

            {error && (
              <p className="text-[13px] text-danger text-center py-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-[15px] font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl apple-transition apple-press cursor-pointer"
            >
              {submitting
                ? '...'
                : mode === 'login'
                  ? t('auth.loginButton')
                  : t('auth.registerButton')}
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-black/[0.08] dark:bg-white/[0.08]" />
            <span className="text-[12px] text-text-muted">{t('common.or')}</span>
            <div className="flex-1 h-px bg-black/[0.08] dark:bg-white/[0.08]" />
          </div>

          {/* Google */}
          <button
            onClick={async () => {
              setError('');
              try {
                await loginWithGoogle();
              } catch (err) {
                const code = err instanceof FirebaseError ? err.code : '';
                const msg = translateFirebaseError(code);
                if (msg) setError(msg);
              }
            }}
            className="w-full flex items-center justify-center gap-3 py-3 text-[15px] font-medium text-text bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] rounded-2xl apple-transition apple-press cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t('auth.continueWithGoogle')}
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-[13px] text-accent hover:text-accent-hover apple-transition cursor-pointer"
            >
              {mode === 'login'
                ? t('auth.noAccount')
                : t('auth.hasAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
