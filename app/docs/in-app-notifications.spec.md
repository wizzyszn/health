# In-app Notifications — Backend Handoff (Extracted)

> Source: Claude artifact "Notifications API — Frontend Handoff" (`/home/ubuntu/Downloads/Notifications API — Frontend Handoff.html`, iframe payload `saved_resource.html`). Raw extracted HTML kept at `.hermes/plans/notifications_artifact_raw_body.html`.
> Scope: Carelexa API, base `/api/v1`, auth `Bearer JWT`. **Merged & deployed** — verified against the live implementation, not planned behavior.

## 1. What you're building

Three surfaces: a **bell badge** (unread count), a **feed list** (filters + pagination), and **tap-through** to relevant screens. The server decides what gets created and writes the human-readable copy; the client decides how it looks and where a tap goes.

- 10 endpoints (5 patient, 5 doctor, identical shapes)
- 15 notification types (stable enum → map to icons client-side)
- **No realtime transport** — poll `unread-count`; no sockets/SSE

## 2. Endpoints

Every route is role-scoped and `me`-scoped. Patients use the `patients` tree, doctors use `doctors`; a patient token on a doctor route returns **401**.

| Method | Path (`/api/v1` prefix)                   | Returns in `data`                |
| ------ | ----------------------------------------- | -------------------------------- |
| GET    | `/patients/me/notifications`              | Feed + pagination + unread count |
| GET    | `/patients/me/notifications/unread-count` | `{ unread: number }`             |
| PATCH  | `/patients/me/notifications/:id/read`     | The updated notification         |
| PATCH  | `/patients/me/notifications/read-all`     | `{ modified: number }`           |
| DELETE | `/patients/me/notifications/:id`          | `{ deleted: true }`              |

Swap `patients` → `doctors` for doctor equivalents.

### Query parameters (list endpoint only)

| Param      | Type                    | Default | Notes                                                |
| ---------- | ----------------------- | ------- | ---------------------------------------------------- |
| `page`     | number                  | 1       | Minimum 1                                            |
| `perPage`  | number                  | 20      | Must be 1–100; outside range is **400**, not clamped |
| `status`   | `read \| unread \| all` | all     | Read-state filter                                    |
| `category` | enum                    | —       | One of the five categories; good for tabs            |
| `type`     | enum                    | —       | One specific type                                    |

⚠️ **Will bite you:** unknown query parameters are **rejected with 400**, not ignored. The param is `perPage` — sending `?limit=20` fails outright. API-wide behavior.

## 3. Response shape

Standard envelope; payload under `data`.

```json
GET /api/v1/patients/me/notifications?page=1&perPage=20&status=unread

{
  "success": true,
  "response_code": "00",
  "response_description": "Success",
  "data": {
    "items": [ /* notification objects, newest first */ ],
    "pagination": {
      "total": 42,
      "page": 1,
      "perPage": 20,
      "total_pages": 3        // 1 when total is 0, never 0
    },
    "unread_count": 7         // bundled — no second call for the badge
  },
  "request_id": "…", "path": "…", "timestamp": "…"
}
```

### The notification object

```json
{
  "_id": "6a86f1ef42cde0953e5636ac",
  "recipient_type": "patient", // "patient" | "doctor"
  "type": "PRESCRIPTION_READY", // ← map this to an icon
  "category": "CLINICAL",
  "title": "Prescription ready",
  "body": "Dr Emeka Okafor prescribed 2 medications. Your prescription form is available.",
  "data": { "count": 2, "medication_ids": ["…"] }, // varies by type
  "appointment_id": null,
  "consultation_id": "6a86f6f9476b0e92c12aff53",
  "actor_id": "69b82d9272e8901244a93546", // who caused it
  "actor_type": "doctor",
  "deep_link": "/consultations/6a86…/medications",
  "is_read": false,
  "read_at": null,
  "createdAt": "2026-08-20T13:12:04.881Z",
  "updatedAt": "2026-08-20T13:12:04.881Z"
}
```

Notes:

- `title` and `body` are pre-rendered — display as-is.
- Times inside `body` are already in the **recipient's own timezone** — don't reconvert.
- `data` carries raw ids/counts/UTC timestamps if you'd rather render your own copy.
- `deep_link` is a route hint, not a URL — map it to your own navigation.

## 4. Notification types

The server never sends an icon or emoji — that's yours, keyed off `type`. Values are stable and won't be reused for different meanings.

| Type                             | Goes to          | Fires when                         | Deep link                           | Suggested icon |
| -------------------------------- | ---------------- | ---------------------------------- | ----------------------------------- | -------------- |
| `APPOINTMENT_BOOKED`             | Patient + Doctor | Booking created & confirmed        | `/appointments/:id`                 | 📅             |
| `APPOINTMENT_REQUEST_RECEIVED`   | Doctor           | Patient books, awaiting acceptance | `/appointments/:id`                 | 📥             |
| `APPOINTMENT_CONFIRMED`          | Patient          | Doctor accepts request             | `/appointments/:id`                 | ✅             |
| `APPOINTMENT_CANCELLED`          | Patient + Doctor | _Other_ party cancels              | `/appointments/:id`                 | 🚫             |
| `APPOINTMENT_RESCHEDULED`        | Patient + Doctor | _Other_ party moves it             | `/appointments/:id`                 | 🔄             |
| `APPOINTMENT_REASSIGNED`         | Doctor           | Auto-match assigns appointment     | `/appointments/:id`                 | ➕             |
| `APPOINTMENT_REMOVED`            | Doctor           | Reschedule moved it elsewhere      | `/appointments/:id`                 | ➖             |
| `APPOINTMENT_REMINDER_24H`       | Patient + Doctor | ~24h before start                  | `/appointments/:id`                 | 📅             |
| `APPOINTMENT_REMINDER_1H`        | Patient + Doctor | ~1h before start                   | `/appointments/:id`                 | ⏰             |
| `VIDEO_ROOM_OPENED`              | Patient          | Doctor opens video room            | `/appointments/:id/video`           | 🎥             |
| `CONSULTATION_SUMMARY_AVAILABLE` | Patient          | Doctor completes consultation      | `/consultations/:id`                | 📄             |
| `INVESTIGATIONS_REQUESTED`       | Patient          | Tests ordered & shared             | `/consultations/:id/investigations` | 🩺             |
| `PRESCRIPTION_READY`             | Patient          | Meds prescribed & shared           | `/consultations/:id/medications`    | 💊             |
| `REFERRAL_AVAILABLE`             | Patient          | Referral issued & shared           | `/referrals/:id`                    | ✉️             |
| `INVESTIGATION_RESULTS_UPLOADED` | Doctor           | Patient uploads result files       | `/investigations/:id`               | 📤             |

Categories (feed tabs): `APPOINTMENT` · `CONSULTATION` · `CLINICAL` · `VIDEO` · `REMINDER`

🔒 **Design constraint:** `title`/`body` deliberately contain names, times, counts only — never drug names, test names, diagnoses, referral reasons. Safe on lock screens when email/push arrive later. Clinical detail lives behind the deep link. Don't surface `data` contents as body text in ways that reintroduce it.

## 5. Reminders

Two per appointment (~24h and ~1h before start) to **both** parties. Only `CONFIRMED` appointments qualify; pending requests never trigger one. Copy states the **real** remaining time — a late scheduler can make a "1 hour" reminder read _"in 47 minutes"_. Render `body` as given; don't recompute from the offset.

## 6. Changes to endpoints you already use

### Patient records now carry an MRN

`GET /patients/me` and `/patients/me/profile` return `mrn`, formatted `C-XXXXXX` (e.g. `C-3622ET`). Server-generated, read-only — sending it in any update is a **400**. Doctors also have an internal MRN but it is **never returned** on any doctor-shaped response — don't build UI expecting it.

### Allergies and conditions now work over multipart

On `PATCH /patients/me` and `/patients/me/profile`, fields `allergies`, `previous_medical_conditions`, `medical_flags` previously rejected a single value over multipart with 400. Fixed. Now all of these work:

```
// one value
allergies=Latex

// repeated parts
allergies=Penicillin
allergies=Peanuts

// JSON array string
allergies=["Sulfa","Iodine"]

// JSON body works too
{ "allergies": ["Penicillin"] }
```

Semantics:

- Sending the field **replaces the whole list** — send full set, not a delta.
- Send `[]` to clear; omit the field to leave untouched.
- Values are **never split on commas** — `"Peanuts, tree nuts"` stays one entry.

## 7. Behaviour worth knowing

| Situation                         | What happens                                                  |
| --------------------------------- | ------------------------------------------------------------- |
| Another user's notification id    | **404**, never 403 — existence isn't disclosed. Treat as gone |
| Wrong role for route              | **401**                                                       |
| Unknown query param               | **400**, not silently ignored                                 |
| `perPage` above 100               | **400**, not clamped                                          |
| Duplicate events                  | Deduplicated server-side                                      |
| Notifications older than 180 days | Auto-deleted — don't build permanent history on this feed     |
| Marking read                      | Sets `is_read: true` and `read_at` together                   |

**No realtime yet:** no websockets/SSE. Poll `unread-count` — single indexed count, cheap. ~30–60s while foregrounded plus refresh-on-resume is sensible. The list endpoint bundles `unread_count`, so opening the feed needs one request, not two.

## 8. Suggested build order (backend's recommendation)

1. **Bell badge** — poll `unread-count`, render the number
2. **Feed list** — render `title` + `body` + relative time from `createdAt`, unread styled distinctly
3. **Icon map** — `type` → glyph, with fallback for unknown values so future types can't break the list
4. **Mark read** — on tap then navigate via `deep_link`; plus mark-all-read control
5. **Filters** — category tabs and unread toggle (server-side params)

✔ Already verified end-to-end against a live instance: booking, confirming, cancelling, rescheduling, prescribing, referring, requesting investigations, completing consultations, opening video rooms — each produced rows in both feeds. If something doesn't appear, suspect wiring before the API.

## 9. Not built yet (don't design UI depending on these)

Email/push delivery · notification preferences · realtime transport · no-show alerts · upload-results reminders · "results reviewed by clinician". Each needs backend work first.

---

## 10. Implementation status (frontend)

Shipped in the Aug 2026 pass — all surfaces built against §2–§8:

- [x] Domain types incl. both enums with future-proof widening (`shared/notifications/notification.types.ts`)
- [x] Role-scoped service for all 10 endpoints + allowlisted query serializer (400-trap defense) (`config/service/notifications.service.ts`)
- [x] Controller hook: 45s unread polling (paused when tab hidden), feed with smooth pagination, optimistic mark-read / mark-all-read / delete with rollback (`use-notifications.hook.ts`)
- [x] Deep-link resolver: every hint pattern × role, unknown shapes → safe fallback, never navigates blind; VIDEO case reuses `parseVideoDeepLink`
- [x] Type→icon map for all 15 types + fallback glyph for future types
- [x] Live bell badge (9+ cap) + recent-feed popover replacing the decorative bell in `DashHeader` (both roles)
- [x] Full feed page: category tabs, unread-only toggle, pagination, mark-all-read, per-row delete, distinct empty states, 180-day retention note
- [x] Routes + sidebar entries: `/patient/dashboard/notifications`, `/doctor/dashboard/notifications`
- [x] **`VIDEO_ROOM_OPENED` consumer** — highlighted row while unread; tap lands on `/patient/dashboard/appointments/:id/video`. Closes the loop from the video-call work (patient sees "doctor is ready" ≤45s after room opens)
- [x] Tests: resolver × roles, malformed hints, icon fallbacks, serializer guards (30 tests green)

Open items:

- [ ] Real-device QA of the full matrix (booking → badge, tap-through per type, delete flows)
- [ ] Faster badge refresh while patient sits on the video waiting screen (optional nicety)
- [ ] Notification preferences / push / realtime — blocked on backend (see §9)

---

_Questions on any contract go to the backend side — everything above is verified against the merged implementation._
