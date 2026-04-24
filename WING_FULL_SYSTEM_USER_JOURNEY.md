# Wing — Full System User Journey, API Flow & Data Mapping

**Scope**: ek page mein **complete Wing platform** — frontend (`wingapp-mobile`) + main backend (`wingapp-api`) + background workers (`wingapp-notifications-job`, `wingapp-restaurants-job`) — as a **dater** uses the app from app-launch → signup → onboarding → searching → booking (single / both) → payment → reveal → during-experience push notifications → review. Har step par **screen + inputs + validation** (frontend), **endpoint + payload + Joi validation + service logic + DB rows** (backend), ek **block diagram**, aur **real example**.

> Product note: “swipe / like / match / chat” jaisa classical dating app yeh **nahi** hai. Wing ek **shared dining + activity experience** booking platform hai. Do daters ek **same experience** par judte hain (**experience_guest**), chat ki jagah **push / email / SMS** notifications use hote hain.

---

## 0. System block diagram (end-to-end)

```
                          ┌──────────────────────────┐
                          │        DATER (user)       │
                          └────────────┬─────────────┘
                                       │ screens + forms
                                       ▼
                  ┌────────────────────────────────────────┐
                  │   MOBILE APP  (wingapp-mobile)         │
                  │   • React Native + Expo                │
                  │   • React Navigation                   │
                  │   • Zustand stores:                    │
                  │       auth, currentUser, experiences,  │
                  │       location, app, …                 │
                  │   • HTTP client: src/api/requests.ts   │
                  │     (get/post/put/patch/destroy)       │
                  │   • Tokens → AsyncStorage              │
                  └────────────┬───────────────────────────┘
                               │
          ┌────────────────────┴────────────────────┐
          │                                         │
          ▼                                         ▼
┌────────────────────────┐          ┌──────────────────────────────────────┐
│   AUTH0  (hosted)      │          │   wingapp-api  (Koa + TS)            │
│   /dbconnections/signup│          │   • JWT RS256 (JWKS)                 │
│   /oauth/token         │ ◄──────  │   • ctx.state.user                   │
│   /change_password     │          │   • getAppMetadata → userId,         │
│   Management API       │ ───────► │     profileId                        │
│   (app_metadata set    │          │   • Routes (src/routes/*):           │
│    by backend)         │          │     /user /profile /profiletype      │
└────────────────────────┘          │     /experience /reservation         │
                                     │     /offering  /location  /payment   │
                                     │     /review  /terms  /restaurant     │
                                     │     /viator-activities  /redirect    │
                                     └──────────────┬───────────────────────┘
                                                    │
                                                    ▼
                                   ┌───────────────────────────────────┐
                                   │   SERVICE LAYER (src/services/*)  │
                                   │   user, profile, experience,      │
                                   │   experience-search (scoring),    │
                                   │   experience-offering,            │
                                   │   experience-guest, notification, │
                                   │   transaction, paymentMethod,     │
                                   │   offering, location, restaurant  │
                                   └──────────────┬────────────────────┘
                                                  │
                           ┌──────────────────────┼─────────────────────┐
                           ▼                      ▼                     ▼
                   ┌──────────────┐       ┌───────────────┐      ┌────────────┐
                   │ PostgreSQL   │       │  Stripe       │      │ 3rd party  │
                   │ (Objection)  │       │  customers,   │      │ Viator,    │
                   │ user,profile │       │  paymentInts, │      │ Resy,      │
                   │ experience,  │       │  refunds,     │      │ Yelp,      │
                   │ experience_  │       │  connect      │      │ Google     │
                   │ offering,    │       └───────────────┘      │ Geocoding, │
                   │ offering,    │                              │ Maps       │
                   │ location,    │                              └────────────┘
                   │ experience_  │
                   │ guest,       │
                   │ transaction, │
                   │ notification,│
                   │ experience_  │
                   │ review, …    │
                   └───┬──────────┘
                       │                 ┌────────────────────────────────────┐
                       │                 │   wingapp-restaurants-job (cron)   │
                       │◄────────────────┤   • Resy API → upsert `offering`   │
                       │                 │     (type=resy) + `location`       │
                       │                 └────────────────────────────────────┘
                       │
                       │                 ┌────────────────────────────────────┐
                       │                 │   wingapp-notifications-job (cron) │
                       │◄────────────────┤   • fetch due `notification` rows  │
                       │   read/update   │   • strategies: traffic, leaveNow, │
                       │                 │     rideToNext, rideToHome, base   │
                       │                 │   • Expo Push + Google Maps API    │
                       │                 │   • markAsSent on `notification`   │
                       │                 └──────────────┬─────────────────────┘
                       │                                │
                       ▼                                ▼
              ┌──────────────────┐           ┌──────────────────────┐
              │ JSON response    │           │ Expo Push → device   │
              │ → Mobile parses  │           │ (pushTokens[])       │
              │ → Zustand update │           └──────────────────────┘
              │ → Screens        │
              └──────────────────┘
```

---

## 1. Repo layout — kaun kya karta hai

| Repo | Runs | Role |
|------|------|------|
| **`wingapp-mobile`** | Expo / React Native on device | Saari **dater UI** — screens, forms, Zustand stores, API calls. Auth0 se login/signup; wingapp-api se user/profile/experience/reservation/review/push. |
| **`wingapp-api`** | Koa web server (Node + TS) | Single source of truth. JWT validate, **CRUD** + **business logic**: user, profile, offering, experience, **experience_offering** (reservations), experience_guest, transaction, notification (rows), reviews, Stripe, Auth0 management calls, Viator/Resy/Yelp/Google integrations. |
| **`wingapp-notifications-job`** | Cron / scheduled batch (Node ESM) | **Outbound push**: `notification` rows jo `sendAt <= now` unhe pick karke, time-type strategy se message text banake, Expo Push SDK se user ke sab `pushTokens` par bhejta hai, `sentAt` mark. Guests ko bhi include karta hai (`experience_guest`). |
| **`wingapp-restaurants-job`** | Cron / scheduled batch (Node ESM) | **Inbound restaurant data**: Resy API se restaurants pull karta hai, `offering` (type=resy) + `location` **upsert** karta hai — search time par `experience-search` isi data ko rank karta hai. |

**Ek baat**: Dono jobs **wahi Postgres** use karte hain jo API use karti hai — coordination sirf DB ke zariye hota hai (notifications API create karti hai, job bhejta hai; restaurants job data bharta hai, API search karti hai).

---

## 2. Authentication (Auth0 JWT) — detailed

### 2.1 Responsibilities

| Kaun | Kya |
|------|-----|
| **Mobile (`wingapp-mobile`)** | Auth0 ke REST endpoints directly call karta hai signup + password/social login + refresh ke liye. Tokens **AsyncStorage** mein rakhta hai. Har wingapp-api request par `Authorization: <type> <access>` bhejta hai. |
| **`wingapp-api`** | Token **issue nahi** karta; sirf `jwt-validator` se **validate** karta hai (JWKS + RS256 + issuer + audience). `jwt-metadata.getAppMetadata(ctx)` se `wing_user_id` + `profile_id` padhta hai — yahi har user-scoped request ki identity hai. |
| **Auth0** | User identity + password + email verification + PKCE. **app_metadata** (`wing_user_id`, `profile_id`) — jo wingapp-api **post-profile-create** set karta hai. |

### 2.2 Flow (signup + login + token stamping)

```
 Mobile                         Auth0                           wingapp-api               Postgres
   │                              │                                 │                        │
   │ POST /dbconnections/signup   │                                 │                        │
   ├─────────────────────────────►│  create Auth0 user (email+pwd)  │                        │
   │◄─────────────────────────────┤                                 │                        │
   │ POST /oauth/token            │                                 │                        │
   │ grant=password               │                                 │                        │
   ├─────────────────────────────►│  access_token + refresh_token   │                        │
   │◄─────────────────────────────┤  (JWT RS256, no app_metadata)   │                        │
   │                              │                                 │                        │
   │ POST /user  (Bearer)         │                                 │                        │
   ├────────────────────────────────────────────────────────────────►│ Joi validate + lookup  │
   │                              │  (looks up Auth0 by email)      │ Auth0; INSERT user     │
   │                              │◄────────────────────────────────┤                        ├─► user
   │◄──────────────────────────────────────────────────────────────┤  userDto                 │
   │                              │                                 │                        │
   │ POST /profile (Bearer)       │                                 │                        │
   ├────────────────────────────────────────────────────────────────►│ INSERT profile         ├─► profile
   │                              │  auth0.updateAppMetadata({       │                        │
   │                              │   wing_user_id, profile_id })    │                        │
   │                              │◄────────────────────────────────┤                        │
   │◄──────────────────────────────────────────────────────────────┤  profile JSON           │
   │                              │                                 │                        │
   │ POST /oauth/token            │                                 │                        │
   │ grant=refresh_token          │                                 │                        │
   ├─────────────────────────────►│  NEW JWT includes app_metadata  │                        │
   │◄─────────────────────────────┤                                 │                        │
   │                              │                                 │                        │
   │ GET /user?profiles=true      │                                 │                        │
   ├────────────────────────────────────────────────────────────────►│ getAppMetadata OK      │
   │                              │                                 │ SELECT user+profiles   │
   │◄──────────────────────────────────────────────────────────────┤                         │
```

### 2.3 Where tokens live on device

`src/utils/auth.ts` + `src/stores/auth.ts` — AsyncStorage keys:

- `access_token`, `token_type`, `refresh_token`, `token_expiration`, `auth_email`

On **401** from API, `src/api/requests.ts` calls `refreshAuthToken()` and retries the original request with the new bearer.

---

## 3. Step-by-step user journey (dater)

Har step mein: **Screen → inputs → validation**, **API → payload → service → DB**, aur **mini diagram**.

### Step A — App launch

**Frontend** (`App.tsx`, `Navigation.tsx`)

- Screen: `LoadingScreen` while `authInitialized === false` (or `currentUserLoading` after auth resolves).
- On mount:
  - `useAuthStore.getAuthDataFromStorage()` — rehydrate tokens.
  - If authenticated: `getUser()`, `useExperiencesStore.getExperiences()`, `useLocationStore.getLocations()`.
  - If `user.profile` exists: `updatePushToken()` (PATCH `/user/pushtoken`).

**Backend**: None until authed. Then `GET /user?profiles=true`, `GET /profiletype`, `GET /experience`, `GET /location`.

```
[Launch] ─► rehydrate tokens ─► if token: GET /user, GET /profiletype, GET /experience, GET /location
                                else: show LandingPage
```

---

### Step B — Signup / Login (unauthenticated stack)

**Screens**

| Screen | Fields | Validation |
|--------|--------|-----------|
| `LandingPage` | — | — |
| `SignUp` (step 1) | `email` | Yup email format |
| `SignUp` (step 2) | `password`, `passwordConfirmation` | `utils/passwords.ts` rules; must match |
| `Login` | `email`, `password` | Auth0 errors mapped: `access_denied` → “verify email”, `invalid_grant` → bad creds |
| `ForgotPassword` | `email` | Auth0 `/dbconnections/change_password` |
| Social (`useSocialNetworkAuth`) | Apple / Google | PKCE code → `/oauth/token` grant=authorization_code |

**Backend (Auth0, not wingapp-api)**

- Signup: `POST {AUTH0_DOMAIN}/dbconnections/signup` — `{ client_id, email, password, connection: 'Username-Password-Authentication' }`
- Login: `POST {AUTH0_DOMAIN}/oauth/token` — `{ client_id, username, password, grant_type: 'password', audience, scope: 'openid profile email offline_access', connection }`

**Response**: `access_token`, `refresh_token`, `expires_in`, `token_type`. Mobile saves via `setAuthDataToStorage`.

```
[SignUp form] ─► Auth0 signup ─► Auth0 login ─► tokens in AsyncStorage ─► Onboarding
[Login form ] ─► Auth0 login ─► tokens ─► GET /user; if no profile → Onboarding, else DaterHomePage
```

---

### Step C — Onboarding (profile + preferences)

**Screens**

| Screen | Inputs |
|--------|--------|
| `Onboarding` | `firstName`, `lastName` (or Apple SSO name), **DOB** month+year → `YYYY-MM-01`, `jobTitle`, plus structured `profileAnswers` (sections/questions/options; swipe-style UX) |
| `DaterWaitlistInfo` | Optional `invitationCode` / referrals |

**Validation**: Yup schemas from `utils/onboarding/validations.ts` (`dobSchema` etc.).

**API — create Wing user**: `POST /user`

Joi (`createUserSchema`) accepts:

```json
{
  "email": "alex@example.com",
  "firstName": "Alex",
  "lastName": "Rivera",
  "dob": "1995-06-01T00:00:00.000Z",
  "jobTitle": "Designer",
  "acceptedTermsVersion": 1,
  "invitationCode": "WING-123"
}
```

**Controller** (`user.create`):
1. `userService.getOne({ email })` → must **not** exist.
2. `auth0Service.getUserByEmail(email)` → must exist (Auth0 account already created).
3. Default `acceptedTermsAt = now()` if not sent.
4. `userService.create(userData, auth0User.user_id)` — INSERT `user` row (`externalId = auth0 user_id`).
5. `emailNotificationController.sendNewAccountCreated(...)`.
6. Response: `userDto(user)` + `201`.

**API — create profile**: `POST /profile`

Body:

```json
{
  "userId": "<wing user uuid>",
  "profileTypeId": "<profile_type.id>",
  "profileAnswers": { "profileQuestions": [ /* … */ ] }
}
```

**Controller** (`profile.create`):
1. Load `user` (`users.profiles[]`) — **no existing profile** allowed.
2. `profileTypeService.getOne(profileTypeId)` → `profile_type` must exist.
3. Default `fee = DEFAULT_PROFILE_FEE` for `ProfileTypeName.Activity | Restaurant`, else `null`.
4. `profileService.create(...)` → INSERT `profile`.
5. `auth0Service.updateAppMetadata(externalId, { userId, profileId })` — Auth0 **now knows** the Wing IDs.
6. `201` + profile JSON.

**Mobile after success**: `useAuthStore.refreshToken()` — so next JWT carries `wing_user_id` + `profile_id`.

```
[Onboarding inputs]
         │
         ▼
POST /user ──► userController.create ──► userService.create ──► INSERT user
         │
         ▼
POST /profile ──► profileController.create ──► INSERT profile
                                      └──► auth0.updateAppMetadata
         │
         ▼
Mobile: refresh token  →  JWT has wing_user_id + profile_id
         │
         ▼
GET /user?profiles=true  →  DaterHomePage
```

**Tables written**: `user`, `profile`. Referenced: `profile_type`.

---

### Step D — Load session

**Every app start after auth**: `GET /user?profiles=true`.

Controller (`user.get`): `getAppMetadata(ctx)` → `userId`; `userService.getOne({ id }, includeProfiles=true)`; merges `emailVerified` from Auth0. Also `GET /profiletype` for display.

**Important guard**: if `getUser` finds a user **without** `profile.profileAnswers`, mobile **logs out** (`currentUser.ts`) — incomplete onboarding is treated as invalid.

---

### Step E — Home (feed analog)

**Screens**: `DaterHomePage` (inside `HomeStack` drawer). Related: `ExperienceHistory`, `DaterCalendar`, `ExperienceDetail`, `ExperienceOfferingDetail`.

**API**:

- `GET /experience` → `experienceController.getAll` → **user’s own experiences** (`experienceService.getAll({ userId })`) **+** **shared** ones (`experienceService.getShared(userId)`). Result = array.
- `GET /location` → user’s saved home/work locations (used later in search).
- `GET /offering/divided` or `/offering/activities` → for admin-flow; dater path uses `POST /experience/search` instead.

**What user sees**: upcoming and past experiences, calendar, entry to book.

---

### Step F — “Like / match” analog = Search + Pick + Reserve

There is no `/like` or `/match`. Intent is expressed through **search → choose → book**.

#### F.1 Search — `POST /experience/search`

Screen flow: `BookAnExperience` (multi-step). Produces body validated by `searchExperienceSchema`:

```json
{
  "experienceType": "dining | activity | both",
  "partySize": 2,
  "diningSpend": "$$",
  "activitySpend": "$$",
  "startDateTime": "2026-05-01T19:00:00.000Z",
  "date": "2026-05-01",
  "timeOfDay": "Evening",
  "startTime": "19:00",
  "departureLatitude": 40.73,
  "departureLongitude": -73.99,
  "distanceInMiles": 5,
  "cuisineTypes": ["Italian", "Sushi"],
  "activityTypes": ["Drinks", "Relaxing"],
  "timezoneOffset": "240"
}
```

**Service** (`experience-search.buildSearchExperience`):
1. Load **user + profile** (`user.profiles[]`).
2. `startDateTime` must be future; no overlapping existing `experience` for same user.
3. Branch by `experienceType`:
   - **`dining`** → `searchRestaurantOfferings` (reads `offering` seeded by `wingapp-restaurants-job`, merges edits from `restaurant` table) → `ScoreRestaurant.rankRestaurant`.
   - **`activity`** → Wing activities (DB `offering` + `location`) + **Viator** activities (3rd-party API); `ScoreViator.rankViatorActivities` + `ScoreActivity.rankActivities`. Top-3 mixed.
   - **`both`** → ranked dining + nearest ranked activity (changeover + travel time logic).
4. Build `SearchExperienceReturn[]` with `experience_offering[]` (start/end, shortDesc, image, subTotal, tipTax, total, offering info).

**No DB writes** on pure search. Response goes to `ExperienceResultDetail` / `SwipeOptionsScreen` UIs.

```
[Filters] ──► POST /experience/search ──► Search service
                                              ├─► offering (restaurants seeded by job)
                                              ├─► offering + location (activities)
                                              └─► Viator 3rd-party API
                                  ranked + scored ──► UI cards
```

#### F.2 Reserve — `POST /reservation` (no payment) **or** `POST /reservation/transaction` (with Stripe)

Body validated by `createExperienceOfferingSchema`:

```json
{
  "experience": {
    "startTime": "2026-05-01T19:00:00.000Z",
    "endTime":   "2026-05-01T22:00:00.000Z",
    "partySize": 2,
    "departureLatitude": 40.73,
    "departureLongitude": -73.99
  },
  "timezoneOffset": "240",
  "source": "<stripe payment_method id>",
  "experienceOfferings": [
    {
      "offeringId": "<offering uuid>",
      "typeId":     "<profile_type uuid>",
      "typeName":   "restaurant | activity | wing_activity | viator_activity",
      "targetProfileId": "<host profile id | null>",
      "subTotal": 80,
      "tipTax":   12,
      "total":    92,
      "startTime": "…",
      "endTime":   "…",
      "shortDesc": "…",
      "requireConfirmation": true
    }
  ]
}
```

**Controller** (`reservation.createReservationWithTransaction`):
1. DB transaction start.
2. `experienceService.create({...experience, userId})` → INSERT `experience`.
3. Loop `experienceOfferings`:
   - INSERT `experience_offering` (with `experienceId, userId, profileId, estimatedCost (×100 cents), shortDesc[0..255]`).
   - If `typeName === wing_activity`:
     - `stripe.paymentIntents.create({ amount, currency: 'usd', payment_method, customer: user.stripeCustomerId, capture_method: 'manual', confirm: requireConfirmation })`.
     - Depending on charge status (`succeeded | requires_capture`) → `stripe.paymentIntents.capture` if needed.
     - INSERT `transaction` with `externalId = pi.id`, `subtotalAmount` (cents).
   - If Wing activity does not require confirmation → mark `confirmedStatus = CONFIRMED`.
4. On any error inside loop → `stripe.refunds.create({ charge })` + DB rollback.
5. Commit.
6. Outbound (post-commit, not in tx):
   - `emailNotificationController.sendBookingDetails` (user).
   - `emailNotificationController.sendAdminBookingDetails`.
   - `pushNotificationController.createExperiencesNotifications(userId, experienceId, reservations, initialLocation, tzOffset)` → **this inserts `notification` rows** (pre/during/post). These are picked up later by **`wingapp-notifications-job`**.
7. `201` + `{ experienceId }`.

`POST /reservation` (non-transaction) is identical but without Stripe charge — used for flows that do not require payment.

**Tables touched**: `experience` (INSERT), `experience_offering` (INSERT × N), `transaction` (INSERT for Wing activities), `notification` (INSERT × many pre/during/post), **reads** `user`, `offering`, `profile`.

```
[Selected offering]
        │
        ▼
POST /reservation/transaction
        │
        ▼
DB tx → INSERT experience
      → for each offering:
          INSERT experience_offering
          if wing_activity: Stripe charge + INSERT transaction
commit
        │
        ▼
email (user + admin) + createExperiencesNotifications (INSERT notification rows)
        │
        ▼
201 { experienceId }  →  DaterHomePage shows booking
```

#### F.3 Host confirm / decline — `PATCH /reservation/:id/confirm`

If an offering required confirmation, the **host profile** (owner) confirms / declines:

```json
{ "confirmed": true, "startTime": "…optional new time (admin only)…" }
```

Controller sets `confirmAt` / `declineAt`, optionally updates `startTime` (admin). Only `reservation.targetProfileId === callerProfileId` (or admin) can confirm.

---

### Step G — Reveal (mystery experience)

**Screen**: After booking, offering details may be hidden until user taps reveal — or auto-reveal at time threshold.

**API**: `POST /experience/reveal/:id`

Controller: sets `experience.revealed = true`, and **deletes upcoming “30h” / “24h” reveal notifications** (`notificationService.deleteByTimeType`) so the background job does not send them after reveal.

```
POST /experience/reveal/:id
        │
        ▼
UPDATE experience SET revealed=true
        │
        ▼
DELETE notification WHERE experienceId AND timeType IN (thirtyHours, twentyFourHours)
```

**Table touched**: `experience`, `notification`.

---

### Step H — Guest join (dater-to-dater “match” analog)

Another dater joins the same experience — not a separate match entity, just `experience_guest`.

**API**:
- Join: `POST /experience/:id/experience-guest/join` (empty body)
- Leave: `DELETE /experience/:id/experience-guest/leave`

Controller (`experience.join`):
1. Validate experience + user exist.
2. `experienceGuestService.create({ experienceId, userId })`. Duplicate → `UniqueViolationError` → **409 “already joined”**.

Result: **`experience_guest`** row. Host’s `GET /experience` includes it via `experienceService.getShared`. Notification job later includes guest push tokens (`experienceGuestDbService.getAllByExperienceId`).

```
POST /experience/:id/experience-guest/join
        │
        ▼
INSERT experience_guest (experienceId, userId)
        │
        ▼
Shared experience visible to both users; push notifications go to both
```

---

### Step I — During-experience notifications (background job)

`wingapp-notifications-job` is a **separate process** (cron).

**What it does** (`src/index.mjs`):

```
loop start
  notifications = fetchAllNotifications()        // confirmed-experience + general
  if notifications.length:
    messages = generateNotificationMessages(notifications)
      for each notification:
        strategy = getNotificationStrategy(n.timeType)
        meta     = strategy.createNotificationMetaData()
                     ├─ base: title/body as-is
                     ├─ trafficTime: Google Maps Directions (traffic-aware ETA)
                     ├─ leaveNow: Google Maps with departure_time=now
                     ├─ rideToNextExperience / rideToHome: uber / transit deep-link
        recipients = user.pushTokens[] ∪ experience_guest.user.pushTokens[]
        push one message per recipient (for per-recipient error isolation)
    sendNotificationsWithRetry(messages)         // Expo push SDK
    markAsSent(notifications)                    // UPDATE notification SET sentAt=now
process.exit(0)
```

**Time types** (`TimeTypesEnum`): `thirtyHours`, `twentyFourHours`, `sixHours`, `trafficTime`, `leaveNow`, `haveArrived`, `rideToNextExperience`, `rideToHome`, `review`.

**Where those rows come from**:
- `reservation.createReservation[WithTransaction]` → `pushNotificationController.createExperiencesNotifications` → `notificationService.create([...pre, ...during, ...post])`.
- Review / reveal events also touch these (delete / soft-delete based rows).

```
Cron tick
   │
   ▼
SELECT notification WHERE sendAt<=now AND sentAt IS NULL  (+ experience confirmed)
   │
   ▼
per notification: strategy → message
   │
   ▼
gather pushTokens (user + experience guests)
   │
   ▼
Expo Push
   │
   ▼
UPDATE notification SET sentAt=now
```

**Tables read/written**: `notification` (READ + UPDATE sentAt), `user` (READ pushTokens), `experience_guest` (READ via experienceId), `experience`, `experience_offering`, `offering`, `location`.

---

### Step J — After experience: reviews

**Screen**: `ReviewExperience`.

**API**:

- Create: `POST /experience/:id/review` — `createExperienceReviewSchema` body (rating, comment, etc.).
- Update: `PATCH /experience/:experienceId/review/:id` (same schema).

Controller (`experience.createReview`):
1. Experience must exist; must have no existing review.
2. INSERT `experience_review` (with `experienceId, userId, createdBy`).
3. Soft-delete the `review`-type `notification` for that reservation (so the “please review” reminder won’t fire again).

```
POST /experience/:id/review
        │
        ▼
INSERT experience_review
        │
        ▼
soft-delete notification WHERE experienceOfferingId AND timeType=review
```

---

### Step K — Payments after the experience (reconcile totals)

For dine / experience billing adjustments, `PATCH /reservation/:id/transaction/:transactionId`:

Body:

```json
{ "subtotalAmount": 12000, "taxAmount": 1000, "tipAmount": 1500 }
```

Controller (`reservation.updateTransaction`):
1. Load `transaction`, `experience_offering`, `targetProfile`, the profile’s primary `payment_method`.
2. Retrieve the original authorization `paymentIntent`, cancel it.
3. **Clone customer + card** to the host’s Stripe connected account.
4. Create a new `paymentIntent` on that connected account with `application_fee_amount = gross * profile.fee`.
5. UPDATE `transaction` (externalId, subtotal/tax/tip/fee/gross/net).
6. If all offerings in the experience are fully transacted → `sendReceipt` email.

```
PATCH /reservation/:id/transaction/:transactionId
        │
        ▼
retrieve authPI → cancel → cloneCustomer(connectedAccount)
        │
        ▼
create new PI on connected account (application_fee_amount)
        │
        ▼
UPDATE transaction (amounts)
        │
        ▼
if experience fully reconciled → email receipt
```

**Tables**: `transaction`, `experience_offering`, `experience`, `profile`, `payment_method` (READ). Stripe: **two** accounts (platform + connected).

---

### Step L — Cancel

`DELETE /experience/:id`

Rules:
- If starts in <`EXPERIENCE_CANCEL_MIN_HOURS` → **400**.
- If already happened / now → **400**.

Otherwise: `experienceService.softDelete`, `experienceOfferingService.softDeleteMany`, `notificationService.deleteAllByExperienceId`.

---

### Step M — Push token lifecycle

- `PATCH /user/pushtoken` → `{ pushToken }` → controller pushes into `user.pushTokens[]` (dedupe).
- `DELETE /user/pushtoken` → `{ pushToken }` → filter out.

This is what makes background notifications reach the device.

---

### Step N — “Chat initiation” — intentional gap

No in-app chat in the code (no sockets, no chat collection). Comms channel between dater + host + guests = **push + email + SMS helper**.

---

## 4. Data flow mapping (cheatsheet)

| Data | App call | API service | DB write | Reads back |
|------|----------|-------------|----------|-----------|
| Credentials | Auth0 (not API) | — | — | Tokens in AsyncStorage |
| Wing user | `POST /user` | `userService.create` | `user` | `GET /user` |
| Profile + prefs | `POST /profile` | `profileService.create` + Auth0 `app_metadata` | `profile` | session JWT, `GET /user?profiles=true` |
| Push token | `PATCH /user/pushtoken` | `userService.update pushTokens[]` | `user.pushTokens` | background job + API comms |
| Experience list | `GET /experience` | `experienceService.getAll` + `getShared` | — | `DaterHomePage` |
| Search | `POST /experience/search` | `experience-search.buildSearchExperience` + Viator/Resy/activity scoring | — | `ExperienceResultDetail` |
| Booking (no pay) | `POST /reservation` | `experienceService.create` + `experienceOfferingService.create` | `experience`, `experience_offering`, `notification` (INSERT) | history, calendar |
| Booking (pay) | `POST /reservation/transaction` | same + Stripe PI + `transactionService.create` | adds `transaction` | receipt |
| Host confirm | `PATCH /reservation/:id/confirm` | `experienceOfferingService.update` | `experience_offering.confirmAt/declineAt` | detail |
| Reveal | `POST /experience/reveal/:id` | update + `notificationService.deleteByTimeType` | `experience.revealed`, delete `notification` | detail |
| Guest join | `POST /experience/:id/experience-guest/join` | `experienceGuestService.create` | `experience_guest` | shared experience list |
| Guest leave | `DELETE /experience/:id/experience-guest/leave` | hard-delete | `experience_guest` | — |
| Review | `POST /experience/:id/review` | `experienceReviewService.create` + soft-delete review notif | `experience_review` | `/experience/:id` with review relation |
| Reconcile | `PATCH /reservation/:id/transaction/:tid` | Stripe connect + `transactionService.update` | `transaction` | receipt email |
| Cards | `/user/card*` | Stripe PaymentMethods + (optionally) `user.stripeCustomerId` | `user.stripeCustomerId` | `PaymentMethods` |
| Cancel | `DELETE /experience/:id` | soft-delete cascade | tombstones | — |

**Background workers**

| Worker | Reads | Writes | Other side |
|--------|-------|--------|-----------|
| `wingapp-restaurants-job` | Resy API | `offering` (type=resy) + `location` (upsert) | Feeds `/experience/search` dining |
| `wingapp-notifications-job` | `notification`, `user.pushTokens`, `experience_guest` | `notification.sentAt` | Expo Push API, Google Maps Directions API |

---

## 5. DB entities — key fields only

```
user
  id (uuid, pk)                    externalId (Auth0 user_id)
  email, firstName, lastName
  dob?  jobTitle?
  stripeCustomerId
  acceptedTermsVersion, acceptedTermsAt
  pushTokens[] (text[])
  isEnabled, invitationCode

profile (1..1 user via userId)
  id (uuid, pk)   userId (fk)   profileTypeId (fk)
  profileAnswers (json)
  experienceLevel, experienceAmount, about
  fee (for host profiles)   profileImageUrl

profile_type
  id (uuid, pk)  name  (dater | activity | restaurant | resy | wing_activity | viator_activity …)

offering          (restaurants seeded by resy job; activities seeded manually / admin)
  id (uuid, pk)   profileId? (host)  typeId (fk profile_type)
  businessName, website, phoneNumber
  answers (json — includes resy payload / cost / availability)
  externalId (e.g. resy:<id>, viator:<productCode>)

location
  id, offeringId, profileId?
  address fields, latitude/longitude (cube/earthdistance)

experience
  id (uuid, pk)   userId (owner/dater)
  startTime, endTime, timezoneOffset
  partySize
  departureLatitude/Longitude
  revealed  (bool)
  acceptedAt?

experience_offering   (one experience ↔ 1..N offerings)
  id (uuid, pk)
  experienceId (fk), userId, profileId, targetProfileId (host)
  offeringId (fk), typeId, typeName
  startTime, endTime, shortDesc
  subTotal, tipTax, total, estimatedCost (cents), actualCost
  confirmAt?, declineAt?, confirmedStatus?
  needsReview?
  transaction? (1..0..1)

transaction
  id, externalId (Stripe paymentIntent)
  experienceOfferingId (fk)
  subtotalAmount, taxAmount, tipAmount, grossAmount, feeAmount, netAmount

experience_guest       (many-to-many user↔experience)
  experienceId (fk), userId (fk)    (unique pair)

experience_review
  id, experienceId (fk), userId, rating, comment, …

notification
  id, title, body, header/subheader, message/subMessage, ctaText, …
  timeType (thirtyHours | twentyFourHours | sixHours | trafficTime | leaveNow
           | haveArrived | rideToNextExperience | rideToHome | review)
  sendAt, sentAt
  userId, experienceId, experienceOfferingId
  pageRoute (deep link)

payment_method            (host-side Stripe Connect)
  id, externalId (Stripe connected account), profileId, …

terms
  id, version, contents, createdAt

redirect                  (deep link helper)
viator_activity_patch     (whitelist + overrides for Viator)
restaurant                (edits on top of resy offering)
edit_experience_offering  (host-proposed edits to a booked offering)
external_profile          (future identity linking)
```

---

## 6. REST surface — by prefix (from `src/routes/index.ts`)

```
/user               GET, POST, PUT, DELETE                (+ /password PATCH, /stripe PATCH,
                    /terms PATCH, /pushtoken PATCH+DELETE, /email-verification POST, /all GET admin)
/user/card          GET, POST, PUT:id, GET:id, DELETE:id  (Stripe payment methods)

/profile            GET, POST, PUT
/profile/answers    PATCH
/profile/myreservations, /profile/:id/reservations   GET
/profile/dashboard, /profile/upload (GET+POST)
/profiletype        GET

/experience         GET, GET:id, PUT:id, DELETE:id
/experience/search                                     POST  (Joi searchExperienceSchema)
/experience/reveal/:id                                 POST
/experience/:id/review         POST
/experience/:experienceId/review/:id   PATCH
/experience/:id/experience-guest/join   POST
/experience/:id/experience-guest/leave  DELETE

/reservation                     POST             (createExperienceOfferingSchema)
/reservation/transaction         POST             (same schema; triggers Stripe)
/reservation/:id                 GET, PATCH :id/confirm
/reservation/:id/transaction/:transactionId   PATCH  (updateTransactionSchema)
/reservation                     GET (admin paginate)
/reservation/all                 GET (admin)
/reservation/all/:id             GET (admin)
/reservation/confirm             PUT (admin confirm)
/reservation/edit                POST (admin)
/reservation/edit/confirm/:id    PATCH  (public — invitation-based)

/offering           GET, POST, GET:id, PUT:id, PATCH:id/answers, DELETE:id
/offering/divided, /offering/activities GET
/offering/:id/yelp  GET

/location           GET, GET:id, POST, PUT:id, DELETE:id
/payment            GET, POST /init, PATCH /confirm, DELETE:id
/review             GET, GET:id
/terms              GET
/restaurant         GET /all, POST, PATCH :id, DELETE :id
/viator-activities  GET (admin)
/redirect           GET   (public — deep link landing page)
/                   GET   (public — "Server works!")
```

**Public paths** (no JWT): `/`, `/redirect`, any path containing `/reservation/edit/confirm/`. Everything else requires a valid Auth0 bearer token.

---

## 7. Worked example — “Alex” from signup to first booking

### 7.1 Alex signs up in the mobile app

Email: `alex@example.com`, password: `P@ssw0rd!`. App calls Auth0 `/dbconnections/signup`, then `/oauth/token` (grant=password). Tokens saved.

### 7.2 Alex completes Onboarding

Mobile collects:

```json
{
  "firstName": "Alex",
  "lastName":  "Rivera",
  "dob":       "1995-06-01T00:00:00.000Z",
  "jobTitle":  "Designer",
  "email":     "alex@example.com",
  "acceptedTermsVersion": 1,
  "profileTypeId": "<dater profile_type uuid>",
  "profileAnswers": { "profileQuestions": [ /* … */ ] }
}
```

→ `POST /user` (without `profileTypeId`, `profileAnswers`). API inserts `user`. →
→ `POST /profile` (with `userId` from previous response, `profileTypeId`, `profileAnswers`). API inserts `profile` + Auth0 `app_metadata`. →
→ Mobile calls Auth0 `refresh_token`. New JWT contains `wing_user_id` + `profile_id`.

### 7.3 Alex opens app

`GET /user?profiles=true` → returns user + profile + `emailVerified`. DaterHomePage loads.

### 7.4 Alex books a dining + activity experience

Flow (`BookAnExperience`):

1. Fills party size, date/time, budget, distance, cuisine, activity types.
2. `POST /experience/search` body:

```json
{
  "experienceType": "both",
  "partySize": 2,
  "diningSpend": "$$",
  "activitySpend": "$$",
  "startDateTime": "2026-05-01T19:00:00.000Z",
  "date": "2026-05-01",
  "timeOfDay": "Evening",
  "startTime": "19:00",
  "departureLatitude": 40.73,
  "departureLongitude": -73.99,
  "distanceInMiles": 5,
  "cuisineTypes": ["Italian"],
  "activityTypes": ["Drinks"],
  "timezoneOffset": "240"
}
```

API → `experience-search.buildSearchExperience` → returns up to 3 `{ startTime, endTime, experience_offering:[resto, activity], partySize }`.

3. Alex selects one → `BookExperienceCostBreakdown` → `POST /reservation/transaction` body:

```json
{
  "experience": {
    "startTime": "2026-05-01T19:00:00.000Z",
    "endTime":   "2026-05-01T22:00:00.000Z",
    "partySize": 2,
    "departureLatitude": 40.73,
    "departureLongitude": -73.99
  },
  "timezoneOffset": "240",
  "source": "pm_123abc",
  "experienceOfferings": [
    {
      "offeringId": "<resto uuid>",
      "typeId":     "<restaurant profile_type uuid>",
      "typeName":   "restaurant",
      "targetProfileId": "<resto host profile uuid>",
      "subTotal": 80, "tipTax": 12, "total": 92,
      "startTime": "2026-05-01T19:00:00.000Z",
      "endTime":   "2026-05-01T20:30:00.000Z",
      "shortDesc": "Italian · 2 guests · $$",
      "requireConfirmation": false
    },
    {
      "offeringId": "<viator uuid>",
      "typeId":     "<activity profile_type uuid>",
      "typeName":   "viator_activity",
      "subTotal": 60, "tipTax": 0, "total": 60,
      "startTime": "2026-05-01T21:00:00.000Z",
      "endTime":   "2026-05-01T22:00:00.000Z",
      "shortDesc": "Rooftop jazz bar",
      "requireConfirmation": false
    }
  ]
}
```

### 7.5 DB effects (post-commit)

```
INSERT INTO experience (id, userId, startTime, endTime, partySize, departureLat/Long, timezoneOffset);
INSERT INTO experience_offering  (×2  — one per offering);
-- for the wing_activity one, if any:
INSERT INTO transaction (id, externalId='pi_…', experienceOfferingId, subtotalAmount);
-- pushNotificationController.createExperiencesNotifications →
INSERT INTO notification (×N, timeType IN (thirtyHours, twentyFourHours, sixHours,
                                           trafficTime, leaveNow, haveArrived,
                                           rideToNextExperience, rideToHome, review));
```

### 7.6 Before the date

Cron runs `wingapp-notifications-job` every N minutes. As `notification.sendAt` windows arrive:

- 30h / 24h / 6h: base strategy → title/body → Expo push.
- `trafficTime`: Google Directions → ETA → personalized body.
- `leaveNow`: deep-link to Maps.
- `haveArrived`: arrived check-in.
- Guests also receive pushes (`experience_guest` lookup).

On tap, `pageRoute` deep-links into `DaterHomePage` / `ExperienceDetail`.

### 7.7 Reveal + Guest join

If the experience was “mystery”: `POST /experience/reveal/:id` → `revealed=true`, delete 30h/24h reveal notifs.

A friend opens the shared invite deep link → `POST /experience/:id/experience-guest/join` → INSERT `experience_guest`.

### 7.8 After the experience

- `PATCH /reservation/:id/transaction/:tid` (host-side charges) — Stripe connect flow, UPDATE `transaction`. Receipt email if all offerings reconciled.
- Alex writes review: `POST /experience/:id/review` → INSERT `experience_review` + soft-delete review notif.

---

## 8. Source map (for deep dives)

| Concern | Mobile | API |
|---------|--------|-----|
| HTTP base + retry + logging | `src/api/requests.ts`, `src/utils/devLoggedFetch.ts` | — |
| Auth0 tokens + refresh | `src/stores/auth.ts`, `src/utils/auth.ts` | — |
| Wing user + profile | `src/api/user.ts`, `src/api/profile.ts`, `Onboarding.tsx`, `DaterWaitlistInfo.tsx` | `controllers/user.ts`, `controllers/profile.ts`, `services/user.ts`, `services/profile.ts` |
| Search + book | `src/api/experience.ts`, `BookAnExperience*`, `ExperienceResultDetail.tsx`, `SwipeOptionsScreen.tsx` | `controllers/experience.ts`, `controllers/reservation.ts`, `services/experience-search.ts`, `services/experience-offering.ts`, `services/transaction.ts` |
| Offering + location | `src/api/offering.ts`, `src/api/locations.ts` | `controllers/offering.ts`, `controllers/location.ts`, `services/offering.ts`, `services/location.ts` |
| Reviews | — | `controllers/experience.ts` (`createReview`/`updateReview`), `services/experience-review.ts` |
| Guest join/leave | — | `controllers/experience.ts` (`join`/`leave`), `services/experience-guest.ts` |
| Push notifications (scheduling) | `src/utils/push.ts`, `PATCH /user/pushtoken` | `controllers/push-notification.ts`, `services/notification.ts` |
| Push notifications (delivery) | — (device receives) | **`wingapp-notifications-job`** |
| Restaurant catalog | — | **`wingapp-restaurants-job`** (writes `offering`+`location`) + `services/restaurant.ts` |
| Stripe + Connect | `src/api/paymentMethods.ts`, `PaymentMethod*` screens | `controllers/user.ts` (cards), `controllers/reservation.ts` (pay + connect), `services/external/stripe.ts` |
| Viator / Yelp / Google / Resy | — | `services/external/*`, `services/experience-search.ts`, `types/viator.ts`, `api/resy.mjs` (jobs) |
| JWT validator | — | `lib/jwt-validator.ts`, `lib/jwt-metadata.ts` |

---

## 9. One-line “what happens” table

| Moment | Frontend | Backend | DB | Side effect |
|--------|----------|---------|----|-------------|
| Launch | hydrate tokens | — | — | — |
| Signup | SignUp form | Auth0 | — | tokens stored |
| Onboarding | Onboarding form | `POST /user`, `POST /profile` | `user`, `profile` | Auth0 `app_metadata` set; token refreshed |
| Home | `DaterHomePage` | `GET /user`, `GET /experience`, `GET /location`, `GET /profiletype` | — | — |
| Search | `BookAnExperience` | `POST /experience/search` | — | Viator/Resy reads; ranking |
| Book | `BookExperienceCostBreakdown` | `POST /reservation[/transaction]` | `experience`, `experience_offering`, (`transaction`), `notification` | Stripe PI; email; push schedule |
| Host confirm | Host UI | `PATCH /reservation/:id/confirm` | `experience_offering.confirmAt` | — |
| Reveal | detail screen | `POST /experience/reveal/:id` | `experience.revealed`, delete 30h/24h `notification` | — |
| Guest join | deep link | `POST /experience/:id/experience-guest/join` | `experience_guest` | push goes to both |
| Before experience | — | — | — | **notifications-job** sends Expo push, marks `sentAt` |
| Reconcile | admin | `PATCH /reservation/:id/transaction/:tid` | `transaction` | Stripe Connect PI; receipt email |
| Review | `ReviewExperience` | `POST /experience/:id/review` | `experience_review`, soft-del review `notification` | — |
| Cancel | detail screen | `DELETE /experience/:id` | soft-del `experience`, `experience_offering`, `notification` | — |

---

## 10. Visual summary (whole journey in one frame)

```
APP LAUNCH ─► LOGIN/SIGNUP (Auth0) ─► ONBOARDING ─► (POST /user, POST /profile) ─► token refresh
       │
       ▼
DATER HOME (GET /user, GET /experience, GET /location)
       │
       ▼
BOOK AN EXPERIENCE ── POST /experience/search ──► search service ──► Viator / Resy / DB offerings
       │                                               │
       │                                               └─► top-3 cards
       ▼
CHOOSE + PAY ── POST /reservation/transaction ── Stripe PI
       │
       ▼
INSERT experience + experience_offering + transaction + notification(s)
       │                              │
       │                              ▼
       │                  wingapp-notifications-job (cron)
       │                       ├─► Google Maps (ETA / transit)
       │                       └─► Expo Push to user.pushTokens[] + experience_guest.user.pushTokens[]
       │
       ▼
(optional) REVEAL, GUEST JOIN
       │
       ▼
EXPERIENCE OCCURS — host confirms / admin reconciles transactions
       │
       ▼
REVIEW ── POST /experience/:id/review ─► experience_review
```

---

*End of document. Source-of-truth files scanned: `wingapp-mobile/src/**`, `wingapp-api/src/routes/**`, `wingapp-api/src/controllers/**`, `wingapp-api/src/services/**`, `wingapp-api/src/models/**`, `wingapp-notifications-job/src/**`, `wingapp-restaurants-job/**`. For environment specifics see `WING_2026-04-22_LOCAL_DEBUG_API_REVIEW.md`, `WING_EXPO_LOCAL_SETUP_CHECKLIST.md`, `WING_EXPO_TROUBLESHOOTING_CHEATSHEET.md`. Index: `WING_WING_DOCS_INDEX.md`.*
