import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { usePublicConfig } from '@/hooks/usePublicConfig';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, X, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticItem {
  label: string;
  value: string | boolean | null | undefined;
  status: 'ok' | 'warning' | 'error' | 'info';
}

export default function Diagnostic() {
  const { user, session, status } = useAuth();
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile();
  const { data: publicConfig, isLoading: configLoading, error: configError } = usePublicConfig();
  const [networkErrors, setNetworkErrors] = useState<string[]>([]);
  const [dbTest, setDbTest] = useState<'pending' | 'ok' | 'error'>('pending');

  // Test database connection
  useEffect(() => {
    const testDb = async () => {
      try {
        const { error } = await supabase
          .from('tarot_spreads')
          .select('id')
          .limit(1);
        
        setDbTest(error ? 'error' : 'ok');
      } catch {
        setDbTest('error');
      }
    };
    testDb();
  }, []);

  // Collect recent network errors from console (simplified)
  useEffect(() => {
    const originalError = console.error;
    const errors: string[] = [];
    
    console.error = (...args) => {
      const msg = args.map(a => String(a)).join(' ');
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('supabase')) {
        errors.push(msg.slice(0, 200));
        setNetworkErrors([...errors].slice(-5));
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const diagnostics: DiagnosticItem[] = [
    {
      label: 'Auth Status',
      value: status,
      status: status === 'authenticated' ? 'ok' : status === 'loading' ? 'warning' : 'error',
    },
    {
      label: 'User ID',
      value: user?.id || 'null',
      status: user?.id ? 'ok' : 'error',
    },
    {
      label: 'User Email',
      value: user?.email || 'null',
      status: user?.email ? 'ok' : 'warning',
    },
    {
      label: 'Session Valid',
      value: session ? 'yes' : 'no',
      status: session ? 'ok' : 'error',
    },
    {
      label: 'Session Expires',
      value: session?.expires_at 
        ? new Date(session.expires_at * 1000).toLocaleString('fr-FR')
        : 'null',
      status: session?.expires_at && session.expires_at * 1000 > Date.now() ? 'ok' : 'warning',
    },
    {
      label: 'Profile Loading',
      value: profileLoading ? 'yes' : 'no',
      status: profileLoading ? 'warning' : 'ok',
    },
    {
      label: 'Profile ID',
      value: profile?.id || 'null',
      status: profile?.id ? 'ok' : 'error',
    },
    {
      label: 'Profile Error',
      value: profileError?.message || 'none',
      status: profileError ? 'error' : 'ok',
    },
    {
      label: 'Onboarding Completed',
      value: profile?.onboarding_completed ? 'yes' : 'no',
      status: profile?.onboarding_completed ? 'ok' : 'warning',
    },
    {
      label: 'Display Name',
      value: profile?.display_name || 'null',
      status: 'info',
    },
    {
      label: 'Public Config Loading',
      value: configLoading ? 'yes' : 'no',
      status: configLoading ? 'warning' : 'ok',
    },
    {
      label: 'Public Config Error',
      value: configError?.message || 'none',
      status: configError ? 'error' : 'ok',
    },
    {
      label: 'Maintenance Mode',
      value: publicConfig?.maintenance_mode ? 'yes' : 'no',
      status: publicConfig?.maintenance_mode ? 'warning' : 'ok',
    },
    {
      label: 'DB Connection',
      value: dbTest,
      status: dbTest === 'ok' ? 'ok' : dbTest === 'pending' ? 'warning' : 'error',
    },
  ];

  const getStatusIcon = (status: DiagnosticItem['status']) => {
    switch (status) {
      case 'ok':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <span className="h-4 w-4 text-muted-foreground">•</span>;
    }
  };

  const copyDiagnostics = () => {
    const text = diagnostics
      .map(d => `${d.label}: ${d.value} [${d.status}]`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Diagnostics copiés !');
  };

  return (
    <Layout showFooter={false}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-serif text-2xl font-semibold">Diagnostic Système</h1>
            <p className="text-sm text-muted-foreground">
              Page cachée pour debug - visible uniquement par les utilisateurs connectés
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="sm" onClick={() => refetchProfile()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Profile
            </Button>
            <Button variant="outline" size="sm" onClick={copyDiagnostics}>
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </Button>
          </div>

          {/* Diagnostics Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Élément</th>
                  <th className="px-4 py-3 text-left font-medium">Valeur</th>
                  <th className="px-4 py-3 text-center font-medium">État</th>
                </tr>
              </thead>
              <tbody>
                {diagnostics.map((item, i) => (
                  <tr key={item.label} className={i % 2 === 0 ? 'bg-card' : 'bg-card/50'}>
                    <td className="px-4 py-3 font-medium text-foreground">{item.label}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs break-all">
                      {String(item.value)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusIcon(item.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Network Errors */}
          {networkErrors.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <h3 className="font-medium text-destructive">Erreurs réseau récentes</h3>
              <ul className="text-xs font-mono space-y-1">
                {networkErrors.map((err, i) => (
                  <li key={i} className="text-muted-foreground break-all">{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw Session */}
          <details className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer font-medium">Session brute (JSON)</summary>
            <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
              {JSON.stringify({ user, session: session ? { ...session, access_token: '[HIDDEN]' } : null }, null, 2)}
            </pre>
          </details>

          {/* Raw Profile */}
          <details className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer font-medium">Profile brut (JSON)</summary>
            <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </details>

          {/* Raw Config */}
          <details className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer font-medium">Public Config brut (JSON)</summary>
            <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
              {JSON.stringify(publicConfig, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </Layout>
  );
}
