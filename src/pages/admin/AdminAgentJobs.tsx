import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import {
  useAgentJobs,
  useDispatchJob,
  useCancelJob,
  AgentJobType,
  AgentJobStatus,
  JOB_TYPE_META,
} from '@/hooks/useAgentJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  Play,
  X,
  RefreshCw,
  ShieldCheck,
  Layers,
  Database,
  Search,
  Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

// ── Status badge config ──────────────────────────────────────
const STATUS_CONFIG: Record<AgentJobStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  pending:   { label: 'En attente', variant: 'outline',     color: 'text-muted-foreground' },
  running:   { label: 'En cours',   variant: 'default',     color: 'text-primary' },
  completed: { label: 'Terminé',    variant: 'secondary',   color: 'text-success' },
  failed:    { label: 'Échec',      variant: 'destructive', color: 'text-destructive' },
  timeout:   { label: 'Timeout',    variant: 'destructive', color: 'text-warning' },
  cancelled: { label: 'Annulé',     variant: 'outline',     color: 'text-muted-foreground' },
};

// ── Job type icon map ────────────────────────────────────────
const JOB_ICONS: Record<AgentJobType, React.ReactNode> = {
  ui_qa_check:          <Eye className="h-3.5 w-3.5" />,
  content_synthesis:    <Layers className="h-3.5 w-3.5" />,
  data_verification:    <Database className="h-3.5 w-3.5" />,
  admin_assist_review:  <Search className="h-3.5 w-3.5" />,
  security_drift_check: <ShieldCheck className="h-3.5 w-3.5" />,
};

// ── Dispatch panel ───────────────────────────────────────────
function DispatchPanel() {
  const [selectedType, setSelectedType] = useState<AgentJobType>('ui_qa_check');
  const [priority, setPriority] = useState<string>('5');
  const { mutate: dispatch, isPending } = useDispatchJob();

  const handleDispatch = () => {
    dispatch({
      job_type: selectedType,
      priority: Number(priority),
      payload: { triggered_from: 'admin_dashboard', timestamp: new Date().toISOString() },
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4 text-primary" />
          Dispatcher un job
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Type de job
            </label>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as AgentJobType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(JOB_TYPE_META).map(([type, meta]) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      {JOB_ICONS[type as AgentJobType]}
                      {meta.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {JOB_TYPE_META[selectedType].description}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Priorité (1–10)
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 7, 10].map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p === 1 ? `${p} — Critique` : p === 10 ? `${p} — Basse` : String(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleDispatch}
          disabled={isPending}
          className="w-full sm:w-auto"
          size="sm"
        >
          {isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {isPending ? 'Dispatch en cours…' : 'Dispatcher'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Job list ─────────────────────────────────────────────────
export default function AdminAgentJobs() {
  const [statusFilter, setStatusFilter] = useState<AgentJobStatus | 'all'>('all');
  const [typeFilter, setTypeFilter]     = useState<AgentJobType | 'all'>('all');

  const { data: jobs, isLoading, refetch, isFetching } = useAgentJobs({
    status:   statusFilter !== 'all' ? statusFilter : undefined,
    job_type: typeFilter   !== 'all' ? typeFilter   : undefined,
  });

  const { mutate: cancel } = useCancelJob();

  const pendingCount  = jobs?.filter(j => j.status === 'pending').length  ?? 0;
  const runningCount  = jobs?.filter(j => j.status === 'running').length  ?? 0;
  const failedCount   = jobs?.filter(j => j.status === 'failed' || j.status === 'timeout').length ?? 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold">Agent Jobs</h1>
                <p className="text-muted-foreground text-sm">
                  File de jobs async OpenClaw — Zero Trust
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* KPI bar */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">En attente</p>
                <p className="text-2xl font-serif font-semibold">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">En cours</p>
                <p className="text-2xl font-serif font-semibold text-primary">{runningCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Échecs</p>
                <p className="text-2xl font-serif font-semibold text-destructive">{failedCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Dispatch panel */}
          <DispatchPanel />

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AgentJobStatus | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([s, c]) => (
                  <SelectItem key={s} value={s}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as AgentJobType | 'all')}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(JOB_TYPE_META).map(([t, m]) => (
                  <SelectItem key={t} value={t}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job list */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : !jobs?.length ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun job pour le moment</p>
                  <p className="text-xs mt-1">Dispatchez un job via le panneau ci-dessus.</p>
                </div>
              ) : (
                <motion.ul
                  variants={staggerContainer(0.05)}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-border"
                >
                  {jobs.map((job) => {
                    const statusCfg = STATUS_CONFIG[job.status];
                    const meta = JOB_TYPE_META[job.job_type];
                    return (
                      <motion.li
                        key={job.id}
                        variants={staggerItem}
                        className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            {JOB_ICONS[job.job_type]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{meta.label}</span>
                              <Badge variant={statusCfg.variant} className="text-xs shrink-0">
                                {statusCfg.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              ID {job.id.slice(0, 8)}… · Priorité {job.priority} ·{' '}
                              Tentative {job.attempt_count}/{job.max_attempts} ·{' '}
                              {new Date(job.created_at).toLocaleString('fr-FR', {
                                day: 'numeric', month: 'short',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                            {job.error_message && (
                              <p className="text-xs text-destructive mt-0.5 truncate max-w-xs">
                                {job.error_message}
                              </p>
                            )}
                          </div>
                        </div>

                        {job.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancel(job.id)}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
