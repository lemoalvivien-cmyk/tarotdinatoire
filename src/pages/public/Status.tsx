import { Layout } from '@/components/layout/Layout';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

// This would typically be fetched from an API or environment variable
const STATUS = {
  operational: true,
  message: "Tous les systèmes sont opérationnels",
  lastUpdated: new Date().toISOString(),
};

export default function Status() {
  const isOperational = STATUS.operational;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
              isOperational ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
            }`}>
              {isOperational ? <CheckCircle className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              État du service
            </h1>
          </div>

          {/* Status Card */}
          <div className={`p-8 rounded-2xl border-2 ${
            isOperational 
              ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
              : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900'
          }`}>
            <div className="flex items-center gap-4">
              {isOperational ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              )}
              <div>
                <h2 className={`font-semibold ${isOperational ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                  {STATUS.message}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  Dernière mise à jour : {new Date(STATUS.lastUpdated).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          {/* Services Status */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold">Services</h3>
            
            <div className="space-y-3">
              {[
                { name: 'Application web', status: 'operational' },
                { name: 'Authentification', status: 'operational' },
                { name: 'Base de données', status: 'operational' },
                { name: 'Interprétation IA', status: 'operational' },
              ].map((service) => (
                <div 
                  key={service.name}
                  className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50"
                >
                  <span className="font-medium">{service.name}</span>
                  <span className={`flex items-center gap-2 text-sm ${
                    service.status === 'operational' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      service.status === 'operational' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    {service.status === 'operational' ? 'Opérationnel' : 'Dégradé'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="text-center p-6 rounded-xl bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Un problème ? Contactez-nous via les informations présentes dans nos{' '}
              <a href="/legal/imprint" className="text-primary hover:underline">mentions légales</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
