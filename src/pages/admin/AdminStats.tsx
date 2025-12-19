import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  ArrowLeft, 
  Users,
  Sparkles,
  Mail,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface FunnelStats {
  totalUsers: number;
  usersWithReadings: number;
  usersWithMultipleReadings: number;
  emailLeads: number;
  emailLeadsVerified: number;
  readingsToday: number;
  readingsThisWeek: number;
  averageReadingsPerUser: number;
}

export default function AdminStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-funnel-stats'],
    queryFn: async (): Promise<FunnelStats> => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get users with at least one reading
      const { data: readingUsers } = await supabase
        .from('reading_sessions')
        .select('user_id')
        .limit(10000);

      const uniqueUsersWithReadings = new Set(readingUsers?.map(r => r.user_id) || []);
      
      // Count users with multiple readings
      const userReadingCounts = readingUsers?.reduce((acc, r) => {
        acc[r.user_id] = (acc[r.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const usersWithMultiple = Object.values(userReadingCounts).filter(c => c > 1).length;

      // Get email leads stats
      const { count: emailLeads } = await supabase
        .from('email_leads')
        .select('*', { count: 'exact', head: true })
        .is('unsubscribed_at', null);

      const { count: emailLeadsVerified } = await supabase
        .from('email_leads')
        .select('*', { count: 'exact', head: true })
        .eq('email_verified', true)
        .is('unsubscribed_at', null);

      // Get readings today
      const { count: readingsToday } = await supabase
        .from('reading_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Get readings this week
      const { count: readingsThisWeek } = await supabase
        .from('reading_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);

      const avgReadings = uniqueUsersWithReadings.size > 0 
        ? (readingUsers?.length || 0) / uniqueUsersWithReadings.size 
        : 0;

      return {
        totalUsers: totalUsers || 0,
        usersWithReadings: uniqueUsersWithReadings.size,
        usersWithMultipleReadings: usersWithMultiple,
        emailLeads: emailLeads || 0,
        emailLeadsVerified: emailLeadsVerified || 0,
        readingsToday: readingsToday || 0,
        readingsThisWeek: readingsThisWeek || 0,
        averageReadingsPerUser: Math.round(avgReadings * 10) / 10,
      };
    },
    staleTime: 60000,
  });

  const conversionRate = stats && stats.totalUsers > 0 
    ? Math.round((stats.usersWithReadings / stats.totalUsers) * 100) 
    : 0;

  const retentionRate = stats && stats.usersWithReadings > 0
    ? Math.round((stats.usersWithMultipleReadings / stats.usersWithReadings) * 100)
    : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-semibold">Statistiques Funnel</h1>
                <p className="text-sm text-muted-foreground">Analyse du parcours utilisateur</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : stats ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Utilisateurs</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Aujourd'hui</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.readingsToday}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Cette semaine</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.readingsThisWeek}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Email Leads</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.emailLeads}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Funnel Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>Entonnoir de conversion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1: Total Users */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilisateurs inscrits</span>
                      <span className="font-medium">{stats.totalUsers}</span>
                    </div>
                    <Progress value={100} className="h-3" />
                  </div>

                  {/* Step 2: Users with readings */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ont fait un tirage</span>
                      <span className="font-medium">
                        {stats.usersWithReadings} ({conversionRate}%)
                      </span>
                    </div>
                    <Progress value={conversionRate} className="h-3" />
                  </div>

                  {/* Step 3: Retention */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ont fait plusieurs tirages</span>
                      <span className="font-medium">
                        {stats.usersWithMultipleReadings} ({retentionRate}%)
                      </span>
                    </div>
                    <Progress value={retentionRate} className="h-3" />
                  </div>

                  {/* Email conversion */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Leads email collectés</span>
                      <span className="font-medium">
                        {stats.emailLeads} ({stats.emailLeadsVerified} vérifiés)
                      </span>
                    </div>
                    <Progress 
                      value={stats.totalUsers > 0 ? (stats.emailLeads / stats.totalUsers) * 100 : 0} 
                      className="h-3" 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Insights */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Taux de conversion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-primary">{conversionRate}%</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      des utilisateurs font un tirage
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Moyenne tirages/user</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-primary">{stats.averageReadingsPerUser}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      tirages par utilisateur actif
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
