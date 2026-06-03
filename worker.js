const ALLOWED_ORIGIN = 'https://tissakhosla.github.io';
const SHEET_ID = '1S2mhcn2CssN7YA0xivmjdugpe2_MNckyx01N8h8nk8g';
const SHEET_NAME = 'slog-data';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${env.GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const rows = data.values ?? [];
      const lastRow = rows[rows.length - 1] ?? [];
      return cors(Response.json(lastRow));
    } catch (e) {
      return cors(new Response(JSON.stringify({ error: e.message }), { status: 500 }));
    }
  }
};

function cors(res) {
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Content-Type', 'application/json');
  return new Response(res.body, { status: res.status, headers });
}
