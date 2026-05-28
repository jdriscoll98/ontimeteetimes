# Plan: Migrate booking provider from foreupsoftware → Eagle Club Systems

## Approach

Swap the underlying booking API across both the Firebase Functions package and the Next.js app in one coherent change. The new API (`api.eagleclubsystems.online`) is **stateless** — no token, no session — so every call simply carries a `BCC` config object plus the customer's `CustomerID` as `BCC.IntOperatorID`. Login is reduced to "verify creds + fetch CustomerID + price class + current reservations."

Approach summary:

1. **Extract a shared, pure-HTTP Eagle client** (`functions/src/eagle.ts`) with no Firebase dependencies. Both the Firebase Functions and the Next.js app consume it. This collapses the duplicated `golf.ts` files into one source of truth.
2. **Replace** the existing `golf.ts` in both packages with thin "use-case" wrappers (`bookEighteenHoles`, `listReservations`, etc.) that pull creds from Firestore via their respective Firebase SDK (Admin in Functions, Web in Next.js) and delegate to the shared client.
3. **Preserve `scheduleBookEarliest`** behavior exactly (weekend-only, 10-day-out, two-account front/back split, hardcoded creds **left as-is** per user instruction). Only the underlying booking calls change.
4. **Upgrade `scheduleTasks`** to minute granularity. Schedule docs change from `{after: number, before: number}` (hours 0-23) to `{after: string, before: string}` ("HHMM" — aligns with Eagle's time format). Scheduled function continues running every 5 minutes.
5. **Replace the AI text-to-schedule frontend** (`ScheduleForm` + `src/lib/openai.ts`) with plain native `<input type="date">`, `<input type="time">`, and a player selector. Removes the OpenAI dependency entirely.
6. **Re-use the login response for list-bookings** — `customer.LstCurrentReservations[]` already contains every field the cancel call and the bookings UI need. No separate "list" endpoint.

### Why this shape

- **Stateless API → trivial integration.** No token refresh, no cookie jar, no retry-on-401. Just a function that takes `{email, password}` and returns `{customerId, priceClassId, reservations, cookies?}`.
- **Shared client via path alias.** Both packages have `axios` already; the Eagle client has zero other deps. Next.js can resolve a relative path to `../functions/src/eagle.ts` via `tsconfig.json` `paths`. This is the cheapest possible "no duplication" approach — no monorepo tooling, no symlinks, no build step. Firebase Functions deploys only the `functions/` directory, so the file *must* live there; the Next.js side just imports it.
- **Drop OpenAI text parsing.** The user originally wired GPT-4 to translate "saturday after 10am" into a structured schedule. Native date/time inputs do the same job with zero LLM cost and zero parsing failures, and the new minute-granularity requirement is easier to express as `<input type="time">` than to coax out of a language model reliably.

## Trade-offs

- **Shared client via tsconfig `paths`** (chosen) vs. **two mirrored files**: chosen because the user explicitly asked to collapse if possible, and the dep surface is tiny (only `axios`). Risk: a Next.js build pulling code from outside `src/` is unconventional; if anything trips up the build, fallback is to mirror the file with a simple `prebuild` copy script.
- **Keep `scheduleBookEarliest` creds hardcoded** (chosen, per user instruction) vs. **move to Firestore** (rejected): rejected — user said leave it. We'll add a `// TODO: move to Firestore /auth/{email}` comment so it's not lost.
- **Schedule time as `"HHMM"` string** (chosen) vs. **integer minutes (0-1439)** vs. **two fields `hour:int, minute:int`**: HHMM string matches Eagle's wire format and is what the new `<input type="time">` (which returns "HH:MM") trivially produces (strip the colon). Trade-off: numeric range queries on Firestore become string comparisons, but they still sort correctly because HHMM is zero-padded.
- **Migrate existing Firestore `schedule` docs**: existing docs use integer hours. Two options:
  - **No backfill needed** — `/schedule` collection is empty today, so the new HHMM string shape becomes the only shape from day one.
- **18-hole front/back pairing in search**: each `LstAppointment` entry is one nine. We pair a Front (`Master_NineID:108`) at time `T` with a Back (`Master_NineID:109`) at time `T + TurnTime` (126 min). Skipped: trying to support 9-hole bookings — preserving current behavior (always 18).
- **Set-Cookie forwarding**: Even though no auth token is returned, we'll capture `Set-Cookie` from the login response and forward it on subsequent calls as a safety net. Costs nothing; may matter if there's hidden session state.
- **Reservations list as login side-effect**: Calling login just to read reservations is wasteful, but it's exactly what the player UI does and there's no separate endpoint. Cheaper than wiring SignalR or guessing at another API. Future improvement: in-memory cache per-process for 1-2 minutes, only if it becomes a problem.

## Files to Change

### New
- **`functions/src/eagle.ts`** — pure HTTP client. No Firebase imports. Exports types (`EagleLoginResult`, `EagleSlot`, `EagleReservation`) and functions (`login`, `searchSlots`, `bookEighteen`, `cancelReservation`). All take an explicit `EagleSession = { customerId, priceClassId, cookies? }` plus call-specific args; no global state.

### Modified
- **`functions/src/golf.ts`** — gut and rewrite. Becomes thin wrappers that read creds from Firestore via `getAuth`, call the Eagle client, and shape data for `index.ts`. Exports same names (`getAllTeeTimes`, `bookTime`, `bookTeeTimeWithAuth`, `getAuthToken`, `cancelBooking`, `getBookings`) to minimize churn in callers, but the **types/return shapes change**. Old `getAuthToken({email,password}) → {data:{jwt,...}, headers:{set-cookie}}` becomes `→ EagleLoginResult`. Old `getAllTeeTimes` returned an array of flat slots; new shape is `EagleSlot[]` with `{ slotId, time, master_nine_id, nine_name, available_spots, price_class_id, fee }`.
- **`functions/src/index.ts`** — update to new field names from `golf.ts`. Keep `scheduleBookEarliest` structure: two accounts, weekend gate, 10-day offset, front-side filter. `BEACH_PASS_ID`/`REGULAR_ID` constants are removed (Eagle resolves price class per-customer via login). `scheduleTasks` upgrades comparison from `hours > data.after` to string-compare against `"HHMM"`. Hardcoded creds in `bookEarliest` stay (per instruction) with a `// TODO` comment.
- **`functions/src/types.ts`** — `Schedule.after` and `Schedule.before` become `string` ("HHMM") instead of `number`.
- **`src/lib/golf.ts`** — delete the existing implementation; replace with a thin file that re-exports from a tsconfig-aliased shared module OR (fallback) keep it as a Next-side wrapper around the shared client.
- **`src/types.ts`** — same Schedule shape change (`after`/`before` → string).
- **`src/components/schedule-form.tsx`** — full rewrite. Remove OpenAI call, remove "preview/confirm" UX. New form: `<input type="date">` (becomes `date: number` epoch ms), `<input type="time"> × 2` (after/before, converted to HHMM via `value.replace(":","")`), `<input type="number" min=1 max=4>` for players. Submit calls `setSchedule` directly.
- **`src/lib/openai.ts`** — delete.
- **`src/app/api/times/route.ts`** — adjust to new `getAllTeeTimes` signature. Drop `booking_class_id` from caller; price class is now resolved server-side from the user's login.
- **`src/app/api/book/route.ts`** — no signature change at the route level, but `bookTime` now expects the new `EagleSlot` shape passed through from `/api/times`.
- **`src/app/api/bookings/route.ts`** — `getBookings({email})` now returns `EagleReservation[]` (mapped from `LstCurrentReservations`). `cancelBooking({email, id})` — `id` becomes the composite `${AppointmentDetailID}_${AppointmentSlotDetailID}` (or we split into two fields; see Open Questions).
- **`src/components/bookings.tsx`** — update field names on the displayed booking object (`booking.time` was an ISO datetime from foreup; now becomes a Date built from `{Date: "20260601", Time: "1233"}`). `booking.carts` (player count) is replaced with `booking.players` from `LstCurrentReservations.Players`. The cancel button currently sends `booking.TTID` — needs to switch to the Eagle IDs.
- **`tsconfig.json`** (root, Next.js) — add `paths` entry: `"@eagle": ["../functions/src/eagle"]`.
- **`next.config.js`** — add `transpilePackages: ["../functions"]` if Next.js complains about importing TS from outside `src/`. (Likely needed.)
- **`package.json`** (root) — remove `openai` dep if no other consumer.

### Removed
- `src/lib/openai.ts`
- Constants `BEACH_PASS_ID`, `REGULAR_ID` (no longer relevant — Eagle resolves price class per customer)

### Operational (not code)
- **One-time Firestore backfill** for existing `/schedule` docs: `after: 10 → "1000"`, `before: 14 → "1400"`. Tiny ad-hoc script via `firebase-admin` (or manual edit if there are only a handful of docs).

## Key Design

### Shared Eagle client (`functions/src/eagle.ts`)

```ts
import axios from "axios";

const API_BASE = "https://api.eagleclubsystems.online";
const BCC_DEFAULTS = {
  StrServer: "GSERVER",
  StrURL: "https://api.EagleClubSystems.online",
  StrDatabase: "jaxbeach20260601",
  IntOrganizationID: 1,
  // ...other static fields from captured curls
  Version: "1.260518.0",
  FromProgram: "BE",
};
const TURN_TIME_MIN = 126;       // gap between front tee-off and back tee-off
const FRONT_NINE_ID = 108;
const BACK_NINE_ID = 109;
const DEFAULT_CARRIAGE_ID = 95;

export type EagleSession = {
  customerId: number;          // → BCC.IntOperatorID for actions
  priceClassId: number;        // booking class (Beach Pass = 101)
  searchPriceClassId: number;  // search filter (customer default = 85)
  cookies?: string[];
};

export type EagleSlot = {
  playerSlotIds: number[];     // LstAppointmentSlotID — up to 4 player positions
  date: string;                // "YYYYMMDD"
  time: string;                // "HHMM"
  nineId: number;              // 108 (Front) or 109 (Back)
  nineName: string;
  priceClassId: number;        // Eighteen_Master_TeePriceClassID (for the booker)
  turnNineId: number;          // 0 if not 18-hole-eligible
};
// availableSpots = playerSlotIds.length

export type EagleReservation = {
  appointmentDetailId: number;
  appointmentSlotDetailId: number;
  date: string;                // "YYYYMMDD"
  time: string;                // "HHMM"
  legHoles: string;            // "9" | "18"
  nineName: string;
  players: number;
  fee: string;
};

export type EagleLoginResult = {
  session: EagleSession;
  reservations: EagleReservation[];
};

function bcc(operatorId: number) {
  return { ...BCC_DEFAULTS, IntOperatorID: operatorId };
}

export async function login({email, password}: {email: string; password: string;}): Promise<EagleLoginResult> {
  const res = await axios.post(
    `${API_BASE}/api/online/OnlineAuthenticateLogin`,
    {
      BCC: { ...bcc(2), CampaignMonitorMasterListName: "", CampaignMonitorApiKey: "", CampaignMonitorClientID: "", LsteInterfaceID: [], ipAddress: "" },
      EMailAddress: email,
      Password: password,
      OnlineBookingSeeOthers: 0,
      StrDate: ymd(new Date()),
      OnlinePasswordBypass: 0,
      Master_LiabilityLoyaltyPointsID: 83,
      IncludeCardsOnFile: false,
    },
    { headers: { "Content-Type": "application/json" } }
  );

  const { customer, BG } = res.data;
  if (!BG?.BoolSuccess || !customer?.CustomerID) {
    throw new Error("Eagle login failed");
  }

  // Booking price class = first active LstTeePriceClass (e.g. Beach Pass 101).
  // Search price class = customer's default Master_TeePriceClassID (e.g. 85).
  const bookingClass = customer.LstTeePriceClass?.[0]?.MasterID ?? customer.Master_TeePriceClassID;

  return {
    session: {
      customerId: customer.CustomerID,
      priceClassId: bookingClass,
      searchPriceClassId: customer.Master_TeePriceClassID,
      cookies: res.headers["set-cookie"],
    },
    reservations: (customer.LstCurrentReservations ?? []).map(mapReservation),
  };
}

export async function searchSlots(session: EagleSession, date: string): Promise<EagleSlot[]> {
  const res = await axios.post(
    `${API_BASE}/api/online/OnlineAppointmentRetrieve`,
    {
      BCC: bcc(session.customerId),
      StrDate: date,
      StrTime: "0000",
      TeePriceClassID: session.searchPriceClassId,
      IncludeExisting: false,
      Master_CarriageID: DEFAULT_CARRIAGE_ID,
      Master_TeePriceClassIDs: `,${session.searchPriceClassId},`,
      OnlineBookingFormat: 0,
      OnlineBookingMaxDays: 10,  // from customer.LstTeePriceClass[0].OnlineMaxDays (Beach Pass = 10)
    },
    { headers: cookieHeaders(session) }
  );
  return (res.data?.LstAppointment ?? []).map(mapSlot);
}

/**
 * Book up to 4 players into one 18-hole tee time using a single account (the session's customer).
 * Pairs a front-nine slot with the matching back-nine slot (`pairBackNine`), then takes the first
 * `players` slot IDs from each nine. The booker (player 1) is the session customer; players 2..N
 * are sent as guests of the booker (Person_GuestOfID = session.customerId) with empty Customer.
 *
 * Per captured curl, guests get Master_TeePriceClassID:85 (default rack), only booker gets 101.
 * (See open question: are guests eligible for the booker's pass rate?)
 */
export async function bookEighteen(
  session: EagleSession,
  front: EagleSlot,
  back: EagleSlot,
  players: number,
): Promise<{success: true} | {success: false; error: string}> {
  if (players < 1 || players > 4) throw new Error("players must be 1-4");
  if (front.playerSlotIds.length < players || back.playerSlotIds.length < players) {
    return { success: false, error: "not enough open spots" };
  }
  // Try booker's pass (e.g. 101) for guests too; retry with rack (85) on failure if Eagle rejects.
  const items = Array.from({ length: players }, (_, i) => ({
    AppointmentSlotID:  front.playerSlotIds[i],
    AppointmentSlotID2: back.playerSlotIds[i],
    Leg: 18, Leg2: 2,
    Date: front.date,
    Time: front.time, Time2: back.time,
    Master_NineID: front.nineId,
    Master_NineID2: back.nineId,
    Master_TeePriceClassID: session.priceClassId,
    Person_GuestOfID: i === 0 ? 0 : session.customerId,
    Holes: "18",
    Master_CarriageID: DEFAULT_CARRIAGE_ID,
    RackRateID: 1,
    OnlineBooking: true,
    BookedOnline: true,
    // Customer blob omitted for all; server resolves player 1 via BCC.IntOperatorID and
    // guests via Person_GuestOfID.
  }));
  const returns = items.flatMap(() => [
    { Time: front.time, PriorityTime: 1, Master_NineID: front.nineId, BoolItemsToRight: false },
    { Time: back.time,  PriorityTime: 1, Master_NineID: back.nineId,  BoolItemsToRight: false },
  ]);
  const payload = {
    BCC: bcc(session.customerId),
    LstAppointmentItem: items,
    LstDeleted: [], LstBackNineDeleted: [], LstEmailInvite: [],
    AppointmentGroup: { /* zeros */ },
    StrDate: front.date,
    StrDateNow: ymd(new Date()),
    Action: "InsertUpdate",
    OnlineBooking: true,
    LstAppointmentReturn: returns,
  };
  try {
    const res = await axios.post(`${API_BASE}/api/appointment/AppointmentInsertUpdate`, payload, { headers: cookieHeaders(session) });
    if (!res.data?.BG?.BoolSuccess) return { success: false, error: JSON.stringify(res.data?.BG?.SqlErrors ?? []) };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function cancelReservation(session: EagleSession, r: EagleReservation): Promise<boolean> {
  const res = await axios.post(
    `${API_BASE}/api/appointment/AppointmentCancelNoShowTeeTime`,
    {
      BCC: bcc(session.customerId),
      Date: r.date,
      CancelGroup: false,
      AppointmentGroupID: 0,
      LstAppt: [{
        AppointmentSlotDetailID: r.appointmentSlotDetailId,
        AppointmentDetailID: r.appointmentDetailId,
        AppointmentSlotID: 0,
        PersonID: session.customerId,
        Time: r.time,
        NineName: r.nineName,
        NoShow: false, Reschedule: false, SendEmail: true,
        Master_CancelReasonID: 0, Forgive: false,
        LstInventory: [], LstInventoryCancelled: [],
      }],
      LstAppointmentUpdateReturn: [],
      CancelGroupMemberKeepSlot: false,
    },
    { headers: cookieHeaders(session) }
  );
  return !!res.data?.BG?.BoolSuccess;
}

// helpers --------------------------------------------------------------------
function cookieHeaders(s: EagleSession) {
  return s.cookies?.length ? { "Content-Type": "application/json", Cookie: s.cookies.join("; ") } : { "Content-Type": "application/json" };
}
function ymd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
}
function mapSlot(a: any): EagleSlot { /* …LstAppointment entry → EagleSlot */ return /* … */; }
function mapReservation(r: any): EagleReservation { /* …LstCurrentReservations entry → EagleReservation */ return /* … */; }

/** Find back-9 slot paired with a given front-9 slot (same date, time + 126 min, NineID 109). */
export function pairBackNine(slots: EagleSlot[], front: EagleSlot): EagleSlot | null {
  const targetTime = addMinutesHHMM(front.time, TURN_TIME_MIN);
  return slots.find(s => s.date === front.date && s.nineId === BACK_NINE_ID && s.time === targetTime) ?? null;
}
```

### Functions wrapper (`functions/src/golf.ts`)

```ts
import { getAuth } from "./firebase";
import { login, searchSlots, bookEighteen, cancelReservation, pairBackNine, EagleSession, EagleSlot } from "./eagle";

export async function getAuthToken({email, password}: {email: string; password: string;}) {
  // Returned shape mirrors the old { data, headers } only enough for existing callers;
  // we expose .session and .reservations from the Eagle login result.
  return await login({ email, password });
}

export async function getAllTeeTimes({date, session}: {date: string; session: EagleSession;}): Promise<EagleSlot[]> {
  return searchSlots(session, date);
}

export async function bookTime({time, email, players}: {time: EagleSlot; email: string; players: number;}) {
  const creds = await getAuth({ email });
  if (!creds) return { success: false, e: new Error(`no auth for ${email}`) };
  const { session } = await login(creds);
  const slots = await searchSlots(session, time.date);  // re-fetch to find the back-9 pair
  const back = pairBackNine(slots, time);
  if (!back) return { success: false, e: new Error("no back-9 pair") };
  const res = await bookEighteen(session, time, back, players);
  return res.success ? { success: true } : { success: false, e: new Error(res.error) };
}

export async function bookTeeTimeWithAuth(front: EagleSlot, session: EagleSession, allSlots: EagleSlot[], players: number) {
  const back = pairBackNine(allSlots, front);
  if (!back) return false;
  const res = await bookEighteen(session, front, back, players);
  return res.success;
}

export async function getBookings({email}: {email: string}) {
  const creds = await getAuth({ email });
  if (!creds) return null;
  const { reservations } = await login(creds);
  return reservations;
}

export async function cancelBooking({email, appointmentDetailId, appointmentSlotDetailId}: {email: string; appointmentDetailId: number; appointmentSlotDetailId: number;}) {
  const creds = await getAuth({ email });
  if (!creds) return null;
  const { session, reservations } = await login(creds);
  const res = reservations.find(r => r.appointmentDetailId === appointmentDetailId && r.appointmentSlotDetailId === appointmentSlotDetailId);
  if (!res) return { success: false };
  const ok = await cancelReservation(session, res);
  return { success: ok };
}
```

### `index.ts` — preserved behavior, new data shapes

```ts
// scheduleTasks — minute-granular HHMM comparison; books exactly data.players spots in one call
const inWindow = (slot: EagleSlot) =>
  slot.nineId === FRONT_NINE_ID && slot.turnNineId === BACK_NINE_ID &&
  slot.time >= data.after && slot.time <= data.before &&
  slot.playerSlotIds.length >= data.players;

for (const slot of slots.filter(inWindow)) {
  const res = await bookTime({ time: slot, email: data.email, players: data.players });
  if (res.success) { await doc.ref.delete(); break; }
}

// bookEarliest — single-account (jack only); matthew will be added back later.
const auth = await getAuthToken({ email: "jackdriscoll777@gmail.com", password: "Golf123" }); // TODO: move to /auth/{email}; TODO: re-add matthew as second account

const dateStr = ymd(dayjs().add(10, "days").toDate());
const dayOfWeek = dayjs(dateStr, "YYYYMMDD").day();
if (dayOfWeek !== 0 && dayOfWeek !== 6) return;

let slots: EagleSlot[] = [];
while (!slots.length) slots = await searchSlots(auth.session, dateStr);

const front = slots.filter(s => s.nineId === FRONT_NINE_ID && s.turnNineId === BACK_NINE_ID);
// Jack books the two earliest tee times, filling all 4 spots in each via guests-of pattern.
const groups = front.slice(0, 2);
const promises = groups.map(s => bookTeeTimeWithAuth(s, auth.session, slots, s.playerSlotIds.length));
await Promise.allSettled(promises);
```

### New `ScheduleForm` (frontend)

```tsx
const [date,   setDate]   = useState("");          // "YYYY-MM-DD" from <input type=date>
const [after,  setAfter]  = useState("06:00");     // "HH:MM"     from <input type=time>
const [before, setBefore] = useState("20:00");
const [players, setPlayers] = useState(4);

const onSubmit = async () => {
  await setSchedule({
    date: new Date(date + "T12:00:00").getTime(),
    after:  after.replace(":", ""),    // "0600"
    before: before.replace(":", ""),   // "2000"
    players,
    email: localStorage.getItem("email") ?? "",
  });
  window.location.href = "/schedules";
};
```

### Shared module wiring

```jsonc
// tsconfig.json (Next.js root)
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@eagle": ["../functions/src/eagle"]
    }
  }
}

// src/lib/golf.ts (Next-side wrapper)
import { getAuth } from "@/lib/firebase";
import { login, searchSlots, bookEighteen, cancelReservation, pairBackNine } from "@eagle";
// …same wrappers as functions/src/golf.ts but using the Web Firebase SDK getAuth
```

If Next.js's bundler refuses the cross-package import despite the tsconfig path, fallback is a `prebuild` copy step in `package.json`: `"prebuild": "cp functions/src/eagle.ts src/lib/eagle.ts"`. Document the dependency direction in the file header so it doesn't drift.

## Tasks

- [x] Add `functions/src/eagle.ts` (pure HTTP client + mappers + `pairBackNine`)
- [x] Shared module: chose **mirrored file** (`src/lib/eagle.ts` is a byte-for-byte copy of `functions/src/eagle.ts` with a "keep in sync" header) over a tsconfig path alias. Simpler, more robust across the package boundary, no build-script gymnastics.
- [x] Rewrite `functions/src/golf.ts` as a thin wrapper over `eagle.ts` + Firestore admin creds
- [x] Rewrite `src/lib/golf.ts` as a thin wrapper over `eagle.ts` + Firestore web creds
- [x] Update `functions/src/types.ts` (Schedule `after`/`before` → string)
- [x] Update `src/types/index.ts` (same)
- [x] Update `functions/src/index.ts`:
  - [x] `scheduleTasks` — string comparison on HHMM; fetches creds from Firestore via `getAuth`, runs one login per doc, reuses session for search + book
  - [x] `bookEarliest` — single jack-only flow (matthew removed); weekend gate; `EagleSlot` filter (`nineId === 108 && turnNineId === 109`); books 2 earliest tee times filling all 4 spots each via guests-of pattern; TODO comments left
- [x] Rewrite `src/components/schedule-form.tsx`: native date/time/number inputs, dropped AI preview/confirm
- [x] Delete `src/lib/openai.ts`
- [x] Remove `openai` from root `package.json`
- [x] Update `src/app/api/times/route.ts`: drops `booking_class_id`, returns `EagleSlot[]`
- [x] Update `src/app/api/book/route.ts`: takes new `EagleSlot` shape + `players` field
- [x] Update `src/app/api/bookings/route.ts`: DELETE accepts `appointmentDetailId` + `appointmentSlotDetailId` as two separate form fields
- [x] Update `src/components/bookings.tsx`: renders `EagleReservation` (date/time/course/players); sends both IDs on cancel
- [x] Update `src/app/schedules/page.tsx`: format HHMM strings for display (was rendering hour-as-int)
- [x] Exclude `pulled-functions/` from tsconfig + gitignore (deployed-source inspection dir was getting type-checked)
- [ ] **Test plan** (manual, against real Eagle API since there's no sandbox):
  - [ ] Login with `jackdriscoll777@gmail.com` returns `BoolSuccess: true` and a CustomerID
  - [ ] `searchSlots(session, "<next weekend>")` returns ≥1 entry with `Master_NineID: 108`
  - [ ] `bookEighteen` succeeds end-to-end; verify reservation appears in login's `LstCurrentReservations`
  - [ ] `cancelReservation` removes it
  - [ ] Try a minimal book payload (no Customer blob, fewer fields) and confirm it still works — codify the minimum
  - [ ] Run `scheduleTasks` against the emulator with a Firestore doc using `"HHMM"` window; verify it books the first in-window slot
- [ ] Deploy functions: `cd functions && npm run deploy` (preserves existing schedules in `/schedule` collection after backfill)

## Open Questions

1. ~~Cancel ID encoding.~~ Resolved — DELETE `/api/bookings` accepts two form fields: `appointmentDetailId` and `appointmentSlotDetailId`. `bookings.tsx` reads both off the `EagleReservation` and sends them.
2. ~~`priceClassId` selection.~~ Resolved — Jack only for now (matthew dropped from `bookEarliest` for this pass); `LstTeePriceClass[0].MasterID` is correct. Revisit when matthew is re-added.
3. ~~Pre-existing `Schedule` docs.~~ Resolved — `/schedule` is empty. No backfill needed.
4. ~~`scheduleTasks` weekend filter.~~ Resolved — no weekend filter. Per-date schedules are valid any day.
5. ~~Search date window.~~ Resolved — the `7` in the captured search payload was a client-sent value, not a server limit. The real cap is `customer.LstTeePriceClass[0].OnlineMaxDays` (Beach Pass = 10). Plan now passes `OnlineBookingMaxDays: 10` and `bookEarliest` keeps the 10-day offset. To future-proof: read `OnlineMaxDays` off the session's price class instead of hardcoding `10`.
6. **Cookie forwarding necessity.** Plan forwards `Set-Cookie` from login defensively. If a test confirms the API really is stateless (no Set-Cookie, or calls work without it), we can drop the cookie code path.
7. ~~Guest tee price class.~~ Resolved — always try `101` (booker's pass) for guests first. Fall back to `85` only if Eagle rejects. Implementation: send `101` for all players; if the response indicates failure, retry with `85` for guests.
