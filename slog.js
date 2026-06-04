const WORKER_URL = 'https://slog-api.tissa-music.workers.dev';

async function fetchLastRow() {
    const res = await fetch(WORKER_URL);
    const lastRow = await res.json();
    console.log(lastRow);
    return lastRow;
}

fetchLastRow();
