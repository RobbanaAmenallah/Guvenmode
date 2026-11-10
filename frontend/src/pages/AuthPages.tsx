import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore.js';
import { BrandLogo } from '../components/common/BrandLogo.js';
import { api, ApiError } from '../api/client.js';

export const AuthPages: React.FC<{ mode: 'login' | 'register' }> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.post<{ user: any; token: string }>('/auth/login', {
          email: email.trim(),
          password
        });

        login(res.user, res.token);

        if (res.user.role === 'admin' || res.user.role === 'super_admin') {
          navigate('/admin');
        } else {
          const from = (location.state as any)?.from?.pathname || '/mon-compte';
          navigate(from);
        }
      } else {
        const res = await api.post<{ user: any; token: string; requiresEmailConfirmation?: boolean }>('/auth/register', {
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim()
        });

        if (res.requiresEmailConfirmation || !res.token) {
          setErrorMessage('Compte créé ! Veuillez confirmer votre adresse e-mail avant de vous connecter.');
          return;
        }

        login(res.user, res.token);
        const from = (location.state as any)?.from?.pathname || '/mon-compte';
        navigate(from);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Une erreur est survenue lors de la connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-guven-border shadow-luxury space-y-8">
        <div className="text-center space-y-3">
          <BrandLogo variant="header" size="md" className="justify-center" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-guven-charcoal">
            {mode === 'login' ? 'Espace Privilège' : 'Créer un Compte'}
          </h1>
          <p className="text-xs text-guven-muted font-light">
            {mode === 'login'
              ? 'Connectez-vous pour suivre vos commandes et gérer votre espace.'
              : 'Rejoignez la maison GÜVEN MODE et profitez d\'avantages exclusifs.'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">Prénom</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Amina"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-guven-charcoal mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Trabelsi"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-guven-charcoal mb-1">Adresse Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@domaine.com"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none pl-9"
              />
              <Mail className="w-4 h-4 text-guven-muted absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-guven-charcoal mb-1">Mot de passe</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={mode === 'register' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none pl-9"
              />
              <Lock className="w-4 h-4 text-guven-muted absolute left-3 top-3" />
            </div>
            {mode === 'register' && (
              <p className="text-[11px] text-guven-muted mt-1">
                Minimum 8 caractères, incluant au moins une lettre et un chiffre.
              </p>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-guven-charcoal mb-1">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+216 28 827 626"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-guven-border focus:border-guven-blue focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-guven-blue hover:bg-guven-blue-deep text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Se Connecter' : 'Créer mon Compte'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch Link */}
        <div className="text-center text-xs text-guven-muted">
          {mode === 'login' ? (
            <p>
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="text-guven-blue font-bold hover:underline">
                Créer un compte
              </Link>
            </p>
          ) : (
            <p>
              Vous avez déjà un compte ?{' '}
              <Link to="/connexion" className="text-guven-blue font-bold hover:underline">
                Se connecter
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
