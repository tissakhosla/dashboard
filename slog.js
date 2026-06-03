const WORKER_URL = 'https://dashboard.tissa-music.workers.dev';

async function fetchLastRow() {
    const res = await fetch(WORKER_URL);
    const lastRow = await res.json();
    console.log(lastRow);
    return lastRow;
}

fetchLastRow();
