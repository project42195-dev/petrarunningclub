const https = require('https');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Check env vars are present
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Server config missing. Check Vercel environment variables.' });
  }

  const body = req.body || {};
  const code = body.code;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const payload = JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code'
  });

  const options = {
    hostname: 'www.strava.com',
    path: '/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (!json.access_token) {
          return res.status(400).json({ 
            error: json.message || 'Auth failed',
            details: json.errors || null
          });
        }
        res.json({
          access_token: json.access_token,
          athlete: {
            id: json.athlete.id,
            firstname: json.athlete.firstname,
            lastname: json.athlete.lastname,
            profile_medium: json.athlete.profile_medium,
            city: json.athlete.city,
            state: json.athlete.state,
            country: json.athlete.country
          }
        });
      } catch (e) {
        res.status(500).json({ error: 'Parse error: ' + e.message, raw: data });
      }
    });
  });

  request.on('error', e => res.status(500).json({ error: e.message }));
  request.write(payload);
  request.end();
};
