# Wing — Search, Resy restaurants job, Viator DB, aur bookings (samajhne wala guide)

Yeh guide **sirf padh kar** samajhne ke liye likha hai: pehle **concept**, phir **order mein kya hota hai**, phir **common confusion** (jaise Resy par slot / seat / fee).

Technical paths short rahenge (`wingapp-api/...`, `wingapp-restaurants-job/...`). Poora flow same codebase par based hai.

---

## 1. Sabse pehle — teen alag cheezein mat milao

Log aksar ye confuse kar lete hain:

1. **Catalog sync** — Bahar se data **laakar DB mein likhna** (Resy job, ya search ke waqt Viator se offering banana).
2. **Search / match** — User ki choice (date, time of day, location, cuisine…) ke hisaab se **DB + kabhi live API** se **options turant dhundhna**.
3. **Book** — User ne jo choose kiya **sirf Wing ke DB mein `experience` + `experience_offering` row** banwana — **Resy ya Viator par automatic “seat confirm” API is codebase ke reservation handlers mein nahi hai.**

Neeche teenon alag-alag samjhayenge.

---

## 2. `POST /experience/search` — user ki nazron se kya hota hai?

### 2.1 Request valid hai?

Pehla step middleware hai: body Joi schema se check hoti hai (`startDateTime`, `experienceType` dining / activity / both, coordinates, distance, timezone, wagaira). Fail ho to turant error — database tak jaane se pehle.

### 2.2 Controller `search` — basic gates

Phir controller chalta hai:

1. JWT se **user** aur **profile** pakda jata hai; user DB se verify hota hai.
2. **`startDateTime` past na ho** — warna reject.
3. **Overlap check:** Is user ki pehle se koi **experience** hai jiska time is nayi search ke window se takraye — to error (“already booked overlapping”). Matlab duplicate booking chaos kam karne ke liye.

Ye sab **sirf Wing DB** aur validation hai — Resy/Viator abhi tak optional.

### 2.3 Asli kaam — `buildSearchExperience`

Ab **`experience-search`** service decide karti hai tum **dining**, **activity**, ya **don** mang rahe ho:

**Dining (`experienceType === 'dining'`):**

1. Database se **restaurant offerings** list banayi jaati hai — distance + cuisine filters SQL mein (`offering` + `location` + `restaurant` join; detail §6).
2. Admin ne jo **`restaurant`** table mein edits kiye (average bill, cuisine array, wagaira), wo **`offering.answers`** ke saath merge ho sakte hain aur kabhi **`needsReview`** flag lag sakta hai.
3. **`rankRestaurant`** har venue ko score karti hai aur **top ~3** rakhti hai. Yahi step **stored Resy slots** ko tumhari **date + Morning/Afternoon/Evening** se match karti hai (§5 detail).

**Activity (`experienceType === 'activity'`):**

1. **Don streams parallel:**  
   - **Wing activities:** sirf DB — locations jo tumhari radius ke andar hon aur profile type **activity** ho, aur time-of-day rules pass karen.  
   - **Viator:** pehle **Viator HTTP APIs** se products dhundhe jaate hain; **naya product mila to turant DB mein `offering` + `location` save** ho sakta hai (§7); phir **`viator_activity_patch`** table se filter — **patch na ho ya active na ho** to poori list gayab ho sakti hai.
2. Don lists mix karke **random** shuffle, **sirf 3** experiences user ko.

**Both:**

Restaurant pipeline + activity pipeline dono; dining ke baad ka activity start time roughly dining + average travel / changeover se shift hota hai.

**Output:** Har item mein roughly **start/end time**, **estimated cost**, **`typeName`** (`restaurant`, `viator-activity`, `wing_activity`), aur **`offering`** blob jo UI dikha sakti hai.

---

## 3. Resy API se restaurant aata hai — slot, seat, fee kya hai?

### 3.1 Batch job actually kya fetch karta hai?

Folder **`wingapp-restaurants-job`**, entry **`index.mjs`**:

1. **`venuesearch/search`** — geo radius ke andar venue ids list (code mein lat/long fix Miami-area jaisa dikhta hai).
2. **`4/find`** — un venues ke liye availability-style payload — params mein **`day`** = **job jis din chala us din ki date** (`yyyy-MM-dd`), **`party_size: 2`** fix, **`venue_id`** comma-separated ids.

Matlab jo Resy response **`offering.answers`** ke andar save hota hai, wo ek **snapshot** hai:

- **Party size** almost hamesha **2** (job ke hisaab se), tumhari app search ke **`partySize`** (2–8) se match karne ka logic **restaurant ranking mein slots par apply nahi hota**.
- **Day** job-run wala din hai, **user ki future booking date** nahi — phir bhi ranking code **`experience.date`** + saved **`slots`** ko combine karke slot times normalize karti hai (`needsReview` wale stale slots ke liye alag parsing).

Isliye practically: **DB mein jo slots dikhte hain wo “user ki exact dinner date + party ke liye live Resy guarantee” nahi hain** — wo **last job snapshot + scoring tricks** hain taaki kuch reasonable match ho.

### 3.2 Search time par “us slot me fee / seat” kaise decide hota hai?

Do alag concepts:

**A) Seat / time match (filter + score)**

- Agar **`offering.answers.slots`** array hai aur non-empty:  
  - Code har slot ka **start time** nikalta hai aur dekhta hai wo user ke **date** aur **time of day bucket** (Morning / Afternoon / Evening) ke andar padta hai ya nahi.  
  - Agar user ne **`startTime`** bheja hai to aur strict check: slot user ke start ke baad aur interval ke andar hona chahiye (`doesVenueHaveTimeSlotsGreaterThanStartTime`).
- Agar **`slots` hi nahi** (jaise kai admin-managed rows): filter **slots se nahi**, sirf ye check hota hai ki time-of-day key valid ho; aage **assume** kar liya jata hai ki venue dikh sakta hai.

**B) Fee / price feel**

- Restaurant ke liye estimate cost **`getCostBreakdown(venue.average_bill_size * partySize)`** jaisa flow use karta hai — yani **“per person average bill × party size”** jaisa estimate, **Resy ke kisi ek slot ki exact quote nahi**.
- Ranking mein **`price_range`** (Resy venue ka 1–4) ko user ke **`diningSpend`** (`$` se `$$$$`) se compare karke score badta ya ghatata hai — yeh **preference match** hai, **invoice nahi**.

**Short:** Resy se jo data aata hai usme **time slots + seating type (`config.type`)** scoring mein help karte hain; **exact per-slot fee ya “4 logon ke liye abhi ye table free hai”** is pipeline mein **real-time guarantee** ke taur par implement nahi dikhta.

---

## 4. Viator — data DB mein kab aur kyun jata hai?

**File:** `wingapp-api/src/services/external/viator.ts`, function **`getViatorActivities`**.

**Idea:** User ne search maari → Viator se product list aayi → har **naya** product code ke liye:

1. Product detail GET, schedule GET, locations bulk (+ kabhi Google Places) — **HTTP**.
2. Phir **`upsertViatorOfferingAndLocation`:**  
   - **`offering`** row: `externalId = "viator:" + productCode`, `answers` mein poora product+schedule blob, profile type **viator**.  
   - **`location`** row: us offering se link.

**Purana product** pehle se DB mein hai to dobara save nahi — purane `answers` se hi `existingInDatabaseActivities` list banti hai.

**Alag gate:** **`viator_activity_patch`** table mein jo product codes allow hain / `active` hai, search unke baad hi Viator results rakhta hai — matlab prod mein intentionally “kuchhi Viator tours on” rakha ja sakta hai.

**User ke search slot se match:** Availability **Viator schedule** (`filterByAvailability` + scoring) se hoti hai — yeh **live API** side se zyada meaningful hai taaki din / time rough align ho; phir bhi **final “booked on Viator”** reservation create yahan nahi hota (§8).

---

## 5. Dining search SQL — “filter” mentally kaise samjhen

**Function:** `getAllRestaurantOfferingsByFilters` (`offering` service).

- **Geography:** User point se `location` table ke point ka **mile distance** PostgreSQL `<@>` se; `distanceInMiles` se kam.
- **Cuisine:**  
  - Branch 1: **`restaurant.cuisine`** array aur user ke **`cuisineTypes`** ka **overlap**.  
  - Branch 2: `restaurant.cuisine` null ho to **`offering.answers` JSON** ke andar venue `type` string user cuisines se match.
- Don branches **`restaurant` table INNER JOIN** maangti hain aur **`restaurant.active`**.

**Practical:** Sirf **`wingapp-restaurants-job`** agar **`offering` + `location`** likhe aur **`restaurant` row na bane**, to yeh dining query **un rows ko pick nahi karegi**. `restaurant` row aksar **admin / API onboarding** ka hissa hai — yeh pipeline ka weak link ho sakta hai agar tum expect kar rahe ho “job chala = search mein dikhega”.

---

## 6. `rankRestaurant` — scoring ko ek line mein

Filter (slot / time) ke baad har bache hue venue par chain:

1. **`priceRange`** — user `diningSpend` vs venue `price_range`.  
2. **`cuisineType`** — venue type vs user cuisines.  
3. **`seatingPreference`** — profile answer vs slot `config.type` (Inside/Outside jaisa map).  
4. **`availableTimeSlot`** — phir se time fit par extra score.  
5. **`randomFactor`** — thoda randomness.

Phir sort, top 3 (ya mystery mode mein type diversify).

---

## 7. `reveal`, `POST /reservation`, `POST /reservation/transaction`

**`POST /experience/reveal/:id`:** Sirf **`experience.revealed = true`** DB update + related notifications delete — koi third-party HTTP nahi.

**`POST /reservation/`:** Ek transaction ke andar **experience** create, har selection ke liye **experience_offering** — **sirf DB**. Email/push side effects.

**`POST /reservation/transaction`:** Wahi DB create + **Stripe PaymentIntent sirf `wing_activity` type** par; comment ke mutabiq **restaurant aur viator par charge path yahan intentionally nahi**.

**Kisi bhi path par Resy hold / Viator booking reference save karte hue dikhna zaroori nahi** — matlab “unke system par confirm” ka proof automatically yahan generate nahi hota.

---

## 8. Ek nazar mein — data kahan se, kab

| Scenario | Main read | DB write (catalog) |
|----------|-----------|-------------------|
| User dining search | `offering` + `location` + `restaurant` + merged JSON | — |
| User Viator activity search | Viator HTTP + DB offerings | Naye products: `offering` + `location` |
| User Wing activity search | `location` + linked `offering` | — |
| Nightly / manual Resy job | Resy HTTP | `offering` (resy:*), `location` |

---

## 9. Agar tumhe doc “verify” karna ho

| Topic | Kahan dekhen |
|-------|----------------|
| Search route + Joi | `wingapp-api/src/routes/experience.ts`, `src/types/experience/search-experience.ts` |
| Controller gates | `wingapp-api/src/controllers/experience.ts` → `search` |
| Dining + Viator orchestration | `wingapp-api/src/services/experience-search.ts` |
| Resy slots + ranking | `wingapp-api/src/lib/scoring-algorithm/restaurant.ts`, `shared.ts` |
| Viator HTTP + DB upsert | `wingapp-api/src/services/external/viator.ts` |
| Restaurant SQL filters | `wingapp-api/src/services/offering.ts` → `getAllRestaurantOfferingsByFilters` |
| Resy job | `wingapp-restaurants-job/index.mjs`, `api/resy.mjs` |
| Reservation + Stripe rule | `wingapp-api/src/controllers/reservation.ts` |

---

*Yeh guide explain karne ke liye hai; production behavior env, cron frequency, aur admin data par depend karta hai.*
