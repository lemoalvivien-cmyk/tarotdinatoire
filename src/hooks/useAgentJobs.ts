import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk } from '@/queries/queryConfig';

// ══════════════════════════════════════════════════════════════
// Types — mirror the agent_job_type / agent_job_status enums
// ══════════════════════════════════════════════════════════════
export type AgentJobType =
  | 'ui_qa_check'
  | 'content_synthesis'
  | 'data_verification'
  | 'admin_assist_review'
  | 'security_drift_check';

export type AgentJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'cancelled';

export interface AgentJob {
  id: string;
  created_by: string;
  job_type: AgentJobType;
  status: AgentJobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  attempt_count: number;
  max_attempts: number;
  timeout_seconds: number;
  priority: number;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string;
}

export interface DispatchJobInput {
  job_type: AgentJobType;
  payload?: Record<string, unknown>;
  priority?: number;
  idempotency_key?: string;
}

// ══════════════════════════════════════════════════════════════
// JOB_TYPE metadata — label + description for UI
// ══════════════════════════════════════════════════════════════
export const JOB_TYPE_META: Record<AgentJobType, { label: string; description: string }> = {
  ui_qa_check: {
    label: 'QA Interface',
    description: 'Vérifie la cohérence visuelle et fonctionnelle de l\'UI.',
  },
  content_synthesis: {
    label: 'Synthèse de contenu',
    description: 'Agrège et résume des données d\'interprétation.',
  },
  data_verification: {
    label: 'Vérification de données',
    description: 'Contrôle l\'intégrité des cartes et sessions.',
  },
  admin_assist_review: {
    label: 'Revue admin',
    description: 'Analyse les actions admin et propose des recommandations.',
  },
  security_drift_check: {
    label: 'Contrôle sécurité',
    description: 'Détecte les dérives de configuration RLS et CORS.',
  },
};

// ══════════════════════════════════════════════════════════════
// useAgentJobs — fetch all jobs (admin only)
// ══════════════════════════════════════════════════════════════
export function useAgentJobs(filters?: { status?: AgentJobStatus; job_type?: AgentJobType }) {
  return useQuery({
    queryKey: ['agent-jobs', filters],
    queryFn: async (): Promise<AgentJob[]> => {
      let query = supabase
        .from('agent_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.job_type) query = query.eq('job_type', filters.job_type);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AgentJob[];
    },
    staleTime: 10_000,
    refetchInterval: 15_000, // live polling for running jobs
    retry: false,
  });
}

// ══════════════════════════════════════════════════════════════
// useDispatchJob — POST to agent-dispatcher edge function
// ══════════════════════════════════════════════════════════════
export function useDispatchJob() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (input: DispatchJobInput) => {
      const { data, error } = await supabase.functions.invoke('agent-dispatcher', {
        method: 'POST',
        body: input,
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (error) throw error;
      return data as { success: boolean; job: Pick<AgentJob, 'id' | 'status' | 'job_type' | 'created_at'> };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agent-jobs'] });
      const meta = JOB_TYPE_META[data.job.job_type];
      toast.success(`Job dispatché : ${meta?.label ?? data.job.job_type}`, {
        description: `ID : ${data.job.id.slice(0, 8)}…`,
      });
    },
    onError: (err) => {
      toast.error('Impossible de créer le job', {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    },
  });
}

// ══════════════════════════════════════════════════════════════
// useCancelJob — UPDATE status → 'cancelled'
// ══════════════════════════════════════════════════════════════
export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('agent_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId)
        .eq('status', 'pending'); // only cancel pending jobs

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-jobs'] });
      toast.success('Job annulé');
    },
    onError: (err) => {
      toast.error('Échec annulation', {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    },
  });
}
