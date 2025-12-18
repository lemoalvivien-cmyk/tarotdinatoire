import { Layout } from '@/components/layout/Layout';
import { Shield } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-semibold">
                Administration
              </h1>
              <p className="text-muted-foreground">Tableau de bord</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-card border border-border/50">
              <h3 className="font-semibold mb-2">Utilisateurs</h3>
              <p className="text-2xl font-serif">—</p>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border/50">
              <h3 className="font-semibold mb-2">Tirages</h3>
              <p className="text-2xl font-serif">—</p>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border/50">
              <h3 className="font-semibold mb-2">Aujourd'hui</h3>
              <p className="text-2xl font-serif">—</p>
            </div>
          </div>

          <div className="p-8 rounded-2xl glass-mystic text-center">
            <p className="text-muted-foreground">
              Les fonctionnalités d'administration seront implémentées prochainement.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
