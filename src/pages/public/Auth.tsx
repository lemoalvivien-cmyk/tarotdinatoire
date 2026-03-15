import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères");

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from;

  useEffect(() => {
    if (user) {
      const destination = from && from !== '/auth' ? from : '/app/onboarding';
      navigate(destination, { replace: true });
    }
  }, [user, navigate, from]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;

    if (mode !== 'forgot') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        setForgotSent(true);
        toast.success('Email envoyé ! Vérifiez votre boîte mail.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'forgot') return handleForgotPassword(e);
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('leaked') || error.message.includes('compromised') || error.message.includes('pwned')) {
            toast.error("Ce mot de passe a été exposé dans une fuite de données. Veuillez en choisir un autre.");
          } else if (error.message.includes('Invalid login credentials')) {
            toast.error("Email ou mot de passe incorrect.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Connexion réussie.");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('leaked') || error.message.includes('compromised') || error.message.includes('pwned')) {
            toast.error("Ce mot de passe a été exposé dans une fuite de données. Veuillez en choisir un autre.");
          } else if (error.message.includes('User already registered')) {
            toast.error("Un compte existe déjà avec cet email.");
            setMode('login');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Inscription réussie ! Bienvenue dans votre espace mystique.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
    setForgotSent(false);
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl font-semibold text-foreground">
              {mode === 'login' ? 'Bon retour' : mode === 'signup' ? 'Bienvenue' : 'Réinitialiser'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'login'
                ? 'Connectez-vous pour accéder à vos tirages'
                : mode === 'signup'
                ? 'Oracle personnel IA · Accès 100 % gratuit pendant la bêta'
                : 'Entrez votre email pour recevoir un lien de réinitialisation'}
            </p>
          </div>

          {/* ── Forgot password success state ── */}
          {mode === 'forgot' && forgotSent ? (
            <div className="p-8 rounded-2xl glass-mystic shadow-soft text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <p className="text-foreground font-medium">Email envoyé !</p>
              <p className="text-sm text-muted-foreground">
                Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
              </p>
              <Button variant="ghost" onClick={() => switchMode('login')} className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 p-8 rounded-2xl glass-mystic shadow-soft">
              <div className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                {/* Password — hidden on forgot mode */}
                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Mot de passe</Label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs text-primary hover:underline"
                        >
                          Mot de passe oublié ?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={loading}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                )}

                {/* Confirm password — signup only */}
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        autoComplete="new-password"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full btn-mystic group" size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {mode === 'login' ? 'Connexion...' : mode === 'signup' ? 'Création de votre compte...' : 'Envoi en cours...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'S\'inscrire gratuitement' : 'Envoyer le lien'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
              </Button>

              <div className="text-center text-sm space-y-2">
                {mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="flex items-center gap-1 mx-auto text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Retour à la connexion
                  </button>
                ) : (
                  <div>
                    <span className="text-muted-foreground">
                      {mode === 'login' ? "Pas encore de compte ?" : "Déjà un compte ?"}
                    </span>{' '}
                    <button
                      type="button"
                      onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                      className="text-primary hover:underline font-medium"
                    >
                      {mode === 'login' ? "S'inscrire" : "Se connecter"}
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground">
            En vous inscrivant, vous acceptez nos{' '}
            <a href="/legal/terms" className="text-primary hover:underline">CGV</a>
            {' '}et notre{' '}
            <a href="/legal/privacy" className="text-primary hover:underline">politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </Layout>
  );
}
