# WingApp — Scalability & Platform Enhancements

> **Target**: Support 1 million concurrent users. Current stack is a Node.js monolith on AWS ECS Fargate + RDS Postgres with no caching, no queues, and no rate-limiting. The enhancements below move the platform to a horizontally scalable, event-driven, observable architecture while staying within the current monolithic codebase.

---

## 1. Executive Summary

| Aspect | Today | After Phase 1 | After Phase 2 |
|---|---|---|---|
| Peak throughput | ~1–2K RPS | 10K RPS | 30K+ RPS |
| API p99 latency | 6–8 sec (reservation) | < 600 ms | < 300 ms |
| Cache layer | None | Redis (ElastiCache) | Multi-layer (Redis + CDN + edge) |
| Async jobs | 2 naive cron jobs | BullMQ (Redis-backed) | BullMQ + EventBridge |
| Rate limiting | None | AWS WAF + koa-ratelimit | Adaptive per-user quotas |
| Observability | CloudWatch logs only | Sentry + OpenTelemetry + Grafana | Full APM + business metrics |
| Admin analytics | Hardcoded mock data | Real metrics from materialized views | Data warehouse (Redshift / Athena) |
| Admin access control | Hardcoded email list (2 places) | Role-based (super / finance / ops / support) | RBAC + audit log + impersonation |
| Multi-city support | Miami hardcoded | DB-driven city list | Full multi-region |

**Total effort** — ~1,060 engineering hours ≈ **6 engineer-months**, split across 3 phases over ~4 calendar months with 2-3 parallel engineers.

---

## 2. Why Now — Current Pain Points

1. **Zero caching.** Every API call hits Postgres directly. Hot endpoints like `/profiletype`, `/user`, `/experience/search` rerun the same queries on every request. At 10K concurrent users the DB pool saturates.
2. **Zero rate limiting.** Signup spam, Stripe abuse, Auth0 quota burn, and DDoS are all open surfaces. No protection layer exists between ALB and the application.
3. **Synchronous side-effects.** After a successful reservation the API blocks 5–8 seconds while sending transactional emails, admin emails, and scheduling push notifications inline. SES or Expo slowness directly hurts user-facing latency.
4. **Cron-based notifications.** Scheduled push notifications are delivered via a CloudWatch cron that scans the DB every few minutes — overlapping runs can send duplicate notifications; dead-letter handling is ad-hoc; stale push tokens are never pruned.
5. **Restaurant sync is a brute-force cron.** A 4–8 hour cron re-pulls all Resy venues in Miami every cycle, wasting quota and keeping data stale up to 8 hours. Miami coordinates and 999-venue limit are hardcoded — multi-city and >999 venue cases silently fail.
6. **Admin panel is barely functional.** The dashboard renders hardcoded mock chart data. There is no RBAC, no audit log, no refund UI, no real analytics. The admin whitelist is duplicated in backend env-vars and in frontend source code.
7. **No disaster protections.** No graceful shutdown, no readiness probe, no circuit breaker, no Stripe webhook handler, no idempotency keys, no tracing, no error tracking, no schema tests. A single bad deploy can drop in-flight reservations.
8. **Database is under-engineered.** Connection pool defaults of 2–5. No read replicas. No partitioning on notification / experience_offering which will grow unbounded. Soft-deletes accumulate forever with no archive job.

These are not future problems — several of them (no rate limit, no webhook, no refund path, admin whitelist bug) are **live production risks today**.

---

## 3. Enhancements — Grouped by Theme

### 3.1 Caching Layer — Redis / ElastiCache

Introduce **AWS ElastiCache Redis** as the first shared cache. Used for:

- **Hot API responses** — `/profiletype` (1 hr TTL), `/user` (60 s), `/terms` (5 min), `/experience` (30 s), `/offering/divided` (5 min).
- **Expensive external calls** — Google Geocoding (30 days), Viator destinations (24 hr), Yelp business (12 hr), Resy venue details (per sync cycle).
- **JWKS cache** — shared across Fargate tasks (today each task refetches Auth0 public keys individually).
- **Rate limit counters** — token-bucket per user, per IP, per endpoint.
- **BullMQ broker** — same Redis used as the job queue backend.

> **Expected impact**: 70–80% reduction in DB query volume on hot paths, p99 latency of cached endpoints drops from 80 ms to < 5 ms.

### 3.2 Async Work — BullMQ Queue + Worker Service

Move everything that does not need to block the user to background workers.

| Queue | What it does | Benefit |
|---|---|---|
| `post-booking` | Send booking email, admin email, schedule push notifications | Reservation API returns in < 500 ms instead of 5–8 s |
| `email-out` | All SES email delivery with retry + DLQ | SES outage no longer fails user actions |
| `push-out` | Delayed push notifications (replaces today's cron) | Exactly-once delivery, no duplicates, precise scheduling |
| `stripe-webhooks` | Handle `payment_intent.succeeded`, `charge.refunded`, `charge.dispute.created` | Disputes, refunds, failures are now observed and acted on |
| `refund` | User / admin-initiated refunds (today missing entirely) | Ops can refund from admin UI |
| `cache-invalidate` | Downstream cache clears after mutations | Stale-read free |
| `resy-sync` | Restaurant sync (replaces direct cron) | Retryable, observable, dead-letterable |

A separate **wingapp-worker** ECS service (same Docker image, different CMD) runs the workers. It auto-scales based on queue depth published to CloudWatch.

> **Why BullMQ, not RabbitMQ or SQS?** BullMQ reuses the Redis we are already adding, costs nothing extra, ships with a UI dashboard (Bull Board), and handles our throughput comfortably. RabbitMQ is overkill until we need topic-routing across microservices; SQS becomes attractive only if workers spend most of their time idle (then SQS + Lambda is cheaper). We can migrate later without rewriting the producer API.

### 3.3 Event-Driven Internally (still a monolith)

The monolith stays, but domain events flow through a lightweight in-process bus backed by Redis Pub/Sub + BullMQ. Emit events such as `booking.created`, `experience.reviewed`, `push.failed`, `restaurant.updated` — handlers subscribe without tight coupling. This sets up the codebase for a future microservice split without forcing one today.

Later, when scale demands it, swap the in-process bus for **AWS EventBridge + SNS + SQS** — no producer code changes.

### 3.4 Rate Limiting + DDoS Protection

Three layers:

1. **AWS WAF** on the ALB — generic IP rate-based rules, managed OWASP rules, optional geo block.
2. **`koa-ratelimit`** (Redis-backed) inside the API — per-user, per-endpoint.
   - `/experience/search` — 30 per minute per user
   - `/reservation/transaction` — 5 per minute per user
   - `POST /user` (signup) — 5 per hour per IP
   - Global — 600 req / minute per authenticated user
3. **Auth0 Attack Protection** (already available) — brute-force, credential stuffing.

### 3.5 CDN — CloudFront (already provisioned, underused)

Extend CloudFront to:

- Fronting cacheable API GETs (`/terms`, `/profiletype`, `/redirect`).
- All profile images from S3 (already partially).
- Email template assets.
- Admin UI static build.

Mobile side — switch image rendering to `react-native-fast-image` (or `expo-image`) so on-device memory caching composes with CloudFront edge caching.

### 3.6 Admin Panel — From Prototype to Production

| Area | Today | Proposed |
|---|---|---|
| Auth | Hardcoded email array in frontend + backend env string | Backend `user.role` column (`super / finance / ops / support`); menu and routes guarded by role |
| Dashboard | Mock chart data from a constants file | Real metrics — GMV, commission, bookings-by-day, top hosts, demographics — served from materialized views refreshed every 5 minutes |
| Users | Table only, no search | Search (email / name / phone), status filter, CSV export, force-logout, impersonation |
| Bookings | No filter / no export / no refund | Date / host / status filters, CSV export, refund button wired to `/admin/reservation/:id/refund` |
| Audit | None | `admin_audit` table logging every mutation with actor, target, diff; viewable page |
| Support tools | None | Manual confirm, manual reveal, retry failed reconcile, cohort-based broadcast push |
| Config | Env-only | Feature-flag panel editable at runtime (Wing fee %, cancel threshold, enabled cities) |
| Ops dashboard | None | RDS conns, Redis memory, queue depth, error rate, Stripe webhook status |

### 3.7 Restaurants Job — Smarter Sync Strategy

Resy has no public webhook surface, so a full webhook replacement is not possible. Instead:

1. **Incremental sync** — keep `last_synced_at` per venue, only refresh venues older than 7 days. Cuts Resy API calls by ~95%.
2. **Multi-city** — move Miami coordinates out of code into a `sync_city` DB table, loop over active cities, make radius configurable.
3. **Fix `per_page: 999`** — add pagination loop so larger cities (NYC has 3000+ venues) sync completely.
4. **Internal events** — when a Wing admin edits a restaurant, emit `restaurant.updated` → invalidate Redis cache + push to any mobile users who had bookmarked it.
5. **Parameterize `party_size`** — today it is hardcoded at 2, silently dropping larger-party venues.

### 3.8 Notifications Job — Queue-Replaces-Cron

- Replace the cron-scan-then-send loop with BullMQ **delayed jobs**. When a notification is scheduled, enqueue it with `delay = sendAt - now`; worker picks it exactly once.
- Postgres `notification` row stays for audit, but delivery state is driven by the queue.
- On `DeviceNotRegistered` receipts, prune the stale push token from `user.pushTokens` immediately.
- Cache Google Directions results by `origin|dest|sendAt-bucket` to cut quota and latency.
- Dead-letter queue for notifications that fail after 5 retries; visible in admin UI.

### 3.9 Backend Hardening Baseline

The essentials that are missing today:

- Graceful SIGTERM shutdown (drain in-flight, close pools, exit cleanly).
- `/health` (liveness) + `/ready` (DB + Redis + Stripe reachability).
- `koa-helmet` for security headers (CSP, HSTS, frame deny).
- `koa-compress` for gzip + brotli on large JSON responses.
- Body size limits on `bodyParser`.
- Strict env-var validation at boot (fail fast if misconfigured).
- Structured error tracking via **Sentry** with release + user + trace context.
- OpenTelemetry auto-instrumentation exporting to AWS X-Ray or Managed Grafana Tempo.
- Stripe webhook route with signature verification.
- Idempotency-Key support on `POST /reservation/transaction` and refund endpoints.

### 3.10 Database Scaling

- Raise connection pool to 10–50 per task; add **RDS Proxy** between ECS and RDS to absorb spikes.
- Add **RDS read replica** in a second AZ; route read-only queries to it via a thin Knex middleware.
- Add missing indexes on `experience(user_id, start_time)`, `experience_offering(profile_id, created_at)`, `notification(send_at, deleted_at)`, `offering(type_id, external_id)`, and a GIST index on `location` geo.
- Parallelize `experienceController.getAll` (today it fetches shared + owned experiences sequentially — just needs `Promise.all`).
- Partition the `notification` table by month and `experience_offering` by year; add an archival job for rows older than 2 years.
- Plan a migration baseline / squash — 70+ migration files slow dev setup.

### 3.11 Security / Correctness Fixes Worth Flagging Separately

These are not performance items but real bugs worth calling out to the boss:

1. **Admin check is a substring match.** `ADMINS_EMAILS.includes(profile.email)` — if the env string contains `luke@wingapp.us`, then `luke@wingapp.us.attacker.com` also passes. Needs exact-match fix urgently.
2. **Multi-offering reservation rollback is broken.** In `createReservationWithTransaction`, only the last iteration's Stripe charge is refunded on partial failure; earlier charges leak.
3. **No refund endpoint.** Users and ops cannot trigger refunds through the platform today. All refunds must happen directly in Stripe dashboard, bypassing our DB.
4. **No Stripe webhook handler.** Disputes, chargebacks, and failed captures are invisible to the platform.
5. **Push tokens never pruned.** Devices that have uninstalled the app keep failing forever, wasting Expo quota.
6. **Notification `markAsSent` actually soft-deletes.** Audit trail of what was sent when is lost.

---

## 4. Infrastructure Add-ons (Terraform Repo)

| Resource | Purpose |
|---|---|
| ElastiCache Redis (cluster-mode, 2 shards, replicas, TLS) | Cache + rate-limit + BullMQ broker |
| ECS service `wingapp-worker` | BullMQ consumers, auto-scaled by queue depth |
| AWS WAF on ALB | DDoS + rate-based IP rules |
| RDS Proxy | Connection pooling for ECS bursts |
| RDS read replica | Read offload for `GET` paths |
| OpenSearch (optional, Phase 3) | Advanced catalog search, facets, geo |
| S3 data lake + Kinesis Firehose + Athena | Analytics warehouse for admin dashboards |
| Sentry (SaaS) | Error tracking |
| AWS Managed Grafana + Tempo / X-Ray | Tracing + metrics |
| SSM Session Manager | Replace bastion host (no open SSH port) |
| CodeDeploy blue-green | Zero-downtime API deploys with auto-rollback |

---

## 5. Phased Rollout Plan

### Phase 1 — Stability + Guardrails (4–5 weeks)

**Goal**: Stop the bleeding. Platform survives a load test.

- Provision ElastiCache Redis (terraform).
- Provision ECS worker service (terraform + Dockerfile split).
- Integrate `cached()` wrapper for top 5 hot GETs.
- Add `koa-ratelimit` + AWS WAF on ALB.
- Build BullMQ `post-booking` + `email-out` + `push-out` queues; move synchronous email / push out of the reservation path.
- Fix the admin whitelist substring bug.
- Fix the reservation rollback bug.
- Add `/health` + `/ready`, graceful shutdown.
- Integrate Sentry + OpenTelemetry + correlation IDs.
- Add DB indexes on hot paths.
- Raise DB pool, add RDS Proxy.
- Stripe webhook handler skeleton.

### Phase 2 — Admin + Analytics + Correctness (4–6 weeks)

**Goal**: Make the admin panel production-grade and close correctness gaps.

- Migrate admin auth to `user.role` RBAC; delete hardcoded arrays.
- Replace mock dashboard with real metrics (materialized views).
- Add bookings / users pages: filters, search, CSV export.
- Build refund endpoint + admin UI refund flow.
- Build audit log table + admin UI page.
- Build impersonation flow (time-limited, audited).
- Replace notifications cron with BullMQ delayed jobs; prune stale tokens.
- Implement Stripe webhook event handlers (refund, dispute, failure).
- Idempotency-Key support on mutation endpoints.
- Add configurable feature flags (fee %, cancel hours, enabled cities).

### Phase 3 — Multi-City + Search + Data (6–8 weeks)

**Goal**: Unlock multi-region growth and ML-grade analytics.

- Move restaurant-sync from Miami-hardcoded to DB-driven multi-city.
- Incremental sync with `last_synced_at`; pagination fix.
- OpenSearch catalog (restaurants + activities) for faceted search.
- Data lake (Firehose + Athena or Redshift Serverless) for deep analytics.
- Funnel event tracking via Amplitude / Segment for admin dashboard.
- Table partitioning + archival job for `notification` and `experience_offering`.
- Migrate JWKS cache to shared Redis.
- Blue-green deploys with auto-rollback.
- PostGIS migration (optional).

---

## 6. Risk if We Don't Act

- **Auth0 / Stripe rate-limit pain** during any traffic spike or marketing push, because quotas are shared across all tasks with no protection and no cache.
- **Duplicate charges** when users retry flaky networks — no idempotency.
- **Lost or duplicated push notifications** when cron runs overlap.
- **User-visible 6–8 s freeze** on reservation whenever SES or Expo latencies rise.
- **Silent data loss** when Resy venues exceed 999 in a city or when the job fails partway.
- **No visibility** into disputes or refunds until a chargeback appears on the Stripe statement.
- **Legal / trust risk** from the admin substring-match bug.
- **Migration pain** when we eventually split into microservices without an event bus in place.

---

## 7. Quick Priority Table (for the Excel "Efforts" column)

| # | Theme | Item | Priority |
|---|---|---|---|
| 1 | Caching | Redis (ElastiCache) + `cached()` for hot GETs | P0 |
| 2 | Rate limit | AWS WAF + koa-ratelimit | P0 |
| 3 | Async | BullMQ + worker ECS service | P0 |
| 4 | Correctness | Fix admin substring bug | P0 |
| 5 | Correctness | Fix multi-offering rollback bug | P0 |
| 6 | Payments | Stripe webhook handler | P0 |
| 7 | Payments | Refund endpoint + admin UI | P0 |
| 8 | Hardening | `/health`, `/ready`, graceful shutdown | P0 |
| 9 | Observability | Sentry + OpenTelemetry | P0 |
| 10 | DB | Indexes + RDS Proxy + read replica | P0 |
| 11 | Notifications | BullMQ delayed jobs (replace cron) | P0 |
| 12 | Notifications | Prune stale push tokens | P0 |
| 13 | Admin | RBAC (user.role) + remove hardcoded lists | P0 |
| 14 | Admin | Real metrics dashboard | P0 |
| 15 | Admin | Refund UI + audit log | P0 |
| 16 | Restaurants | Multi-city DB-driven sync | P1 |
| 17 | Restaurants | Incremental sync + pagination fix | P1 |
| 18 | Events | Redis pub/sub domain event bus | P1 |
| 19 | CDN | CloudFront in front of cacheable APIs | P1 |
| 20 | Admin | Impersonation, feature flags, ops dashboard | P1 |
| 21 | Search | OpenSearch + faceted search | P2 |
| 22 | Analytics | Data lake (Firehose + Athena) | P2 |
| 23 | DB | Partitioning + archival | P2 |
| 24 | Infra | Blue-green CodeDeploy | P2 |

---

## 8. One-Line Executive Pitch

> "WingApp's current stack can comfortably handle hundreds of concurrent users, but scaling to a million requires adding a shared cache, moving side-effects to a job queue, replacing the naive cron jobs with an event-driven worker, fixing a handful of real correctness bugs, and turning the admin panel from a prototype into a production tool. It is a roughly six-engineer-month plan, deliverable in three phases over about four months, and it will also close several live production risks along the way."

---

## 9. File / Reference Map

- API monolith: `wingapp-api/src/`
- Notifications cron: `wingapp-notifications-job/src/`
- Restaurants cron: `wingapp-restaurants-job/`
- Admin panel: `wingapp-admin-ui/src/`
- Infrastructure IaC: `github.com/WingApp-us/infra`
- Detailed question + effort sheet: `WING_BILLY_QUESTIONS_AND_SCALABILITY.csv`
- Full user journey reference: `WING_FULL_SYSTEM_USER_JOURNEY.md`
