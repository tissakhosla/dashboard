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

#### Settings
1. Define buttons
1. Define Freshness time (has to be touched every x hours)
1. Define Minimum Duration to accept Freshness

#### To Dos
1. Build out todos page pulled from a file in my slipbox repo.


#### Stale-client visual indicators
Visually indicate buttons that haven't been selected for a given length of time. Options:

- **Opacity fade** — stale buttons gradually dim toward ~40% opacity; recently used stay full opacity
- **Color temperature drift** — recently used buttons retain full color; unused ones desaturate toward gray over time
- **Age badge** — tiny `3d` / `2w` label in the corner of each button showing days/weeks since last pick; fits the monospace aesthetic well
- **Border style shift** — border transitions from solid → dashed → dotted as a button ages
- **Brightness/contrast dim** — `filter: brightness(0.5) contrast(0.7)` scaled to staleness; button looks "off" rather than just gray
- **Freshness stripe** — 2px bottom-border accent that is vivid when recently used and drops away when stale
- **Font weight** — recently used = `font-weight: bold`, long-unused = `font-weight: 300`

Recommended: **opacity fade + age badge** combined — the button dims for at-a-glance signal, and the badge gives the precise duration on demand.
