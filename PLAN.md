# Dashboard Expansion Plan

## Layout

```
        Wed 06 03 2026
        HH:MM:SS
        HH:MM:SS  (elapsed)
        Finity — Claude Fun  [↺ switch]

  ⛅ 72°F   ⏱ 3h 14m today   📧 4   💬 7   Teams 2
```

Clock stays dominant. Task switcher inline with current task. Notification counts in a minimal bottom status bar.

---

## Phase 1 — Core

### Task switcher
- `[↺]` button next to current task → modal overlay with Client and Task fields (pre-filled)
- On submit: appends new row `[timestamp, client, task]` to Google Sheet → resets elapsed timer

**Requires a Google Service Account for write access** (API keys are read-only):
1. Create service account in Google Cloud Console → download JSON key
2. Share the Google Sheet with the service account email as Editor
3. Add `GOOGLE_SA_PRIVATE_KEY` and `GOOGLE_SA_EMAIL` as Cloudflare Worker secrets
4. Worker generates RS256 JWT → exchanges for access token → calls Sheets `values:append`

### Time logged today
- Worker `GET /today` returns all rows where timestamp matches today's date
- Client sums durations between consecutive timestamps → displays as `Xh Xm`

### Weather
- Fetch `https://wttr.in/?format=%C+%t` directly from browser (no auth needed)
- Fetched once on load

---

## Phase 2 — Notification counts (future)

Gmail, Slack, and Teams all require OAuth — deferred to a separate session.
- Worker handles OAuth callback and stores refresh tokens in Cloudflare KV
- Worker exposes `/counts` endpoint, client polls every 5 minutes

---

## Files to change

| File | Changes |
|------|---------|
| `worker.js` | Add routing: `GET /`, `GET /today`, `POST /`. Add service account JWT auth for writes. |
| `index.html` | Task switch modal, bottom status bar, weather fetch, time-today display |
| `slog.js` | Add `postNewRow(timestamp, client, task)` alongside existing `fetchLastRow()` |
