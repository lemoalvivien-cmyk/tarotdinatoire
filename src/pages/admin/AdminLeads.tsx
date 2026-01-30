import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Mail, 
  ArrowLeft, 
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface EmailLead {
  id: string;
  email: string;
  first_name: string | null;
  consent: boolean;
  email_verified: boolean;
  unsubscribed_at: string | null;
  created_at: string;
  spread_id: string | null;
}

export default function AdminLeads() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: leads, isLoading } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: async (): Promise<EmailLead[]> => {
      // Use secure RPC function that checks admin role before returning data
      // The function excludes sensitive tokens (verification_token, unsubscribe_token)
      const { data, error } = await supabase.rpc('get_email_leads_admin_safe');

      if (error) throw error;
      return (data as EmailLead[]) ?? [];
    },
  });

  const filteredLeads = leads?.filter(lead => 
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    if (!leads || leads.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    // Filter only consented, not unsubscribed leads
    const validLeads = leads.filter(l => l.consent && !l.unsubscribed_at);

    if (validLeads.length === 0) {
      toast.error("Aucun lead valide à exporter");
      return;
    }

    const headers = ['Email', 'Prénom', 'Vérifié', 'Date inscription', 'Tirage'];
    const rows = validLeads.map(lead => [
      lead.email,
      lead.first_name || '',
      lead.email_verified ? 'Oui' : 'Non',
      new Date(lead.created_at).toLocaleDateString('fr-FR'),
      lead.spread_id || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${validLeads.length} leads exportés`);
  };

  const activeLeads = leads?.filter(l => l.consent && !l.unsubscribed_at).length ?? 0;
  const unsubscribed = leads?.filter(l => l.unsubscribed_at).length ?? 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/admin">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-semibold">Gestion des Leads</h1>
                  <p className="text-sm text-muted-foreground">
                    {activeLeads} actifs · {unsubscribed} désinscrits
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par email ou prénom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{leads?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-green-500">{activeLeads}</p>
                <p className="text-sm text-muted-foreground">Actifs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{leads?.filter(l => l.email_verified).length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Vérifiés</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-orange-500">{unsubscribed}</p>
                <p className="text-sm text-muted-foreground">Désinscrits</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des leads</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLeads && filteredLeads.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Prénom</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Tirage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.email}</TableCell>
                          <TableCell>{lead.first_name || '—'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {lead.unsubscribed_at ? (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Désinscrit
                                </Badge>
                              ) : lead.email_verified ? (
                                <Badge variant="default" className="gap-1 bg-green-500">
                                  <CheckCircle className="h-3 w-3" />
                                  Vérifié
                                </Badge>
                              ) : (
                                <Badge variant="secondary">En attente</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(lead.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {lead.spread_id || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  {searchTerm ? 'Aucun résultat' : 'Aucun lead pour le moment'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
