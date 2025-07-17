// netlify/functions/get-ai-recommendations.js

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    console.error('Invalid JSON:', err);
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('Missing GOOGLE_API_KEY');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server not configured with API key' })
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    // Use the built-in fetch in Node 18+
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: body.contents })
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error('Google API error:', apiRes.status, text);
      return { statusCode: apiRes.status, body: text };
    }

    const json = await apiRes.json();
    return { statusCode: 200, body: JSON.stringify(json) };

  } catch (err) {
    console.error('Fetch error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal error' })
    };
  }
};
