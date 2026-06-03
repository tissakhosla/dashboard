const API_KEY = 'AIzaSyDMuDIdGsCNQJW0xyQm8JudAsEr3QiB_fw';
const SHEET_ID = '1S2mhcn2CssN7YA0xivmjdugpe2_MNckyx01N8h8nk8g';
const SHEET_NAME = 'slog-data';

async function fetchLastRow() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const rows = data.values;
    const lastRow = rows[rows.length - 1];
    console.log(lastRow);
    return lastRow;
}

fetchLastRow();
