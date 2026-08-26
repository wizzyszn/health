# Video Call Integration — Backend Integration Reference (Extracted)

> Source: Claude artifact "Video Call Integration" (`/home/ubuntu/Downloads/Video Call Integration.html`, iframe payload `Video Call Integration_files/saved_resource.html`). Raw extracted HTML kept at `.hermes/plans/artifact_raw_body.html`.
> Scope: Telemedicine API, base URL `/api/v1`, auth `Bearer JWT`, call SDK `daily-js`, 4 endpoints.

## 1. Overview

The backend never renders video. Each token endpoint returns a Daily.co `roomUrl` and a signed `token`; the client's only job is to pass both to Daily's client SDK (`@daily-co/daily-js`) and let it handle the call itself — media, layout, device selection, reconnection. Do not construct a Daily room URL or token on the client; both are minted server-side per request.

## 2. The handshake

- The room is created lazily, on the **doctor's first token request** for that appointment — there is no separate "create room" call.
- The patient's token endpoint can only _join_ a room; it never creates one. Calling it before the doctor has requested theirs returns a **400 telling you to wait**.
- The moment the doctor's room is created, the backend emits a notification (`VIDEO_ROOM_OPENED`) the patient's client can act on directly.
- Media flows directly between clients and Daily.co — not through the backend.
- On `left-meeting` the consultation stays ACTIVE — completing it is a separate doctor action.

Sequence:

1. Doctor client → backend: `GET video-token`
2. Backend → Daily: create room + owner token
3. Backend → doctor: `200 { roomUrl, token }` (doctor's daily-js call frame opens)
4. Backend → patient client: notification `video.room_opened`
5. Doctor: on `joined-meeting` → `PATCH .../video/start`
6. Patient client → backend: `GET video-token` (may need retry; see below)
7. Backend → Daily: fetch existing room, issue token
8. Backend → patient: `200 { roomUrl, token }` (patient's call frame opens — both sides on the call)
9. Doctor: on `left-meeting` → `PATCH .../video/end`

Step 6 may need retrying: if the patient requests a token before the doctor opened the room, the backend answers 400 rather than waiting. The `video.room_opened` push tells the patient's client it is safe to call step 6.

## 3. The four endpoints

### GET `/api/v1/doctors/me/appointments/:id/video-token` (role: doctor)

Creates the Daily room on first call for this appointment; every call after that returns a fresh token for the same room. Call this once, when the doctor opens the consultation screen — not on a timer.

200 response:

```json
{
  "appointmentId": "69d2f48d1017a08a518f2f97",
  "consultationId": "64f3abc000aaa111",
  "role": "doctor",
  "roomUrl": "https://your-domain.daily.co/consultation-69d2f48d...",
  "token": "eyJhbG...NiJ9...",
  "expiresAt": "2026-04-10T10:30:00.000Z"
}
```

`roomUrl` and `token` are exactly what `daily-js` wants. `expiresAt` is when the returned token stops working — refresh by calling this endpoint again; don't try to extend the token client-side.

### GET `/api/v1/patients/me/appointments/:id/video-token` (role: patient)

Same response shape, `role: "patient"`. Never creates a room — if the doctor hasn't opened theirs yet, returns 400 with `"Doctor hasn't opened the session yet. Please wait."` That string is safe to show as-is; it is written for a patient to read.

### PATCH `/api/v1/doctors/me/appointments/:id/video/start` (role: doctor)

Fire this from the daily-js `joined-meeting` event, not from the click that opens the call frame — the two can be seconds apart if the device is slow to grant camera/mic permission. This marks the moment the doctor is actually in the room.

### PATCH `/api/v1/doctors/me/appointments/:id/video/end` (role: doctor)

Fire from `left-meeting`. This does **not** complete the consultation — the record stays open so the doctor can write it up. Completion is a separate action in the consultation UI, not part of the call flow.

## 4. Don't poll blind — the push

| Field        | Value                                                                         |
| ------------ | ----------------------------------------------------------------------------- |
| type         | `VIDEO_ROOM_OPENED`                                                           |
| title / body | "Your doctor is ready" / "Dr … has joined the consultation. Tap to join now." |
| deep_link    | `/appointments/:id/video`                                                     |

Fetch it from the patient notification feed like any other in-app notification. Reasonable pattern: don't poll the video-token endpoint at all until this notification arrives (or the patient taps the appointment from their schedule), then call it once. Retrying on a 400 with short backoff is fine for the rare in-flight case; a background loop for the whole wait is not.

## 5. Timing — when a join is allowed

Both token endpoints and the start call are gated by the same window. Requesting outside it returns 400 — show the message, don't retry.

```
start − 10 min          scheduled_start          scheduled_end        end + 30 min
     |----------------------|------------------------|--------------------|
     [ new joins & token requests allowed ][ no new joins — room stays live ]
EARLY_JOIN_GRACE_MS = 10 min                                    Daily room expires
```

- A token issued before `scheduled_end_at_utc` keeps working through the full 30-minute tail — a long-running call is not cut off.
- Nobody can _newly join_ after the scheduled end.
- `markSessionEnded` has no window check at all — "call ended" can always be reported, even after the tail expires.

## 6. Errors

Every error shares one envelope; `response_description` carries the human-readable reason and is safe to show directly for the 400s above.

```json
{
  "success": false,
  "response_code": "009",
  "response_description": "This appointment does not belong to you",
  "message": "This appointment does not belong to you",
  "request_id": "3f2a…",
  "path": "/api/v1/patients/me/appointments/…/video-token",
  "timestamp": "2026-04-10T10:12:03.101Z"
}
```

| Status | response_code  | Meaning                                                                                          | Routes            |
| ------ | -------------- | ------------------------------------------------------------------------------------------------ | ----------------- |
| 200    | `"00"`         | Success                                                                                          | all               |
| 400    | `"006"`        | Bad appointment id, wrong status, outside join window, or (patient token only) room not open yet | all               |
| 401    | `"011"`        | Missing/invalid/expired token, or doctor account deactivated                                     | all               |
| 403    | `"009"`        | Authenticated, but appointment belongs to someone else                                           | all               |
| 409    | n/a — see note | Consultation already completed/canceled; can't be reopened by starting a session                 | `.../video/start` |
| 503    | `"016"`        | Video calling has no Daily.co API key configured on this deployment                              | both token routes |

⚠️ **The 409 `response_code` is not numeric — branch on HTTP status.** Every other status maps to a numeric-string `response_code`; 409 falls through to the literal string `"Internal Server error"` while the HTTP status is correctly `409`. If error handling switches on `response_code`, add an explicit branch on HTTP status for this case rather than trusting the string.

## 7. Client wiring (minimal daily-js frame, doctor side)

```js
// GET /api/v1/doctors/me/appointments/:id/video-token
const { roomUrl, token } = await getDoctorVideoToken(appointmentId);

const callFrame = DailyIframe.createFrame(containerEl);
await callFrame.join({ url: roomUrl, token });

callFrame.on("joined-meeting", () => {
  // PATCH /api/v1/doctors/me/appointments/:id/video/start
  markSessionStarted(appointmentId);
});

callFrame.on("left-meeting", () => {
  // PATCH /api/v1/doctors/me/appointments/:id/video/end
  markSessionEnded(appointmentId);
});
```

Patient side is the same shape minus start/end — those two endpoints are doctor-only, since they drive the consultation record.

## 8. Access control

Every route requires a Bearer token whose role matches the endpoint — a patient token on a doctor route is rejected, not silently scoped down. As of this branch, a deactivated doctor account is also rejected here even with an otherwise valid, unexpired token (this check did not previously exist on these routes) — confirm the UI shows the 401 message rather than a generic failure.

---

## 9. Implementation status & gap checklist

Living tracker for making the video flow end-to-end on the frontend. Items verified against code on `dev` (Aug 2026 pass). File references are `app/src/`-relative.

### 9.1 Done (first implementation pass)

- [x] Structured `ApiError` exposing HTTP status + `response_code` → enables branching on status for the 409 quirk (`lib/api-error.ts`, `config/service/config.ts`)
- [x] Shared error classifiers for all spec §6 statuses (`shared/utils/video-session-errors.util.ts`)
- [x] Patient room-not-open flow: bounded backoff (≤3 retries, exponential) then explicit waiting state — no blind polling (`patient/pages/video-consultation.page.patient.tsx`, `patient/pages/appointment-detail.page.patient.tsx`)
- [x] Waiting-state UX in call frame: backend patient-facing copy + Try again/Close (`shared/components/video-call.component.tsx`)
- [x] Doctor lifecycle hardening: fire-once start/end guards (StrictMode/re-emit safe), 409-aware toast on start (`shared/daily/use-daily-video-room.hook.ts`)
- [x] Join guard against incomplete session payloads (no fabricated room/token)
- [x] Deep-link route `/patient/dashboard/appointments/:id/video` registered (`config/routes/patient.route.tsx`)
- [x] `VIDEO_ROOM_OPENED_TYPE` constant + `parseVideoDeepLink()` typed helpers (awaiting a consumer)
- [x] Doctor join-window error classified via `006`, not message text alone (`doctor/pages/appointment-detail.page.doctor.tsx`)

### 9.2 P0 — breaks the intended e2e flow

- [x] **Remote audio is never played back** (call-object mode responsibility). Only the _video_ track is extracted into a MediaStream (`shared/daily/use-daily-video-room.hook.ts` — `tracks?.audio?.persistentTrack` typed but unread); there is **no `<audio>` element anywhere in the app**, so calls may connect with video but total silence.
  - DONE: `audioStream` added to `DailyParticipantTile`; `RemoteAudioLayer`/`RemoteAudioSink` in `video-call.component.tsx` render one `<audio autoPlay playsInline>` per remote participant, mounted outside both layout branches.
  - Render one `<audio autoPlay playsInline muted={participant.isLocal}>` per remote participant at the top level of `VideoCallInner` (outside PIP/expanded branches so audio survives layout switches); rely on existing `participant-updated` → `syncParticipants()` for mute/unmute reactivity.
  - **Gate: mandatory two-device smoke test before merge** — still outstanding; types/lint/tests cannot prove audio output.
- [ ] **`VIDEO_ROOM_OPENED` push has no consumer.** No notification feed/socket/SSE infra exists client-side; header bell is decorative (`shared/components/dash-header.component.shared.tsx`). After bounded retries exhaust (~10s) the patient waits blind.
  - Needs backend feed contract (endpoint or socket channel). Client shape: subscribe → match `VIDEO_ROOM_OPENED_TYPE` → `parseVideoDeepLink()` → invalidate session query / navigate.
- [x] **Spec deep-link path won't resolve.** Push carries `/appointments/:id/video`; route lives at `/patient/dashboard/appointments/:id/video`. DONE: `index.route.tsx` redirects `/appointments/:id/video` → `/patient/dashboard/appointments/:id/video` (replace).
- [x] **Doctor double-fetches room/token.** `getDoctorVideoSessionReq` fires in `doctor/pages/appointment-detail.page.doctor.tsx` (to get `consultationId`) and again in `doctor/pages/view-consultation-space.page.doctor.tsx` under a different query key — two owner tokens, double latency, violates "call once per screen-open".
  - DONE: shared key `DOCTOR_VIDEO_SESSION_QUERY_KEY`; join mutation uses `fetchDoctorVideoSession(queryClient, …)`, consultation-space query reads the same cache (`staleTime` 60s).

### 9.3 P1 — degrades mid-call UX

- [x] **Hardcoded muted + camera-off joins** (defaults now role-based; full pre-join screen still open — see below) (`use-daily-video-room.hook.ts`: `startAudioOff/startVideoOff: true`) — every consultation starts with both sides disabled. Defaults now role-based in `DEFAULT_MEDIA_BY_ROLE` (doctor on/on, patient off/off). Pre-join device-check screen remains open below (preview tile, mic level, permission grant) which also absorbs the slow-permission delay spec §3 warns about.
- [x] **No unexpected-disconnect recovery.** Transient blips show "reconnecting", but a hard drop lands in generic error + manual retry. Auto-rejoin flow: refetch session (fresh token) → `retryJoin()`. Distinguish copy: "reconnecting…" vs "you were disconnected" vs "failed to join".
- [~] **`expiresAt` proactive refresh** — partially addressed: auto-rejoin now reads `latestSessionRef`, so a parent refetch lands a fresh token and the next join uses it. Still open: _pre-emptive_ refresh shortly before expiry during a live call.
- [x] **Remote-left reads as "Connecting…"**: after `participant-left` the status flips to `waiting` and the spinner shows (`video-call.component.tsx`). Should read "Dr X has left the call" / waiting-room state. Also missing: call-duration timer.
- [x] **`scheduledEndAtUtc` prop is dead** (declared in `VideoCallProps`, passed by the doctor page, never rendered). Per spec §5: time-remaining indicator near scheduled end, "5 min left" warning, and clear state when new joins are locked but the room is still live.
- [x] **Doctor-side retry still unconditional** in `view-consultation-space.page.doctor.tsx` (`retry: 1` retries non-retryable 400 "006"/403). Swap to `shouldRetryTokenFetch`.

### 9.4 P2 — hygiene & polish

- [x] **Dead duplicate call UI**: `shared/daily/daily-video-room.component.tsx` + `daily-call-controls.component.tsx` are imported by nothing outside themselves. Delete or consolidate before they rot.
- [x] **Post-call continuity**: leaving routes back with no status ("Your doctor is writing up notes…"); verify the separate consultation-completion action spec mandates exists in the UI.
- [x] **No tests**: vitest for the pure classifier/parser functions (`video-session-errors.util.ts`) — cheap regression insurance; repo currently has no test runner.
- [x] **Unsupported-browser gate**: check secure context / WebRTC support before mounting daily-js.
- [x] **`retryJoin()` unwired** from the shared component's error UI (hook exposes it; component doesn't use it).
- [ ] **Audio output picker**: `setAudioDevice`/`getAudioDevices` unused — matters on phones + Bluetooth.
- [ ] **Mic level meter / active-speaker highlight** (`active-speaker-change` event unused) so users can tell their mic died.
- [ ] **Notification bell**: wire to the future notification feed (currently static dot).

### 9.5 Execution status

Second pass (Aug 2026) shipped items: remote-audio sink layer, deep-link redirect,
doctor single-fetch, role-based media defaults, bounded auto-rejoin with fresh-token
refetch hook (`onSessionStale`), peer-left banner + call duration timer +
`scheduledEndAtUtc` countdown, conditional retries, browser-support gate, dead-code
removal, post-call continuity toast, vitest + 14 classifier tests.

**Still open (blocked or deferred):**

- `VIDEO_ROOM_OPENED` consumer — awaiting notification contracts from backend.
- Full pre-join device-check screen (preview tile, mic meter, speaker picker) — deferred; current defaults are role-based.
- Two-device smoke test — required before merging the audio work.

Original suggested order (for reference):

1. Remote-audio fix ✅ · 2. Deep-link redirect ✅ · 3. Doctor single-fetch ✅ ·
2. Push consumer ⏸ (backend) · 5. Pre-join screen (partial: defaults done) ·
3. Disconnect recovery ✅ / expiry refresh ✅ / countdown ✅ · 7. P2 batch ✅

---

_Reflects `claude/codebase-context-3ujqn3` at `f30a630` (public mirror, pending merge/sync). Swagger at `/docs` carries the same contract in OpenAPI form when the server runs outside production._
