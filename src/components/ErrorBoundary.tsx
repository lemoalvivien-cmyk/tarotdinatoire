import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Always log in dev, minimal in prod
    const logData = {
      name: error.name,
      message: error.message,
      stack: import.meta.env.DEV ? error.stack : undefined,
      componentStack: import.meta.env.DEV ? errorInfo.componentStack : '[hidden in prod]',
    };
    
    console.error('[ErrorBoundary] Caught error:', logData);
    
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReconnect = () => {
    window.location.href = '/auth';
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Erreur inconnue';
      const isAuthError = errorMessage.toLowerCase().includes('auth') || 
                          errorMessage.toLowerCase().includes('session') ||
                          errorMessage.toLowerCase().includes('jwt');
      const isNetworkError = errorMessage.toLowerCase().includes('network') ||
                             errorMessage.toLowerCase().includes('fetch');

      // Determine user-friendly message
      let userMessage = "Les énergies sont temporairement perturbées. Réessayez dans un instant.";
      if (isAuthError) {
        userMessage = "Votre connexion spirituelle a été interrompue. Rechargez la page ou reconnectez-vous.";
      } else if (isNetworkError) {
        userMessage = "La connexion aux astres est instable. Vérifiez votre connexion internet.";
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
             <h1 className="font-serif text-2xl font-semibold text-foreground">
                L'Oracle médite
              </h1>
              <p className="text-muted-foreground">
                {userMessage}
              </p>
            </div>

            {import.meta.env.DEV && (
              <div className="p-4 rounded-lg bg-muted/50 text-left">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Bug className="h-4 w-4" />
                  <span className="text-xs font-medium">Détails techniques</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {errorMessage.substring(0, 200)}
                  {errorMessage.length > 200 && '...'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                Réessayer
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Recharger
              </Button>
              <Button onClick={this.handleGoHome} className="gap-2">
                <Home className="h-4 w-4" />
                Accueil
              </Button>
            </div>

            {isAuthError && (
              <p className="text-sm text-muted-foreground">
                Si le problème persiste,{' '}
                <button 
                  onClick={this.handleReconnect}
                  className="text-primary hover:underline"
                >
                  reconnectez-vous
                </button>
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
