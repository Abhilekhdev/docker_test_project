# Experience Search — Function-by-function flow + Resy job + Viator DB

Is document ka scope:

1. **`POST /experience/search`** — har layer par kaun-sa **function** call hota hai, **DB vs HTTP**, sequence.
2. **`wingapp-restaurants-job`** — Resy API se data kaise aata hai, **kis table** mein save, aur search query **kaise filter** karti hai.
3. **Viator** — data **kab** aur **kaise** Wing ke **PostgreSQL** mein persist hota hai (`offering` / `location`).
4. Short recap: **`reveal`**, **`POST /reservation`**, **`POST /reservation/transaction`** (pehle jaisa intent).

Paths: `wingapp-api/...` ya repo root `wingapp-restaurants-job/...`.

---

## TL;DR — Booking proof third-party par?

| Flow | External read APIs | Third-party **booking/checkout** API reservation create par? |
|------|-------------------|-------------------------------------------------------------|
| Viator activity | Search time: Viator Partner API | **Nahi** — sirf `experience` + `experience_offering` DB |
| Restaurant (Resy-shaped `offering`) | Job time: Resy API; search time: **DB only** | **Nahi** — same internal DB reservation |
| Wing activity | DB | Stripe optional `/reservation/transaction` + `wing_activity` only — vendor booking API **nahi** |

---

## Part 1 — `POST /experience/search` (har function)

**HTTP:** `POST /experience/search`  
**Route:** `wingapp-api/src/routes/experience.ts`

```23:23:wingapp-api/src/routes/experience.ts
router.post('/search', requestValidator({ body: searchExperienceSchema }), experienceController.search)
```

### 1.1 Middleware: `requestValidator({ body: searchExperienceSchema })`

| Step | Function / module | Kya karta hai |
|------|-------------------|---------------|
| 1 | `requestValidator` (`src/lib/request-validator.ts`) | `ctx.request.body` ko Joi se validate karta hai; error → `BadRequestError` + field errors |
| 2 | `searchExperienceSchema` (`src/types/experience/search-experience.ts`) | `experienceType`, `partySize`, `startDateTime`, `date`, `timeOfDay`, `departureLatitude/Longitude`, `distanceInMiles`, `timezoneOffset`, optional `cuisineTypes`, `activityTypes`, spend defaults |

### 1.2 Controller: `search` (`src/controllers/experience.ts`)

| Order | Call | Source |
|-------|------|--------|
| 1 | `getAppMetadata(ctx)` | JWT → `userId`, `profileId` |
| 2 | Body → `SearchExperienceDto`; `startDateTime` → `Date` | Request |
| 3 | `userService.getOne({ id: userId }, true)` | **DB** (`user` + relations) |
| 4 | Profile `profileId` match | Memory |
| 5 | `dateFns.isPast(startDateTime)` | Validation |
| 6 | `experienceService.getAll({ startTime: ISO, userId })` | **DB** — overlap avoid |
| 7 | Overlap: `dateFns.areIntervalsOverlapping(searchInterval, existingInterval)` | Memory |
| 8 | `experienceSearchService.buildSearchExperience(searchExperience, user, profile)` | Mixed (neeche) |
| 9 | `ctx.status = 201`, `ctx.body = result` | Response |

---

### 1.3 Service: `buildSearchExperience` — entry (`src/services/experience-search.ts`)

**Function:** `buildSearchExperience(experience, user, profile)`

| Branch | `experienceType` | Child flow |
|--------|-------------------|------------|
| A | `'activity'` | Parallel: `getSearchExperienceResultForViatorActivities` + `getSearchExperienceResultForWingActivity` → concat → random sort → **slice(0, 3)** |
| B | `'dining'` | `searchRestaurantOfferings` → `ScoreRestaurant.rankRestaurant` → `buildSearchExperienceResultForDinings` |
| C | `'both'` | `searchAndRankBoth` → either `buildSearchExperienceResultForBoth` ya sirf dinings |

Neeche har helper ka breakdown.

---

### 1.4 Activity path — Wing (internal offerings)

**`getSearchExperienceResultForWingActivity(location, experience, user)`**

| # | Function | Role |
|---|----------|------|
| 1 | `searchActivities(experience, location)` | DB locations + Activity-type offerings + time filters |
| 2 | `ScoreActivity.rankActivities(wingActivities, experience, location)` | Score / rank (`src/lib/scoring-algorithm/activity.ts`) |
| 3 | `buildSearchExperienceResultForWingActivity(experience, scoredActivities)` | Har activity → `getWingActivityOffering` |

**`searchActivities`**

| # | Function | Role |
|---|----------|------|
| 1 | `searchLocationsByDistance(location, distanceInMiles)` | → `locationService.getOfferingsByLocationAndDistance(lat, lng, miles, ['offering'])` — **DB** |
| 2 | Loop | Sirf `location?.offering?.type?.name === ProfileTypeName.Activity` |
| 3 | `ScoreActivity.isActivityAvailableAtTimeOfDay(...)` | Time window filter |

**`getWingActivityOffering(activity, experience)`**

| # | Step | Source |
|---|------|--------|
| 1 | Cost, start/end times, `requireConfirmation` | Scoring helpers |
| 2 | Optional `profileService.getOne` for image | **DB** |
| 3 | `typeName: WING_ACTIVITY`, `offering` = location + offering nested | Memory / DB-backed object |
| 4 | Agar `offering.profileId === WING_ACTIVITY_PROFILE_ID` | `profileId` null jab confirmation not required — pricing/flow hack |

---

### 1.5 Activity path — Viator

**`getSearchExperienceResultForViatorActivities(location, experience)`**

| # | Function | Role |
|---|----------|------|
| 1 | `searchViatorActivities(location, experience[, changeover])` | Viator HTTP + patch filter + DB reads |
| 2 | `ScoreViator.rankViatorActivities(viatorActivities, experience, location)` | Filter by time-of-day, party, price band, distance, rating (`src/lib/scoring-algorithm/viator.ts`) |
| 3 | `buildSearchExperienceResultForViatorActivity(experience, scored)` | UI DTO banana |

**`searchViatorActivities` (critical sequence)**

| # | Call | DB / HTTP |
|---|------|-----------|
| 1 | `ViatorService.getDestinationByLatLong(location)` | **HTTP** `GET .../v1/taxonomy/destinations` → nearest `destinationId` |
| 2 | `ViatorService.getViatorActivities({ destination, timezoneOffset, startDateTime, party_size, activityTypes })` | **HTTP** + **DB writes** (neeche Part 3) |
| 3 | `viatorActivityPatchService.get(productCodes)` | **DB** table `viator_activity_patch` (Objection model: `viatorActivityPatch`) — `whereIn productCode`, `deletedAt null` |
| 4 | Agar koi patch `active` nahi → `[]` return | Allow-list / safety gate |
| 5 | Patches milen to products **intersect** patch list se | Only “patched” products |
| 6 | Return filtered `ViatorActivities[]` | Memory |

**`buildSearchExperienceResultForViatorActivity`**

Har activity: `ScoreViator.getDescription`, image from `activity.details.images`, start/end from schedule + timezone, **`ViatorService.getViatorOfferingAndLocation(activity)`** — **DB** `offering` by `externalId = viator:<productCode>` + **DB** `location` by `offeringId`. Phir `ExperienceType.VIATOR_ACTIVITY` ke saath response object.

---

### 1.6 Dining path

**`searchRestaurantOfferings(experience, location)`**

| # | Call | Role |
|---|------|------|
| 1 | `offeringService.getAllRestaurantOfferingsByFilters({ cuisineTypes, location, distanceInMiles })` | **DB** — complex query (neeche Part 2.4) |
| 2 | `restaurantService.get(offerings.map(o => o.id))` | **DB** — `restaurant` rows by `offeringId` |
| 3 | `mergedRestaurantData` reduce | Jo `restaurant.active` + edited fields hain, unhe `offering.answers` mein merge; `needsReview: true` tag |

**`buildSearchExperienceResultForDinings`**

| # | Step |
|---|------|
| 1 | Har `ScoreVenue`: `deriveExperienceTime`, `getCostBreakdown` |
| 2 | `typeName: RESTAURANT`, `offering: scoreVenue.venue` (OfferingModel-shaped) |

---

### 1.7 `both` path

**`searchAndRankBoth`**

| # | Parallel / serial | Role |
|---|------------------|------|
| 1 | `searchRestaurantOfferings` | DB restaurants |
| 2 | `ScoreRestaurant.rankRestaurant` | Rank venues |
| 3 | `Promise.all([searchViatorActivities(..., AVERAGE_DINING_DURATION + AVERAGE_TRAVEL_TIME), searchActivities(...)])` | Viator + Wing with shifted start time |
| 4 | Har top dining ke liye dining location coords se `ScoreViator.rankViatorActivities` + `ScoreActivity.rankActivities` | Geographic weighting |
| 5 | Random pick among top 3 merged activities per dining | `{ dining, activity }[]` |

**`buildSearchExperienceResultForBoth`**

- Restaurant offering + either `getViatorActivityOffering` (Viator) ya `getWingActivityOffering` (Wing) based on `typeOfViatorActivities(activity)`.

---

## Part 2 — `wingapp-restaurants-job` (Resy → DB)

**Repo folder:** `wingapp-restaurants-job/`  
**Entry:** `index.mjs`  
**DB:** Same Postgres as API — `db/knexfile.mjs` (`POSTGRES_*` env).

### 2.1 High-level job flow

| Step | File / function | Kya hota hai |
|------|-----------------|--------------|
| 1 | `index.mjs` | Knex + Objection boot; `getRestaurantsByLocation()` |
| 2 | `getRestaurantsByLocation` (`api/resy.mjs`) | Resy HTTP (neeche) |
| 3 | Har venue | `upsertResyOfferingAndLocation(venue)` |

### 2.2 Resy HTTP — `api/resy.mjs`

**`getRestaurantsByLocation()`**

| # | HTTP | Purpose |
|---|------|---------|
| 1 | `POST {RESY_API_URI}3/venuesearch/search` | Body: geo (default **Miami-area** lat/lng `25.7616798`, `-80.1917902`, radius `12100`), `per_page: 999`, `types: ["venue"]` |
| 2 | Har hit se `id.resy` collect | Venue id list |
| 3 | `GET {RESY_API_URI}4/find` | Params: lat, long, `day` = today, `party_size: 2`, `venue_id` = comma-separated ids, `time_filter: null` |
| 4 | Map results | Phone merge from search hits |

**`getRestaurantInformation(resySlug, locationCode)`**

| # | HTTP | Purpose |
|---|------|---------|
| 1 | `GET {RESY_API_URI}3/venue` | `url_slug`, `location`; header `Authorization: ResyAPI api_key="..."` |
| 2 | Return | Detailed address/lat/long for location row when missing |

### 2.3 `upsertResyOfferingAndLocation(resy)` — `index.mjs`

| Step | Action | Table / column |
|------|--------|----------------|
| 1 | `externalId = resy:<venue.id.resy>` | Logical key |
| 2 | `OfferingService.getOneByExternalId(resyId)` | **DB `offering`** |
| 3a | Naya: `ProfileTypeModel` where `name = 'resy'` → `typeId` | **`profile_type`** |
| 3b | Insert `offering`: `businessName`, `externalId`, **`answers: resy`** (full Resy venue payload), `createdBy: 'robot'` | **`offering`** |
| 3c | Existing: `OfferingService.update` — sirf **`answers`** refresh, `updatedBy: 'robot'` | **`offering`** |
| 4 | `LocationService.getOneByOfferingId({ profileId: null, offeringId })` | **`location`** |
| 5 | Agar location missing ya `address1` empty | `getRestaurantInformation` → then create/update **location**: `offeringId`, lat/lng, address, city, state, zip, `description` | **`location`** |

**Note:** Job **sirf** `offering` + `location` update karta hai. **`restaurant` table is job mein touch nahi hota.**

### 2.4 Search-time dining filter — `offeringService.getAllRestaurantOfferingsByFilters`

**File:** `wingapp-api/src/services/offering.ts` — function `getAllRestaurantOfferingsByFilters`

Do sub-queries **`UNION`**, phir **`location` join** + **Postgres distance** (`<@>` point operator, miles):

**Branch A — `searchForRestaurants`**

- `JOIN restaurant ON restaurant.offeringId = offering.id`
- `restaurant.active = true`, `restaurant.deletedAt IS NULL`
- **Cuisine:** `WHERE ? && restaurant.cuisine` — request ke `cuisineTypes` array ka **overlap** restaurant ke `cuisine` (Postgres array) se
- Distance: `(point(userLng, userLat) <@> point(location.longitude, location.latitude)) < distanceInMiles`

**Branch B — `searchForOfferings`**

- Same `restaurant` join + `active`
- **`restaurant.cuisine IS NULL`** → Resy-only text match: `offering.answers -> 'venue' ->> 'type' IN (...)` user ke cuisine list se
- Same distance join on `location`

**Important operational point:** Dono branches mein **`INNER JOIN restaurant` hai**. Matlab sirf **`offering` + `location` (job)** se restaurant **tabhi search mein dikhega** jab us `offeringId` par ek **`restaurant` row** ho (usually **admin UI / API** `restaurant.create` se), `active`, soft-delete rules ke saath. Agar prod mein sirf job chalta hai aur `restaurant` row nahi banti, **dining query in rows ko return nahi karegi** — yeh pipeline ka practical gap ho sakta hai.

### 2.5 `experience-search` merge with `restaurant` edits

After base list, `restaurantService.get(offering ids)` se **edited** `averageBillSize`, `description`, `cuisine`, etc. **`offering.answers.venue`** par override; `needsReview: true` set for admin review tracking.

---

## Part 3 — Viator data kab DB mein jaata hai

**Primary writer:** `wingapp-api/src/services/external/viator.ts` — **`getViatorActivities`**.

### 3.1 Sequence (search-time, lekin side effect: DB insert)

| # | Function | DB | HTTP |
|---|----------|----|------|
| 1 | `searchViatorByActivityType` | — | `POST .../products/search` (tags × destination × date) |
| 2 | `divideNewAndExistingInDatabaseActivities` | **`offering.getOneByExternalId('viator:'+code)`**, **`locationService.getOneByOfferingId`** | — |
| 3 | New products: `getActivitySchedules` | — | `GET .../availability/schedules/{productCode}` |
| 4 | New products: `getActivitiesWithDetails` | — | `GET .../products/{productCode}` |
| 5 | New products: `getLocationsByViatorActivities` | — | `POST .../locations/bulk` (+ optional **Google Places** for non-TripAdvisor refs) |
| 6 | **Loop** `upsertViatorOfferingAndLocation(activity)` | **INSERT/linked** | — |
| 7 | Merge new + existing from DB | — | — |
| 8 | `filterByAvailability` + `minTravelersPerBooking` | — | Uses schedule already in memory |

### 3.2 `upsertViatorOfferingAndLocation` — columns

| Table | What gets written |
|-------|-------------------|
| **`profile_type`** | Lookup `name = 'viator'` → `typeId` |
| **`offering`** | `typeId`, `businessName` = title, **`externalId = viator:<productCode>`**, **`answers` = full `ViatorActivities` object**, `createdBy: 'robot'` via `OfferingService.createAllColumns` |
| **`location`** | `offeringId`, lat/lng, address fields, `description`, `createdBy` / `updatedBy: 'robot'` |

### 3.3 Read path search ke dauran

- **`getViatorOfferingAndLocation`:** `offering` by `externalId` + `location` by `offeringId` — **DB only** (row pehle search ke same request mein bana ho sakta hai agar product naya tha).

### 3.4 `viator_activity_patch` gate

**Service:** `src/services/viator-activity-patch.ts` → model `tableName = 'viatorActivityPatch'` (migration file table: **`viator_activity_patch`**).

- `get(productCodes)`: deleted nahi, `productCode IN (...)`
- **`searchViatorActivities`:** agar returned patches mein **`active`** koi nahi → **empty list** (sari Viator results drop)
- Agar patches hain → sirf un product codes jo patch list mein hain

Admin-facing CRUD: `wingapp-api/src/routes/viator-activities.ts`.

---

## Part 4 — Scoring libraries (reference)

| Library file | Used for |
|--------------|----------|
| `src/lib/scoring-algorithm/restaurant.ts` | `rankRestaurant`, slot/time-of-day checks (`doesVenueHaveTimeSlotsAvailable`, spend tiers) |
| `src/lib/scoring-algorithm/viator.ts` | `rankViatorActivities`, `getNearestDestination`, price/distance/rating |
| `src/lib/scoring-algorithm/activity.ts` | Wing activity ranking |
| `src/lib/scoring-algorithm/shared.ts` | Shared time buckets, `deriveExperienceTime`, `deriveExperienceTimeForBoth` |

---

## Part 5 — `reveal` + reservations (short)

### `POST /experience/reveal/:id`

- **`experienceController.reveal`:** `experienceService.update(..., { revealed: true })` — **DB**; notification deletes — **DB**.
- **No** Resy/Viator HTTP.

### `POST /reservation/` — `createReservation`

- Transaction: create **`experience`**, har item **`experience_offering`** — **DB**.
- Email/push — internal.
- **No** Resy/Viator booking API.

### `POST /reservation/transaction` — `createReservationWithTransaction`

- Same DB creates.
- **`wing_activity`** par hi Stripe PaymentIntent (`capture_method: manual`, etc.) — comment: **restaurants aur viator par charge nahi**.

---

## Part 6 — File index

| Topic | Path |
|-------|------|
| Search route | `wingapp-api/src/routes/experience.ts` |
| Search controller | `wingapp-api/src/controllers/experience.ts` |
| Search orchestration | `wingapp-api/src/services/experience-search.ts` |
| Viator client + DB upsert | `wingapp-api/src/services/external/viator.ts` |
| Restaurant offering SQL | `wingapp-api/src/services/offering.ts` (`getAllRestaurantOfferingsByFilters`) |
| Restaurant overrides | `wingapp-api/src/services/restaurant.ts` |
| Activity scoring | `wingapp-api/src/lib/scoring-algorithm/*.ts` |
| Resy batch job entry | `wingapp-restaurants-job/index.mjs` |
| Resy API calls | `wingapp-restaurants-job/api/resy.mjs` |
| Job DB models/services | `wingapp-restaurants-job/services/offering.mjs`, `location.mjs`, `db/knexfile.mjs` |
| Viator patch | `wingapp-api/src/services/viator-activity-patch.ts` |

---

*Document aligned with codebase snapshot; agar `restaurant` join aur job-only offerings ka mismatch dikhe to onboarding/backfill process verify karna chahiye.*
