const WORKER_URL = 'https://slog-api.tissa-music.workers.dev';

async function fetchRows() {
    const res = await fetch(WORKER_URL);
    return res.json();
}

async function postNewRow(timestamp, center, notes) {
    const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp, center, notes }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Unknown error');
    }
    return res.json();
}

