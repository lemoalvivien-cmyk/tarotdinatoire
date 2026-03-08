# TarotDinatoire — Architecture & Security Reference

> Version: 4.0 · Date: 2026-03-08 · Auteur: Architecte Système Senior / SecOps
>
> **VÉRITÉ D'ÉTAT** : Ce document reflète uniquement ce qui est réellement dans le repo.
> Toute mention de "⚠ STUB" est intentionnelle, vérifiable et isolée.
> Aucun item marqué "✅" n'est un stub ou un mock.

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
| `/admin/agent-jobs` | **AUTOMATION** | ✅ Production |
| `/spreads`, `/cards`, `/share/:id` | CORE/PUBLIC | ✅ Production |
| `/legal/*`, `/status`, `/disclaimer` | LEGAL | ✅ Production |

### 1.2 Edge Functions

| Fonction | Domaine | CORS | Statut |
|---|---|---|---|
| `tarot-interpretation` | CORE | ✅ Allowlist | ✅ Production |
| `daily-draw` | CORE | ✅ Allowlist | ✅ Production |
| `card-insight` | CORE | ✅ Allowlist | ✅ Production |
| `narrative-engine` | CORE | ✅ Allowlist | ✅ Production |
| `psychological-reflection` | CORE | ✅ Allowlist | ✅ Production |
| `synchronicity-engine` | CORE | ✅ Allowlist | ✅ Production |
| `tarot-tts` | CORE | ✅ Allowlist | ✅ Production |
| `og-share` | CORE | ✅ Allowlist | ✅ Production |
| `public-config` | CORE | ✅ Allowlist | ✅ Production |
| `check-subscription` | BILLING | ✅ Allowlist | ✅ Production |
| `create-checkout` | BILLING | ✅ Allowlist | ✅ Production |
| `customer-portal` | BILLING | ✅ Allowlist | ✅ Production |
| `stripe-webhook` | BILLING | ✅ Server-to-server | ✅ Production |
| `unsubscribe` | BILLING | ✅ Allowlist | ✅ Production |
| `bootstrap-admin` | ADMIN | ✅ Allowlist | ✅ One-shot |
| **`agent-dispatcher`** | **AUTOMATION** | ✅ Allowlist | ✅ Production |
| **`agent-worker`** | **AUTOMATION** | N/A (no browser) | ✅ **Fail-closed** |

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
| **`agent_jobs`** | **AUTOMATION** | ✅ **Admin-only, no DELETE** | Idempotency scoped par (created_by, key) |

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
| `WORKER_SECRET` | Worker auth | **Obligatoire. Absent → 500 immédiat.** |
| `OPENCLAW_API_URL` | OpenClaw API | **Never frontend. Absent → mode stub.** |
| `OPENCLAW_API_KEY` | OpenClaw API | **Never frontend. Absent → mode stub.** |
| `VITE_SUPABASE_URL` | Frontend | ✅ Public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend | ✅ Public (anon) |

---

## BLOC 2 · ARCHITECTURE CIBLE — 5 DOMAINES

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
                 │ stripe-webhook           │ ┌──────────────────────────────┐
                 │ check-subscription       │ │      AUTOMATION domain       │
                 │ create-checkout          │ │                              │
                 │ customer-portal          │ │  agent-dispatcher (JWT+RBAC) │
                 │ subscriptions            │ │  agent_jobs (DB)             │
                 │ promo_codes              │ │  agent-worker (WORKER_SECRET)│
                 └──────────────────────────┘ │                              │
                                              │  ⚠ JAMAIS Frontend→OpenClaw │
                                              │  ⚠ JAMAIS Worker sans secret │
                                              └──────────────────────────────┘
```

### Flux critiques

**Lecture IA** : `Frontend → Edge Function → AI Gateway → DB`
Jamais : `Frontend → AI Gateway` directement.

**Abonnement** : `Frontend → create-checkout → Stripe → stripe-webhook → subscriptions`

**Agent job** :
```
Admin UI → agent-dispatcher (JWT + RBAC check) → agent_jobs (DB, status=pending)
                                                          ↓
                              agent-worker (WORKER_SECRET) → claim atomique
                                                          ↓
                                              OpenClawJobExecutor
                                              (adapter pattern, stubs isolés)
                                                          ↓
                                              complete_agent_job (service_role)
```
Jamais : `Frontend → OpenClaw` directement.
Jamais : `Worker sans WORKER_SECRET configuré`.

---

## BLOC 3 · INTÉGRATION OPENCLAW — ÉTAT RÉEL

### Couche d'abstraction (agent-worker/index.ts)

```
OpenClawClient
  ├── isConnected: boolean (OPENCLAW_API_URL && OPENCLAW_API_KEY présents)
  ├── mode RÉEL   → fetch(`${OPENCLAW_API_URL}/v1/actions/${action}`, ...)
  └── mode STUB   → { _stub: true, action, context_keys, note }

OpenClawJobExecutor
  ├── execute(job) → dispatch vers handler par job_type
  ├── runUiQaCheck()          → OpenClawClient.execute("ui_qa_check", ...)
  ├── runContentSynthesis()   → OpenClawClient.execute("content_synthesis", ...)
  ├── runDataVerification()   → DB query directe (aucune API externe)
  ├── runAdminAssistReview()  → OpenClawClient.execute("admin_assist_review", ...)
  └── runSecurityDriftCheck() → OpenClawClient.execute("security_drift_check", ...)
```

### État réel par job_type

| job_type | Implémentation | Statut | Activation |
|---|---|---|---|
| `ui_qa_check` | OpenClawClient.execute | ⚠ **STUB** | Configurer `OPENCLAW_API_URL` + `OPENCLAW_API_KEY` |
| `content_synthesis` | OpenClawClient.execute | ⚠ **STUB** | Configurer `OPENCLAW_API_URL` + `OPENCLAW_API_KEY` |
| `data_verification` | DB query agent_jobs stats | ✅ **RÉEL** | Aucune dépendance externe |
| `admin_assist_review` | OpenClawClient.execute | ⚠ **STUB** | Configurer `OPENCLAW_API_URL` + `OPENCLAW_API_KEY` |
| `security_drift_check` | OpenClawClient.execute | ⚠ **STUB** (max_attempts=1) | Configurer `OPENCLAW_API_URL` + `OPENCLAW_API_KEY` |

> **Note importante** : Un result contenant `_stub: true` indique que l'OpenClaw API n'est pas configurée.
> Ce champ est présent dans le résultat stocké en DB (`agent_jobs.result`) pour traçabilité.
> Pour basculer en mode réel : configurer les deux secrets `OPENCLAW_API_URL` et `OPENCLAW_API_KEY`.

### Sécurité worker (FAIL-CLOSED)

```
Invocation agent-worker
         │
         ▼
  WORKER_SECRET configuré ?
         │
     Non → 500 "Worker not configured"  ← FAIL-CLOSED, AUCUN mode dev ouvert
         │
     Oui ▼
  x-worker-secret header correct ?
         │
     Non → 401 "Unauthorized"
         │
     Oui ▼
  Claim atomique (FOR UPDATE SKIP LOCKED)
         │
         ▼
  Execute job → complete_agent_job
```

### Idempotency

```
Index UNIQUE PARTIEL : (created_by, idempotency_key) WHERE idempotency_key IS NOT NULL

✅ Admin A + key="k1" → job #1 créé
✅ Admin A + key="k1" → 200 deduplicated (même admin, même clé)
✅ Admin B + key="k1" → job #2 créé (admin différent → pas de collision)
✅ Admin A + key="k2" → job #3 créé (clé différente)
```

**Raison du changement** : l'ancienne contrainte globale sur `idempotency_key` empêchait deux admins différents d'utiliser la même clé. La contrainte partielle scopée par `created_by` est sémantiquement correcte.

### Timeouts et retries

| Job Type | Timeout | Max Retries | Politique |
|---|---|---|---|
| `ui_qa_check` | 30s | 2 | Retry sur failure, pas sur timeout |
| `content_synthesis` | 90s | 3 | Retry sur failure, pas sur timeout |
| `data_verification` | 60s | 3 | Retry sur failure, pas sur timeout |
| `admin_assist_review` | 45s | 2 | Retry sur failure, pas sur timeout |
| `security_drift_check` | 120s | **1** | **Fail-closed, aucun retry** |

---

## BLOC 4 · ZERO TRUST — RBAC

### Matrice d'accès tables

| Table / Ressource | anon | authenticated (user) | admin | service_role |
|---|---|---|---|---|
| `profiles` | ❌ | SELECT/UPDATE/DELETE own | SELECT all | ALL |
| `user_roles` | ❌ | SELECT own | ALL | ALL |
| `subscriptions` | ❌ | SELECT/UPDATE own | SELECT/UPDATE all | ALL |
| `tarot_cards` | SELECT | SELECT | ALL | ALL |
| `tarot_spreads` | SELECT | SELECT | ALL | ALL |
| `reading_sessions` | ❌ | SELECT/INSERT(credit)/DELETE own | ❌ | ALL |
| `reading_results` | ❌ | SELECT/INSERT via session | ❌ | ALL |
| `tarot_readings` | ❌ | SELECT/INSERT(credit)/UPDATE/DELETE own | SELECT all | ALL |
| `daily_draws` | ❌ | ALL own | SELECT all | ALL |
| `narrative_memories` | ❌ | SELECT/DELETE own — **NO INSERT/UPDATE** | SELECT all | ALL |
| `synchronicity_insights` | ❌ | ALL own | ❌ | ALL |
| `user_karma` | ❌ | SELECT/UPDATE/DELETE own | SELECT all | ALL |
| `user_achievements` | ❌ | SELECT/INSERT/DELETE own — **NO UPDATE** | SELECT all | ALL |
| `ai_usage_daily` | ❌ | SELECT own — **NO INSERT/UPDATE/DELETE** | SELECT all | ALL |
| `email_leads` | INSERT(consent=true) | SELECT/UPDATE/DELETE own | SELECT/UPDATE all | ALL |
| `shared_readings` | SELECT(not expired) | INSERT/DELETE own | ❌ | ALL |
| `consent_logs` | INSERT(user_id=null) | SELECT/INSERT/DELETE own | SELECT all | ALL |
| `analytics_events` | INSERT(allowlist) | SELECT/INSERT(allowlist)/DELETE own | SELECT all | ALL |
| `feature_flags` | ❌ | ❌ | SELECT/UPDATE | ALL |
| `ai_prompt_templates` | ❌ | ❌ | ALL | ALL |
| `promo_codes` | ❌ | ❌ | ALL | ALL |
| `admin_audit_logs` | ❌ | ❌ | SELECT/INSERT — **NO DELETE/UPDATE** | ALL |
| **`agent_jobs`** | ❌ | ❌ | SELECT/INSERT/UPDATE — **NO DELETE** | ALL |

### Fonctions RPC SECURITY DEFINER — Matrice GRANT/REVOKE

> Migrations exécutées :
> - `fix_grant_revoke_rpc_and_complete_agent_job` (2026-03-08)
> - `idempotency_scoped_by_created_by` (2026-03-08)

| Fonction | PUBLIC | anon | authenticated | service_role | Notes |
|---|---|---|---|---|---|
| `has_role(_user_id, _role)` | REVOKE | REVOKE | REVOKE | GRANT | Base RBAC |
| `is_admin(_user_id)` | REVOKE | REVOKE | REVOKE | GRANT | Appels internes RLS |
| `can_dispatch_agent_job(_user_id)` | REVOKE | REVOKE | **REVOKE** | **GRANT** | ⚠ Dispatcher uniquement |
| `has_reading_credits(uid)` | REVOKE | REVOKE | REVOKE | GRANT | Paywall |
| `decrement_reading_credit(uid)` | REVOKE | REVOKE | REVOKE | GRANT | Atomic debit |
| `award_karma(p_uid, p_action)` | REVOKE | REVOKE | REVOKE | GRANT | XP accumulation |
| `get_email_leads_admin_safe()` | REVOKE | REVOKE | REVOKE | GRANT | Masque tokens |
| `get_my_subscription()` | REVOKE | REVOKE | REVOKE | GRANT | Masque stripe IDs |
| `get_pending_agent_jobs(limit)` | REVOKE | REVOKE | **REVOKE** | **GRANT** | ⚠ Worker uniquement |
| `bootstrap_first_admin(email)` | REVOKE | REVOKE | **REVOKE** | **GRANT** | ⚠ One-shot, EF only |
| `claim_next_agent_job(limit)` | REVOKE | REVOKE | **REVOKE** | **GRANT** | ⚠ Worker uniquement, atomique |
| `complete_agent_job(...)` | REVOKE | REVOKE | **REVOKE** | **GRANT** | ⚠ Worker uniquement |

> ⚠ = Fonctions critiques dont la restriction `authenticated` est non-évidente et expressément vérifiée par les tests RBAC-01 à RBAC-04.

### Fail-closed confirmé

- `agent_jobs` : DELETE policy `USING (false)` — immutable ✅
- `admin_audit_logs` : DELETE/UPDATE `USING (false)` — immutable ✅
- `ai_usage_daily` : INSERT/UPDATE/DELETE bloqués pour users ✅
- `narrative_memories` : pas d'INSERT/UPDATE frontend ✅
- `agent-worker` : WORKER_SECRET absent → 500 immédiat ✅

---

## BLOC 5 · TESTS DE NON-RÉGRESSION

### Suite complète — agent-worker/index_test.ts

| Test ID | Description | Attendu | Prérequis |
|---|---|---|---|
| W-FC-01 | GET method | 405 | Aucun |
| W-FC-02 | Sans x-worker-secret | 401 ou 500 | Aucun |
| W-FC-03 | Mauvais secret | 401 ou 500 | Aucun |
| W-FC-04 | Bon secret, queue vide | 200 | WORKER_SECRET |
| RBAC-01 | authenticated → bootstrap_first_admin | ≠ 200 | TEST_ADMIN_JWT |
| RBAC-02 | authenticated → get_pending_agent_jobs | ≠ 200 | TEST_ADMIN_JWT |
| RBAC-03 | authenticated → can_dispatch_agent_job | ≠ 200 | TEST_ADMIN_JWT |
| RBAC-04 | authenticated → claim_next_agent_job | ≠ 200 | TEST_ADMIN_JWT |
| RBAC-05 | service_role → get_pending_agent_jobs | 200 | SERVICE_KEY |
| RBAC-06 | service_role → can_dispatch_agent_job | 200 | SERVICE_KEY |
| HAPPY-01 | Admin dispatch valide | 201 + job.id | TEST_ADMIN_JWT |
| HAPPY-02 | job_type invalide | 400 + allowed | TEST_ADMIN_JWT |
| HAPPY-03 | priority hors range | 400 | TEST_ADMIN_JWT |
| IDEM-01 | Même (admin, clé) → dédupliqué | 200 + deduplicated | TEST_ADMIN_JWT |
| IDEM-02 | Clés différentes → 2 jobs | 2x 201, IDs distincts | TEST_ADMIN_JWT |
| STATE-01 | claim → job running | status=running | SERVICE_KEY + TEST_ADMIN_JWT |
| STATE-02 | complete running → true | true | SERVICE_KEY + TEST_ADMIN_JWT |
| STATE-03 | complete non-running → false | false | SERVICE_KEY + TEST_ADMIN_JWT |
| STATE-04 | worker execute job | 200, status terminal | WORKER_SECRET + TEST_ADMIN_JWT |
| CONC-01 | 3 claims, 1 job → 1 seul claim | claimedOurJob ≤ 1 | SERVICE_KEY + TEST_ADMIN_JWT |
| CONC-02 | N jobs, N claims → 0 doublons | uniqueIds.size = N | SERVICE_KEY + TEST_ADMIN_JWT |

### Suite complète — agent-dispatcher/index_test.ts

| Test ID | Description | Attendu |
|---|---|---|
| ZT-01 | Pas de header Auth | 401 |
| ZT-02 | JWT invalide | 401 |
| ZT-03 | OPTIONS preflight | 200 + CORS headers |
| ZT-04 | Origine non listée | ACAO ≠ `*` et ≠ evil |
| ZT-05 | job_type injection | Jamais 201 |
| ZT-06 | Méthode GET | 405 |
| ZT-07 | Payload > 10 KB | Jamais 201 |
| ZT-08 | Origine de confiance | ACAO = origine exacte |
| RBAC-01 | Non-admin → jamais 201 | 401 ou 403 |
| HAPPY-01 | Admin dispatch valide | 201 + job.id |
| HAPPY-02 | job_type invalide | 400 + allowed list |
| HAPPY-03 | priority hors range | 400 |
| IDEM-01 | Même clé → 1 seul job | 200 deduplicated |
| IDEM-02 | Clés différentes → 2 jobs | 2x 201, IDs distincts |

---

## BLOC 6 · LIVRABLES

### Arborescence réelle (vérifiée fichier par fichier)

```
src/
├── hooks/
│   └── useAgentJobs.ts          ✅ Existe
├── pages/
│   └── admin/
│       └── AdminAgentJobs.tsx   ✅ Existe
supabase/
├── functions/
│   ├── agent-dispatcher/
│   │   ├── index.ts             ✅ CORS allowlist, RBAC, idempotency scoped
│   │   └── index_test.ts        ✅ 14 tests: ZT + RBAC + HAPPY + IDEM
│   ├── agent-worker/
│   │   ├── index.ts             ✅ FAIL-CLOSED, OpenClawJobExecutor, stubs isolés
│   │   └── index_test.ts        ✅ 20 tests: FC + RBAC + HAPPY + IDEM + STATE + CONC
│   └── [16 autres fonctions CORS hardened]
ARCHITECTURE.md                  ← CE FICHIER v4.0
```

### Migrations SQL exécutées et confirmées

1. `create_agent_jobs_table` — table, enums, index, RLS, triggers ✅
2. `fix_shared_readings_rls` — correction USING(true) permissif ✅
3. `fix_grant_revoke_rpc_and_complete_agent_job` — REVOKE/GRANT service_role + ROW_COUNT fix ✅
4. `idempotency_scoped_by_created_by` — index unique partiel (created_by, idempotency_key) WHERE NOT NULL ✅

### Plan de déploiement

| Étape | Action | Statut |
|---|---|---|
| 1 | Migration `agent_jobs` | ✅ Exécutée |
| 2 | Fix RLS `shared_readings` | ✅ Exécutée |
| 3 | CORS hardening 16 fonctions | ✅ Exécutée |
| 4 | Deploy `agent-dispatcher` | ✅ Deployée |
| 5 | Admin UI `/admin/agent-jobs` | ✅ Existante |
| 6 | GRANT/REVOKE RPC + complete_agent_job fix | ✅ Exécutée |
| 7 | Deploy `agent-worker` fail-closed | ✅ Deployée |
| 8 | Idempotency scoped par (created_by, key) | ✅ Exécutée |
| 9 | Configurer `WORKER_SECRET` | 🔲 **Requis avant toute invocation** |
| 10 | Brancher OpenClaw API réelle | 🔲 Requiert OPENCLAW_API_URL + OPENCLAW_API_KEY |
| 11 | Configurer cron scheduler | 🔲 À faire |

---

## Risques résiduels

| ID | Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|---|
| R1 | `WORKER_SECRET` non configuré → worker inopérant | Élevé (nouveau déploiement) | Fort | Configurer le secret avant la première invocation. Le 500 explicite signale l'absence. |
| R2 | Handlers OpenClaw sont des stubs (OPENCLAW_API_URL non configuré) | Élevé | Moyen | Configurer OPENCLAW_API_URL + OPENCLAW_API_KEY. `_stub:true` dans result signale l'état. |
| R3 | Worker non déclenché automatiquement (pas de cron configuré) | Élevé | Moyen | Configurer un scheduler Supabase ou cron externe. |
| R4 | Tests HAPPY/STATE/CONC nécessitent TEST_ADMIN_JWT non versionné | Faible | Faible | Documenter dans README pour CI. Tests skippés proprement si absent. |
| R5 | Pas d'alerting sur jobs `failed/timeout` | Moyen | Moyen | Ajouter webhook Discord/Slack sur status change. |
| R6 | Refresh tokens non révoqués sur logout multi-device | Moyen | Moyen | Implémenter `signOut({ scope: 'global' })`. |
| R7 | `bootstrap-admin` accessible si flag non consommé | Faible | Fort | Vérifier `admin_bootstrap_used = true` en production. |
