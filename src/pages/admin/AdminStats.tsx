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
  Loader2,
  Play,
  Shuffle,
  Scissors,
  MousePointer,
  CheckCircle,
  Eye
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

interface EventCount {
  event_name: string;
  count: number;
}

const FUNNEL_EVENTS = [
  { key: 'reading_start', label: 'Démarrage tirage', icon: Play },
  { key: 'shuffle', label: 'Mélange', icon: Shuffle },
  { key: 'cut', label: 'Coupe', icon: Scissors },
  { key: 'select_card', label: 'Sélection carte', icon: MousePointer },
  { key: 'validate', label: 'Validation', icon: CheckCircle },
  { key: 'result_view', label: 'Vue résultat', icon: Eye },
  { key: 'email_submit', label: 'Email soumis', icon: Mail },
];

export default function AdminStats() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-funnel-stats'],
    queryFn: async (): Promise<FunnelStats> => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: readingUsers } = await supabase
        .from('reading_sessions')
        .select('user_id')
        .limit(10000);

      const uniqueUsersWithReadings = new Set(readingUsers?.map(r => r.user_id) || []);
      
      const userReadingCounts = readingUsers?.reduce((acc, r) => {
        acc[r.user_id] = (acc[r.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const usersWithMultiple = Object.values(userReadingCounts).filter(c => c > 1).length;

      const { count: emailLeads } = await supabase
        .from('email_leads')
        .select('*', { count: 'exact', head: true })
        .is('unsubscribed_at', null);

      const { count: emailLeadsVerified } = await supabase
        .from('email_leads')
        .select('*', { count: 'exact', head: true })
        .eq('email_verified', true)
        .is('unsubscribed_at', null);

      const { count: readingsToday } = await supabase
        .from('reading_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

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

  // Fetch event funnel data
  const { data: eventCounts, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-event-funnel'],
    queryFn: async (): Promise<EventCount[]> => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Get counts for each event type
      const counts: EventCount[] = [];
      
      for (const event of FUNNEL_EVENTS) {
        const { count } = await supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_name', event.key)
          .gte('created_at', weekAgo);

        counts.push({ event_name: event.key, count: count || 0 });
      }
      
      return counts;
    },
    staleTime: 60000,
  });

  const isLoading = statsLoading || eventsLoading;

  const conversionRate = stats && stats.totalUsers > 0 
    ? Math.round((stats.usersWithReadings / stats.totalUsers) * 100) 
    : 0;

  const retentionRate = stats && stats.usersWithReadings > 0
    ? Math.round((stats.usersWithMultipleReadings / stats.usersWithReadings) * 100)
    : 0;

  // Calculate funnel percentages
  const maxEventCount = eventCounts ? Math.max(...eventCounts.map(e => e.count), 1) : 1;
  const getEventCount = (key: string) => eventCounts?.find(e => e.event_name === key)?.count || 0;

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
                <p className="text-sm text-muted-foreground">Analyse du parcours utilisateur (7 jours)</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Utilisateurs</span>
                    </div>
                    <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Aujourd'hui</span>
                    </div>
                    <p className="text-3xl font-bold">{stats?.readingsToday || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Cette semaine</span>
                    </div>
                    <p className="text-3xl font-bold">{stats?.readingsThisWeek || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Email Leads</span>
                    </div>
                    <p className="text-3xl font-bold">{stats?.emailLeads || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Event Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Funnel Événements (7 jours)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {FUNNEL_EVENTS.map((event, index) => {
                    const count = getEventCount(event.key);
                    const percentage = maxEventCount > 0 ? (count / maxEventCount) * 100 : 0;
                    const Icon = event.icon;
                    
                    // Calculate drop-off from previous step
                    const prevCount = index > 0 ? getEventCount(FUNNEL_EVENTS[index - 1].key) : count;
                    const dropOff = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;
                    
                    return (
                      <div key={event.key} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{event.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {index > 0 && dropOff > 0 && (
                              <span className="text-xs text-orange-500">-{dropOff}%</span>
                            )}
                            <span className="font-medium tabular-nums">{count.toLocaleString()}</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* User Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Entonnoir Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilisateurs inscrits</span>
                      <span className="font-medium">{stats?.totalUsers || 0}</span>
                    </div>
                    <Progress value={100} className="h-3" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ont fait un tirage</span>
                      <span className="font-medium">
                        {stats?.usersWithReadings || 0} ({conversionRate}%)
                      </span>
                    </div>
                    <Progress value={conversionRate} className="h-3" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ont fait plusieurs tirages</span>
                      <span className="font-medium">
                        {stats?.usersWithMultipleReadings || 0} ({retentionRate}%)
                      </span>
                    </div>
                    <Progress value={retentionRate} className="h-3" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Leads email collectés</span>
                      <span className="font-medium">
                        {stats?.emailLeads || 0} ({stats?.emailLeadsVerified || 0} vérifiés)
                      </span>
                    </div>
                    <Progress 
                      value={(stats?.totalUsers || 0) > 0 ? ((stats?.emailLeads || 0) / (stats?.totalUsers || 1)) * 100 : 0} 
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
                    <p className="text-4xl font-bold text-primary">{stats?.averageReadingsPerUser || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      tirages par utilisateur actif
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
