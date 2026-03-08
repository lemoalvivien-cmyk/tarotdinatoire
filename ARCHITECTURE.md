# TarotDinatoire — Architecture & Security Reference

> Version: 2.0 · Date: 2026-03-08 · Auteur: Architecte Système Senior / SecOps

---

## BLOC 1 · INVENTAIRE COMPLET

### 1.1 Pages frontend

| Route | Domaine | Statut |
|---|---|---|
| `/` | CORE | ✅ Production |
| `/auth` | AUTH | ✅ Production |
| `/app/dashboard` | CORE | ✅ Production |
| `/app/daily-ritual` | CORE | ✅ Production |
| `/app/new-reading` | CORE | ✅ Production |
| `/app/history` | CORE | ✅ Production |
| `/app/favorites` | CORE | ✅ Production |
| `/app/profile` | AUTH/CORE | ✅ Production |
| `/app/journey` | CORE | ✅ Production |
| `/app/onboarding` | AUTH | ✅ Production |
| `/app/reading/:id` | CORE | ✅ Production |
| `/app/diagnostic` | CORE/ADMIN | ✅ Production |
| `/admin` | ADMIN | ✅ Production |
| `/admin/flags` | ADMIN | ✅ Production |
| `/admin/prompts` | ADMIN | ✅ Production |
| `/admin/audit-logs` | ADMIN | ✅ Production |
| `/admin/edge-test` | ADMIN | ✅ Production |
| `/admin/card-assets` | ADMIN | ✅ Production |
| `/admin/spreads` | ADMIN | ✅ Production |
| `/admin/leads` | ADMIN | ✅ Production |
| `/admin/stats` | ADMIN | ✅ Production |
| `/admin/prod-check` | ADMIN | ✅ Production |
| `/admin/import-deck` | ADMIN | ✅ Production |
| `/admin/agent-jobs` | **AUTOMATION** | ✅ **Nouveau** |
| `/spreads`, `/cards`, `/share/:id` | CORE/PUBLIC | ✅ Production |
| `/legal/*`, `/status`, `/disclaimer` | LEGAL | ✅ Production |

### 1.2 Edge Functions

| Fonction | Domaine | CORS | Statut | Vérifié |
|---|---|---|---|---|
| `tarot-interpretation` | CORE | ✅ Allowlist | ✅ Production | ✅ Lu |
| `daily-draw` | CORE | ✅ Allowlist | ✅ Production | ✅ Lu |
| `card-insight` | CORE | ✅ Allowlist | ✅ Production | ✅ Lu |
| `narrative-engine` | CORE | ✅ Allowlist | ✅ Production | ✅ Lu |
| `psychological-reflection` | CORE | ✅ Allowlist | ✅ Production | ✅ Lu |
| `synchronicity-engine` | CORE | ✅ Allowlist | ✅ Production | ✅ Lu |
| `tarot-tts` | CORE | ✅ Allowlist (corrigé 2026-03-08) | ✅ Production | ✅ Lu |
| `og-share` | CORE | ✅ Allowlist (corrigé 2026-03-08) | ✅ Production | ✅ Lu |
| `public-config` | CORE | ✅ Allowlist (corrigé 2026-03-08) | ✅ Production | ✅ Lu |
| `check-subscription` | BILLING | ✅ Allowlist + bug corsHeaders corrigé | ✅ Production | ✅ Lu |
| `create-checkout` | BILLING | ✅ Allowlist | ✅ Production | ✅ Lu |
| `customer-portal` | BILLING | ✅ Allowlist | ✅ Production | ✅ Lu |
| `stripe-webhook` | BILLING | ✅ Server-to-server | ✅ Production | ✅ Lu |
| `unsubscribe` | BILLING | ✅ Allowlist (corrigé 2026-03-08) | ✅ Production | ✅ Lu |
| `bootstrap-admin` | ADMIN | ✅ Allowlist | ✅ One-shot | ✅ Lu |
| **`agent-dispatcher`** | **AUTOMATION** | ✅ Allowlist | ✅ Production | ✅ Lu |

### 1.3 Tables SQL

| Table | Domaine | RLS | Notes |
|---|---|---|---|
| `profiles` | AUTH | ✅ Strict | user-owned |
| `user_roles` | AUTH | ✅ Admin-only writes | RBAC source of truth |
| `subscriptions` | BILLING | ✅ user-owned + admin | No INSERT from frontend |
| `tarot_cards` | CORE | ✅ Public read, admin write | |
| `tarot_spreads` | CORE | ✅ Public read, admin write | |
| `reading_sessions` | CORE | ✅ user-owned, credits check | |
| `reading_results` | CORE | ✅ via session ownership | |
| `tarot_readings` | CORE | ✅ user-owned, credits check | |
| `daily_draws` | CORE | ✅ user-owned | |
| `narrative_memories` | CORE | ✅ user-owned | No INSERT/UPDATE from frontend |
| `synchronicity_insights` | CORE | ✅ user-owned | |
| `user_karma` | CORE | ✅ user-owned | |
| `user_achievements` | CORE | ✅ user-owned | No UPDATE |
| `ai_usage_daily` | CORE | ✅ user-read, service write | |
| `email_leads` | BILLING | ✅ Admin-only read | No tokens exposed |
| `shared_readings` | CORE | ✅ Fixed (no USING true) | |
| `consent_logs` | LEGAL | ✅ Strict | No UPDATE |
| `analytics_events` | CORE | ✅ Allowlisted events | |
| `feature_flags` | ADMIN | ✅ Admin-only | |
| `ai_prompt_templates` | ADMIN | ✅ Admin-only | |
| `promo_codes` | BILLING | ✅ Admin-only | |
| `admin_audit_logs` | ADMIN | ✅ No DELETE/UPDATE | Immutable |
| **`agent_jobs`** | **AUTOMATION** | ✅ **Admin-only, no DELETE** | **Nouveau** |

### 1.4 Variables d'environnement

| Secret | Usage | Exposition |
|---|---|---|
| `SUPABASE_URL` | All functions | Server-side only |
| `SUPABASE_ANON_KEY` | User-facing functions | Public (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations | **Never frontend** |
| `STRIPE_SECRET_KEY` | Billing functions | **Never frontend** |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | **Never frontend** |
| `ADMIN_BOOTSTRAP_TOKEN` | One-shot bootstrap | **Never frontend** |
| `ADMIN_BOOTSTRAP_EMAIL` | One-shot bootstrap | **Never frontend** |
| `LOVABLE_API_KEY` | AI gateway | **Never frontend** |
| `ELEVENLABS_API_KEY` | TTS | **Never frontend** |
| `VITE_SUPABASE_URL` | Frontend | ✅ Public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend | ✅ Public (anon) |

---

## BLOC 2 · REMÉDIATION IMMÉDIATE — DIFFS

### 2.1 CORS wildcard → allowlist

**Avant** (dans `create-checkout`, `check-subscription`, `customer-portal`, `stripe-webhook`, `tarot-interpretation`) :
```typescript
const corsHeaders = { "Access-Control-Allow-Origin": "*", ... };
```

**Après** — appliqué sur toutes les fonctions :
```typescript
const ALLOWED_ORIGINS = [
  "https://tarotdinatoire.lovable.app",
  "https://id-preview--...lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];
function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin : ALLOWED_ORIGINS[0];
  return { "Access-Control-Allow-Origin": allowed, ... };
}
// Dans le handler :
const corsH = buildCorsHeaders(req.headers.get("Origin"));
```

**Justification** : le wildcard `*` avec `Authorization` est bloqué par les navigateurs modernes mais laisse une surface d'exposition sur les appels cross-origin non-credentieled (SSRF, open-relay).

### 2.2 RLS permissive corrigée

**Table** : `shared_readings`  
**Avant** : `USING (true)` sur UPDATE → n'importe qui peut incrémenter les compteurs.  
**Après** : `USING (auth.role() = 'service_role' OR auth.uid() = user_id)`

### 2.3 Logs sensibles

Les `console.log` avec `email` et `userId` dans les fonctions BILLING ont été retenus car nécessaires pour le debugging Stripe, mais aucun token/secret n'est loggué. En production, les logs sont automatiquement filtrés par `esbuild.drop: ['console']`.

---

## BLOC 3 · ARCHITECTURE CIBLE — 5 DOMAINES

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Landing · Auth · App Pages · Admin Pages                   │
└────────────┬──────────┬──────────┬──────────────────────────┘
             │          │          │
    JWT      │   REST   │  REST    │  admin-only
    Auth     │  + RLS   │  Edge    │  REST + JWT
             ▼          ▼          ▼
┌──────────────┐ ┌───────────┐ ┌─────────────────────────────┐
│  AUTH domain │ │   CORE    │ │         ADMIN domain         │
│              │ │  domain   │ │                              │
│ Supabase Auth│ │           │ │ feature_flags                │
│ profiles     │ │ tarot_*   │ │ ai_prompt_templates          │
│ user_roles   │ │ reading_* │ │ admin_audit_logs             │
│              │ │ daily_*   │ │ agent_jobs ◄── AUTOMATION    │
└──────────────┘ │ narrative │ │                              │
                 │ karma     │ └──────────────┬───────────────┘
                 └───────────┘                │
                                              │ Service Role
                 ┌──────────────────────────┐ │  (no JWT)
                 │       BILLING domain     │ │
                 │                          │ ▼
                 │ stripe-webhook           │ ┌──────────────────┐
                 │ check-subscription       │ │ AUTOMATION domain│
                 │ create-checkout          │ │                  │
                 │ customer-portal          │ │ agent-dispatcher │
                 │ subscriptions            │ │ agent_jobs table │
                 │ promo_codes              │ │                  │
                 └──────────────────────────┘ │ ⚠ NO direct     │
                                              │ frontend→OpenClaw│
                                              └──────────────────┘
```

### Flux critiques

**Lecture IA** : `Frontend → tarot-interpretation (Edge) → AI Gateway → DB`  
Jamais : `Frontend → AI Gateway` directement.

**Abonnement** : `Frontend → create-checkout → Stripe → stripe-webhook → subscriptions table`

**Agent job** : `Admin → agent-dispatcher (Edge, JWT+RBAC) → agent_jobs → [futur worker]`  
Jamais : `Frontend → OpenClaw` directement.

---

## BLOC 4 · INTÉGRATION OPENCLAW

### Table `agent_jobs`

```sql
-- Enums stricts (allowlist enforcement au niveau SQL)
CREATE TYPE agent_job_type AS ENUM (
  'ui_qa_check', 'content_synthesis', 'data_verification',
  'admin_assist_review', 'security_drift_check'
);
CREATE TYPE agent_job_status AS ENUM (
  'pending', 'running', 'completed', 'failed', 'timeout', 'cancelled'
);
```

### Timeouts par type

| Job Type | Timeout | Max Retries | Raison |
|---|---|---|---|
| `ui_qa_check` | 30s | 2 | Réponse rapide attendue |
| `content_synthesis` | 90s | 3 | LLM potentiellement lent |
| `data_verification` | 60s | 3 | DB query intensive |
| `admin_assist_review` | 45s | 2 | Analyse partielle OK |
| `security_drift_check` | 120s | **1** | Fail-closed, pas de retry |

### Idempotency

Chaque job accepte une `idempotency_key` (UNIQUE constraint). En cas de doublon → HTTP 200 avec le job existant, pas de création.

---

## BLOC 5 · ZERO TRUST — RBAC

### Matrice d'accès

| Rôle | agent_jobs | tarot_cards | subscriptions | feature_flags | user_roles |
|---|---|---|---|---|---|
| `anon` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `authenticated` | ❌ | SELECT | SELECT own | ❌ | SELECT own |
| `admin` | ALL | ALL | ALL | SELECT/UPDATE | ALL |
| `service_role` | ALL | ALL | ALL | ALL | ALL |

### Tests de non-régression

Fichier : `supabase/functions/agent-dispatcher/index_test.ts`

| Test ID | Description | Attendu |
|---|---|---|
| ZT-01 | Pas de header Auth | 401 |
| ZT-02 | JWT invalide | 401 |
| ZT-03 | OPTIONS preflight | 200 + CORS headers |
| ZT-04 | Origine non listée | ACAO ≠ `*` et ≠ origine attaquant |
| ZT-05 | job_type injection | Jamais 201 |
| ZT-06 | Méthode GET | 405 |
| ZT-07 | Payload > 10 KB | Jamais 201 |
| ZT-08 | Origine de confiance | ACAO = origine exacte |

---

## BLOC 6 · LIVRABLES

### Arborescence cible

```
src/
├── hooks/
│   └── useAgentJobs.ts          ← NEW (AUTOMATION)
├── pages/
│   └── admin/
│       └── AdminAgentJobs.tsx   ← NEW
supabase/
├── functions/
│   ├── agent-dispatcher/        ← NEW (AUTOMATION)
│   │   ├── index.ts
│   │   └── index_test.ts        ← NEW (security tests)
│   ├── tarot-interpretation/    ← CORS hardened
│   ├── create-checkout/         ← CORS hardened
│   ├── check-subscription/      ← CORS hardened
│   ├── customer-portal/         ← CORS hardened
│   └── stripe-webhook/          ← CORS hardened
ARCHITECTURE.md                  ← NEW (ce fichier)
```

### Migrations SQL exécutées

1. `create_agent_jobs_table` — table, enums, index, RLS, triggers
2. `fix_shared_readings_rls` — correction USING(true) permissif

### Edge Functions à garder / supprimer

**Garder** : toutes les fonctions listées en 1.2  
**Supprimer** : aucune à ce stade (pas de doublon identifié)  
**Ajouter** : `agent-dispatcher` ✅ déployé

---

## Plan de déploiement

| Étape | Action | Risque | Rollback |
|---|---|---|---|
| 1 | ✅ Migration `agent_jobs` | Faible (ajout pur) | DROP TABLE agent_jobs |
| 2 | ✅ Fix RLS `shared_readings` | Faible | Remettre USING(true) |
| 3 | ✅ CORS hardening 5 fonctions | Moyen : peut casser appels cross-origin légitimes | Remettre `*` temporairement |
| 4 | ✅ Deploy `agent-dispatcher` | Faible (nouvelle route) | supabase functions delete |
| 5 | ✅ Admin UI `/admin/agent-jobs` | Nul (admin only) | Retirer la route |
| 6 | 🔲 Worker OpenClaw | Fort : à faire en isolation | Flag feature_flag |

---

## Risques résiduels

| ID | Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|---|
| R1 | `bootstrap-admin` toujours accessible si flag non consommé | Faible | Fort | Vérifier `admin_bootstrap_used = true` en production |
| R2 | `tarot-tts` utilise ElevenLabs sans rate-limit côté DB | Moyen | Moyen | Ajouter quota dans `ai_usage_daily` |
| R3 | Jobs `agent_jobs` jamais consommés (pas de worker) | Élevé | Faible | Implémenter worker ou cron dans Bloc 6 étape 6 |
| R4 | `public-config` expose `admin_bootstrap_used` | Faible | Faible | Acceptable : valeur booléenne publique |
| R5 | Refresh tokens non révoqués sur logout multi-device | Moyen | Moyen | Implémenter `signOut({ scope: 'global' })` |
| R6 | Pas d'alerting sur jobs `failed/timeout` | Moyen | Moyen | Ajouter webhook Discord/Slack sur status change |
