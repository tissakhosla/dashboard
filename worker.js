const ALLOWED_ORIGINS = ['https://tissakhosla.github.io', 'null', null];
const SHEET_ID = '1S2mhcn2CssN7YA0xivmjdugpe2_MNckyx01N8h8nk8g';
const SHEET_NAME = 'slog-data';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }), origin);
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${env.GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const rows = data.values ?? [];
      const lastRow = rows[rows.length - 1] ?? [];
      return cors(Response.json(lastRow), origin);
    } catch (e) {
      return cors(new Response(JSON.stringify({ error: e.message }), { status: 500 }), origin);
    }
  }
};

function cors(res, origin) {
  const headers = new Headers(res.headers);
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  headers.set('Access-Control-Allow-Origin', allowed);
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Content-Type', 'application/json');
  return new Response(res.body, { status: res.status, headers });
}
