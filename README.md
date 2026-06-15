# Dashboard

A fullscreen personal time-tracking dashboard. Shows a live clock, elapsed time on the current task, and a one-tap client switcher that logs entries to Google Sheets.

## Usage

Open `index.html` directly in a browser — no build step or server required.

To log a task: optionally type a note, then tap a client button. The elapsed timer resets and the new row is appended to the sheet. "Other" reveals a text field for a custom client name.

## Architecture

| File | Role |
|------|------|
| `index.html` | Main page — clock, elapsed timer, current task display, client switcher |
| `style.css` | All styles, including dark/light theme |
| `slog.js` | `fetchLastRow()` and `postNewRow()` — reads/writes the Google Sheet via the worker |
| `worker/worker.js` | Cloudflare Worker — proxies Sheets API reads (API key) and writes (Service Account JWT) |
| `worker/wrangler.toml` | Worker config — deployed as `slog-api` |

## Setup

### Google Sheets

The sheet has columns: `timestamp`, `center` (client), `notes`.

**Reading** uses a plain Google API key (stored as the `GOOGLE_API_KEY` worker secret).

**Writing** requires a Google Service Account:
1. Create a service account in Google Cloud Console → IAM & Admin → Service Accounts
2. Download a JSON key and note the `client_email` and `private_key` fields
3. Share the sheet with the service account email as Editor

### Cloudflare Worker

```bash
cd worker
npx wrangler secret put GOOGLE_API_KEY
npx wrangler secret put GOOGLE_SA_EMAIL      # client_email from service account JSON
npx wrangler secret put GOOGLE_SA_PRIVATE_KEY  # private_key from service account JSON
npx wrangler deploy
```

### Potential Upgrades
