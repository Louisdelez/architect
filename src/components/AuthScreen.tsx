import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FolderOpen } from 'lucide-react';
import { FirebaseError } from 'firebase/app';

function translateFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà utilisée.';
    case 'auth/invalid-email':
      return 'Adresse e-mail invalide.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou mot de passe incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez plus tard.';
    case 'auth/network-request-failed':
      return 'Erreur réseau. Vérifiez votre connexion.';
    case 'auth/popup-closed-by-user':
      return '';
    default:
      return 'Une erreur est survenue. Réessayez.';
  }
}

export default function AuthScreen() {
  const { register, login, loginWithGoogle } = useAuth();
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
    <div className="h-full w-full flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo / branding */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-3xl bg-accent/10 flex items-center justify-center">
            <FolderOpen size={28} strokeWidth={1.5} className="text-accent" />
          </div>
          <h1 className="text-[24px] font-semibold text-text">Project Docs</h1>
          <p className="text-[14px] text-text-muted mt-2">
            {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-surface rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-modal)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <input
                ref={firstInputRef}
                type="text"
                placeholder="Nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-5 py-3 text-[15px] bg-black/[0.03] dark:bg-white/[0.06] rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition placeholder:text-text-muted"
              />
            )}
            <input
              ref={mode === 'login' ? firstInputRef : undefined}
              type="email"
              placeholder="Adresse e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3 text-[15px] bg-black/[0.03] dark:bg-white/[0.06] rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/25 apple-transition placeholder:text-text-muted"
            />
            <input
              type="password"
              placeholder="Mot de passe"
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
                  ? 'Se connecter'
                  : 'Créer le compte'}
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-black/[0.08] dark:bg-white/[0.08]" />
            <span className="text-[12px] text-text-muted">ou</span>
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
            Continuer avec Google
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-[13px] text-accent hover:text-accent-hover apple-transition cursor-pointer"
            >
              {mode === 'login'
                ? 'Pas encore de compte ? Créer un compte'
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
