# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

Open `clock.html` directly in a browser — there is no build step or server required.

## Architecture

This is a two-file static web app:

- **`clock.html`** — self-contained page with inline CSS and JS. Renders a fullscreen digital clock updated every second via `setInterval`. Also renders a data row from `slog.js` into a `#log` div (expects `fetchLastRow()` to return a `user` object with `name` and `age` fields).
- **`slog.js`** — loaded as a `<script>` tag before the body; provides the `fetchLastRow()` function and the Google Sheets API key used to fetch log data.

The two pieces are coupled: `clock.html` calls `fetchLastRow()` and reads `user.name` / `user.age` from the result, so changes to `slog.js`'s return shape must stay in sync with the template in `clock.html`.
