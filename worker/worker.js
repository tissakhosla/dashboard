const ALLOWED_ORIGIN = '*';
const SHEET_ID = '1S2mhcn2CssN7YA0xivmjdugpe2_MNckyx01N8h8nk8g';
const SHEET_NAME = 'slog-data';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    if (request.method === 'POST') {
      try {
        const { timestamp, center, notes } = await request.json();
        const token = await getAccessToken(env);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}:append?valueInputOption=USER_ENTERED`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [[timestamp, center, notes]] }),
        });
        if (!res.ok) {
          const err = await res.text();
          return cors(new Response(JSON.stringify({ error: err }), { status: 500 }));
        }
        return cors(Response.json({ ok: true }));
      } catch (e) {
        return cors(new Response(JSON.stringify({ error: e.message }), { status: 500 }));
      }
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${env.GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const rows = (data.values ?? []).slice(1);
      const lastRow = rows[rows.length - 1] ?? [];
      return cors(Response.json(lastRow));
    } catch (e) {
      return cors(new Response(JSON.stringify({ error: e.message }), { status: 500 }));
    }
  }
};

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: env.GOOGLE_SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));
  const signingInput = `${header}.${payload}`;

  const pem = env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n');
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${b64urlBytes(new Uint8Array(sig))}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const { access_token } = await tokenRes.json();
  return access_token;
}

function b64url(str) {
  return b64urlBytes(new TextEncoder().encode(str));
}

function b64urlBytes(bytes) {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function cors(res) {
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Content-Type', 'application/json');
  return new Response(res.body, { status: res.status, headers });
}
