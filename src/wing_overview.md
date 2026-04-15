# WingApp API - Project Overview (Deep Reference)

> **Where to open:** Same content lives at `wingapp-api/OVERVIEW.md` and `wingapp-api/docs/OVERVIEW.md`. Use UTF-8 encoding. In Cursor: **File > Open File** and pick that path from the Explorer tree under `wingapp-api`.

Yeh document **developers / implementers** ke liye hai: poora service ka structure, **`lib/`** ka kaam, **database tables**, **Objection <-> PostgreSQL mapping**, **Knex migrations**, aur **future mein change kaise karna** (add/remove column, naya feature).

> **Source of truth:** Schema ka final truth **`src/db/migrations/`** hai. Neeche jo columns likhe gaye hain wo migrations + models se derive kiye gaye hain - production DB par verify kar lo (`\d table_name` in `psql` ya any DB tool).

---

## 1) Stack & high-level architecture

| Layer | Technology |
|--------|------------|
| HTTP | **Koa 2**, `@koa/router` |
| Auth | **Auth0** JWT (RS256, JWKS), `koa-jwt` + `jwks-rsa` |
| DB | **PostgreSQL**, **Knex** query/migrations, **Objection.js** ORM |
| Validation | **Joi** (`lib/request-validator`) |
| Payments | **Stripe** (`services/external/stripe.ts`) |
| Email | **AWS SES** (`lib/ses.ts`) |
| Files | **AWS S3** (`lib/s3.ts`) |
| Push | **Expo** (`lib/expo-sdk.ts`) |

**Request flow:**

```
HTTP
 -> index.ts (middleware chain)
 -> routes/*.ts (path -> handler)
 -> controllers/*.ts
 -> services/*.ts (+ services/external/*)
 -> models/* (Objection) -> PostgreSQL
```

---

## 2) Entry point: `src/index.ts`

| Order | Middleware | Purpose |
|-------|------------|---------|
| 1 | `cors()` | CORS headers |
| 2 | `koaErrorHandler` | Global try/catch -> HTTP status + body |
| 3 | `bodyParser()` | JSON body parse |
| 4 | `jwtValidator()` | JWT verify (kuch routes **skip** - neeche `lib/jwt-validator`) |
| 5 | `koa-pino-logger` | Structured request logs (`LOG_LEVEL`) |
| 6 | `routers` | `src/routes/index.ts` |

**Knex init:** Same file mein `Knex(knexfile + knexSnakeCaseMappers)` + `Model.knex(knex)` - saari Objection queries **`snake_case` DB <-> `camelCase` JS** map karti hain.

---

## 3) Routing: `src/routes/index.ts`

Saari domain routers **prefix** se mount:

| Prefix | File | Domain |
|--------|------|--------|
| `/experience` | `experience.ts` | Experience lifecycle, search, review, guests |
| `/location` | `location.ts` | Locations CRUD |
| `/offering` | `offering.ts` | Catalog (restaurants/activities) |
| `/payment` | `payment.ts` | Stripe Connect + payment methods |
| `/profiletype` | `profiletype.ts` | dater / restaurant / … types |
| `/profile` | `profile.ts` | User profile + answers + upload |
| `/redirect` | `redirect.ts` | Deep links (public) |
| `/reservation` | `reservation.ts` | Bookings, admin, transactions |
| `/review` | `review.ts` | Reviews |
| `/terms` | `terms.ts` | Legal terms versions |
| `/user` | `user.ts` | Account, cards, Auth0-linked user |
| `/restaurant` | `restaurant.ts` | Restaurant entities |
| `/viator-activities` | `viator-activities.ts` | Viator overlay patches |

**`GET /`** -> health: `"Server works!"` (router ke andar).

**Naya API add karna:**  
1. `routes/<domain>.ts` mein route  
2. `routes/index.ts` mein `router.use('/prefix', ...)` **agar naya file ho**  
3. `controllers` + `services` + optional `types` + `models` + **migration**

---

## 4) `lib/` - file-by-file (kya kahaan hota hai)

| File | Role |
|------|------|
| **`jwt-validator.ts`** | Auth0 **JWKS** se public key, `audience` = `AUTH0_AUDIENCE`, `issuer` = `https://${AUTH0_DOMAIN}/`. **`koa-unless`:** paths `['/']`, `'/redirect'`, aur `'/reservation/edit/confirm/*'` par JWT **skip**. Baaki sab routes par Bearer zaroori. |
| **`jwt-metadata.ts`** | JWT ke andar namespace `https://wingapp.us/app_metadata` se **`profile_id`** + **`wing_user_id`** nikalta hai -> **`getAppMetadata(ctx)`**. Ye dono **profile create** ke baad Auth0 Management API se set hote hain. |
| **`admin.ts`** | **`adminOnly`** middleware: `getAppMetadata` -> user email -> **`ADMINS_EMAILS`** env string mein hai ya nahi. Admin routes par lagate ho. |
| **`request-validator.ts`** | Joi schema ko `body` / `query` / `headers` par chalata hai; fail -> **`BadRequestError`** with field errors. |
| **`koa-error-handler.ts`** | `CustomError`, Objection errors (`ValidationError`, `UniqueViolationError`, …), generic **500**. DB errors (`DBError`) -> 500 + generic message. |
| **`s3.ts`** | Presigned URLs, profile image bucket checks. |
| **`ses.ts`** | AWS SES email bhejna; templates **`src/static/emails/`** se Handlebars. |
| **`expo-sdk.ts`** | Expo push tokens par messages (helpers). |
| **`geocodio.ts`** | Geocodio client wiring (address -> lat/lng). |
| **`log-level.ts`** | Pino log level from env. |
| **`scoring-algorithm/`** | **`activity.ts`**, **`restaurant.ts`**, **`viator.ts`**, **`shared.ts`** -  `POST /experience/search` pipeline ke scores (distance, time, profile match). |
| **`index.ts`** | Re-exports `jwt-validator`, `koa-error-handler`. |

**Future change examples:**

- **Naya public route** (bina JWT): `jwt-validator.ts` -> `unless` `custom` function mein path add karo **ya** carefully new route ko existing public pattern pe rakho.  
- **JWT mein naya claim** chahiye: `jwt-metadata.ts` + Auth0 Rule/Action + types `src/types/app-metadata.ts`.  
- **Naya admin-only route:** route file par `adminOnly` middleware (pattern dekho `reservation` / `offering` routes mein).

---

## 5) Controllers, services, types (pattern)

| Layer | Responsibility |
|--------|----------------|
| **`controllers/`** | HTTP: read `ctx`, validate (often via route middleware), call **service**, set `ctx.body` / status. **`email-notification.ts`** transactional emails trigger. **`push-notification/`** segmented builders (pre/during/post experience). |
| **`services/`** | Business logic + Objection queries. **`external/`** = Stripe, Auth0, Viator, Maps, Yelp, Geocode. |
| **`types/`** | Joi schemas + TS DTOs per domain (`user/`, `profile/`, `experience/`, …). |

**Naya field user profile pe:**  
`types` Joi -> `services/user` or `profile` -> migration agar column nahi -> `models` update.

---

## 6) Knex & PostgreSQL conventions

### 6.1 Config

- **`src/knexfile.ts`** -  port/host/db/user/password; migrations folder **`src/db/migrations`**.  
- **Important env:** `POSTGRES_PORT` (typo `POSRGRES_PORT` mat likhna).

### 6.2 Migrations

- **Commands:** `npm run db:migrate`, `db:migrate:rollback`, `db:migrate:make my_change`.  
- **Table `knex_migrations`** -  applied batches track.

### 6.3 `migrationDefaults` (`src/db/utils/migration-defaults.ts`)

Har table pe typically ye columns add hote hain:

| DB column | Meaning |
|-----------|---------|
| `created_at`, `updated_at` | Timestamps; **trigger** `update_<table>_updated_at` se `updated_at` auto refresh on UPDATE |
| `deleted_at`, `deleted_by` | Soft delete |
| `created_by`, `updated_by` | Audit text |

**Naya table:** migration mein columns + **`migrationDefaults(knex, 'table_name')`**.

### 6.4 Objection naming

Knex Objection setup **`knexSnakeCaseMappers()`** use karta hai -  **DB:** `first_name` -> **JS model:** `firstName`.

**Model class** -> **`static tableName`**: kabhi camelCase (`profileType`) jo DB mein `profile_type` map hota hai. **`relationMappings`** `from`/`to` mein logical property names use karte hain (Objection resolve karta hai).

---

## 7) Database -  tables overview

PostgreSQL extensions (migrations se): **`uuid-ossp`**, **`cube`**, **`earthdistance`** (geo queries).

Neeche **primary** columns + FKs; har table par **`migrationDefaults`** wale audit/soft-delete columns bhi hain (section 6.3).

---

### 7.1 `user`

**Purpose:** Wing app user; **`external_id`** = Auth0 `user_id`.

| Column (DB) | Objection (TS) | Notes |
|-------------|----------------|-------|
| `id` (uuid, PK) | `id` | |
| `external_id` | `externalId` | Unique; Auth0 link |
| `first_name`, `last_name` | `firstName`, `lastName` | PII; nullable allowed (later migrations) |
| `email` | `email` | Unique |
| `dob` | `dob` | Date |
| `stripe_customer_id` | `stripeCustomerId` | Stripe Customer |
| `job_title` | `jobTitle` | |
| `accepted_terms_version`, `accepted_terms_at` | `acceptedTermsVersion`, `acceptedTermsAt` | |
| `push_tokens` | `pushTokens` | Array (Expo tokens) |
| `is_enabled` | `isEnabled` | |
| `invitation_code` | `invitationCode` | |

+ `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`, `deleted_by` (defaults).

**Objection:** `UserModel` -> `profiles` **HasMany** `profile.user_id -> user.id`.

**Future:** Naya column -> migration `alter table "user"` + `UserModel` properties + DTOs + services.

---

### 7.2 `profile_type`

**Purpose:** dater, activity, restaurant, resy, viator, admin -  questionnaire JSON + metadata.

| Column | TS / Notes |
|--------|------------|
| `id` | PK uuid |
| `name`, `description` | |
| `profile_questions` | jsonb -  UI questionnaire |

+ defaults.

**Model:** `ProfileTypeModel` -  `ProfileTypeName` enum in code.

---

### 7.3 `profile`

**Purpose:** User ki “persona” -  ek user ke multiple types theoretically; app flow often **ek primary profile**.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `user_id` | FK -> `user` |
| `profile_type_id` | FK -> `profile_type` |
| `profile_answers` | jsonb |
| `business_name`, `phone_number`, `website` | |
| `experience_level`, `experience_amount`, `about`, `fee` | migrations se add |
| `profile_image_url` | |

+ defaults.

**Objection:** `BelongsTo` `user`, `profileType`.

**Future:** Naya questionnaire field -> often **`profile_answers`** JSON structure change (app + admin UI) ya dedicated column migration.

---

### 7.4 `offering`

**Purpose:** Bookable item -  restaurant / activity / Viator / Wing-owned; **`external_id`** e.g. `resy:…`, `viator:…`.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `profile_id` | Nullable (migration) -  catalog owner profile |
| `type_id` | FK -> `profile_type` |
| `description` -> evolved to **`answers`** jsonb | business-specific payload |
| `business_name`, etc. | migrations |
| `external_id` | |
| `location_id` | FK -> `location` |

**Objection:** `profile`, `type` (profileType), `location` (HasOne from offering side).

---

### 7.5 `location`

**Purpose:** Physical address; **`profile_id`** and/or **`offering_id`** (nullable).

| Column | Notes |
|--------|-------|
| `id` | PK |
| `description`, lat/lng, `address1`, `address2`, `city`, `state`, `zip` | |
| `profile_id`, `offering_id` | nullable FKs |

Originally **`profile_location`** table rename -> **`location`**.

---

### 7.6 `experience`

**Purpose:** User ka “outing” window -  start/end, departure coords, party size, revealed flag, timezone, etc.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `user_id` | FK -> `user` |
| `start_time`, `end_time` | |
| `accepted_at` | |
| `departure_latitude`, `departure_longitude` | |
| `timezone_offset` | |
| `party_size` | |
| `revealed` | |
| location-related columns | migrations (`add_location_to_experience`, …) |

**Objection:** `reservations` HasMany `experience_offering`, `review`, `guests` ManyToMany via `experience_guest`.

---

### 7.7 `experience_offering`

**Purpose:** Ek experience ke andar **ek slot** -  kaun sa offering, kab, kitna paisa, confirmation status, Stripe transaction link.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `experience_id`, `offering_id` | FKs |
| `profile_id`, `target_profile_id` | FK -> `profile` (booker vs provider context) |
| `user_id` | FK -> `user` |
| `type_id` | FK -> `profile_type` |
| `estimated_cost`, `actual_cost`, `sub_total`, `tip_tax`, `total` | billing |
| `start_time`, `end_time` | |
| `short_desc` | |
| `confirm_at`, `decline_at` | |
| `confirmed_status` | `CONFIRM_BOOKING` / `CONFIRM_DETAILS` / `CONFIRMED` |
| `needs_review` | |

+ defaults.

**Objection:** **`transaction`** HasOne on `transaction.experience_offering_id`.

---

### 7.8 `transaction`

**Purpose:** Stripe PaymentIntent / charge record tied to **`experience_offering`**.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `experience_offering_id` | FK |
| `external_id` | Stripe id |
| `subtotal_amount`, `tax_amount`, `tip_amount`, `gross_amount`, `fee_amount`, `net_amount` | integers (cents) in migration |

+ defaults.

---

### 7.9 `payment_method`

**Purpose:** Stripe Connect / saved payment method per **profile** (provider onboarding pattern).

| Column | Notes |
|--------|-------|
| `id` | PK |
| `profile_id` | FK -> `profile` |
| `name`, `email`, `external_id` | Stripe refs |
| `confirmed_at` | migration |

+ defaults.

---

### 7.10 `notification`

**Purpose:** Scheduled / templated push rows (**`wingapp-notifications-job`** in prod consumes); API writes rows with **`send_at`**, **`time_type`**, etc.

Important columns (initial + many alters): `user_id`, `experience_offering_id`, `experience_id`, `type`, text fields (`title`, `body`, `header`, …), **`send_at`**, **`time_type`**, **`sub_message`**, **`bottom_cta_text`**, **`page_route`**, location fields removed in later migrations -  **exact list** ke liye migrations `notification` grep karo.

**Model:** `NotificationModel` -  relations `user`, `experienceOffering`.

---

### 7.11 `experience_review`

**Purpose:** Post-experience review answers.

| Column | Notes |
|--------|-------|
| `id` | PK |
| `experience_id`, `user_id` | FKs |
| `answers` | jsonb |

+ defaults.

---

### 7.12 `external_profile`

**Purpose:** Third-party enrichment (e.g. Yelp) linked to **`profile_id`**.

| Column | Notes |
|--------|-------|
| `id`, `source`, `online_reservations`, `profile_data` (jsonb) | |

+ defaults.

---

### 7.13 `edit_experience_offering`

**Purpose:** Admin/user initiated **booking change** proposal before confirm.

| Column | Notes |
|--------|-------|
| `user_id`, `target_experience_offering_id`, `offering_id` | FKs |
| `start_time`, `end_time`, `sub_total`, `tip_tax`, `total` | |
| `confirm_at`, `decline_at` | |

+ defaults.

---

### 7.14 `experience_guest`

**Purpose:** Multiple users same **`experience`** (guest list).

| Column | Notes |
|--------|-------|
| `user_id`, `experience_id` | composite uniqueness; FK `experience_id` ON DELETE CASCADE |

+ defaults. (PK style: migration -  verify current DB; Objection model may expect `id` -  implement carefully.)

---

### 7.15 `restaurant`

**Purpose:** Restaurant-side metadata linked to **`offering`** (Resy flow).

| Column | Notes |
|--------|-------|
| `id` | PK |
| `offering_id` | FK (replaces old `resy_id`) |
| `name`, `description`, `cuisine`, `average_bill_size` | |
| `active`, `new` | |
| `phone_number` | |

+ defaults.

---

### 7.16 `viator_activity_patch`

**Purpose:** Admin overrides for Viator product display / mapping.

| Column | Notes |
|--------|-------|
| `id`, `name`, `product_code`, `active` | |

+ defaults.

---

### 7.17 `terms`

**Purpose:** Terms & conditions versions.

| Column | Notes |
|--------|-------|
| `id`, `title`, `description`, `version` | |

+ defaults.

---

## 8) Objection model -> table quick map

| Model file | `tableName` (logical) | PostgreSQL table |
|------------|----------------------|------------------|
| `user.ts` | `user` | `"user"` |
| `profile.ts` | `profile` | `profile` |
| `profileType.ts` | `profileType` | `profile_type` |
| `offering.ts` | `offering` | `offering` |
| `location.ts` | `location` | `location` |
| `experience.ts` | `experience` | `experience` |
| `experience-offering.ts` | `experienceOffering` | `experience_offering` |
| `transaction.ts` | `transaction` | `transaction` |
| `notification.ts` | `notification` | `notification` |
| `paymentMethod.ts` | `paymentMethod` | `payment_method` |
| `experience-review.ts` | `experienceReview` | `experience_review` |
| `experience-guest.ts` | `experienceGuest` | `experience_guest` |
| `edit-experience-offering.ts` | `editExperienceOffering` | `edit_experience_offering` |
| `external-profile.ts` | `externalProfile` | `external_profile` |
| `restaurant.ts` | `restaurant` | `restaurant` |
| `viator-activity-patch.ts` | `viatorActivityPatch` | `viator_activity_patch` |
| `terms.ts` | `terms` | `terms` |

**`base.ts`:** Saare models extend **`BaseModel`** -  shared **`createdAt`**, **`updatedAt`**, **`deletedAt`**, …

---

## 9) Features -  kya hai, kyun hai, future change kaise

### 9.1 User signup (Wing DB row)

- **Auth0** pe user pehle (Universal Login / app).  
- **`POST /user`** body + **`getUserByEmail`** Management API -> **`external_id`**.  
- **Profile** create -> **`updateAppMetadata`** -> JWT mein `wing_user_id` + `profile_id`.  

**Change:** Email flow / fields -> `types/user`, `user` controller, migration if needed.

### 9.2 Experience search

- **`services/experience-search.ts`** + **`lib/scoring-algorithm/*`**.  
- Geo: PostGIS-style helpers + Google Maps / Geocodio where applicable.

**Change:** Naya scoring factor -> `scoring-algorithm` + types `types/experience/search-*.ts`.

### 9.3 Payments

- Stripe: **`services/external/stripe.ts`**, controllers **`payment.ts`**, **`user.ts`** (cards), **`experience-offering`** flows.

**Change:** New intent status -> transaction model + Stripe webhook if added later (currently mostly synchronous API patterns).

### 9.4 Notifications

- API **writes** `notification` rows; **`wingapp-notifications-job`** (alag repo) **sends** Expo pushes.

**Change:** Naya push type -> notification creation code path + job strategy if needed.

### 9.5 Admin

- **`ADMINS_EMAILS`** + **`adminOnly`**.  
- Reservation / offering bulk flows **`controllers/reservation.ts`**, **`offering.ts`**.

**Change:** Naya admin endpoint -> same pattern + RBAC review if team grows.

---

## 10) Tests & quality

- **`tests/`** -  mirror `controllers` / `services` / `activities`.  
- **`npm test`**, **`npm run lint`**.

---

## 11) Remove / deprecate karne par checklist

1. **API route** hatao -> `routes` + `controllers` + tests.  
2. **Service** logic -> remove dead imports.  
3. **DB column** drop -> **nayi migration** (`dropColumn`), never edit old migration files already deployed.  
4. **Objection model** se property + relations clean karo.  
5. **Joi types** update.  
6. Auth0 / mobile / admin -  agar contract change ho to docs + clients sync.

---

## 12) Seeds

- **`src/db/seeds/`** -  local dev: `profile_type`, sample users/profiles, etc.  
- **`npm run db:seed`** -  `.env` ke saath.

---

*Document version: aligned with `wingapp-api` codebase layout (`src/`, migrations). Update this file when you add major tables or lib modules.*
