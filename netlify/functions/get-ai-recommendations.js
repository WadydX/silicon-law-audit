const axios = require('axios');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const { prompt } = JSON.parse(event.body);

  if (!prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Prompt is required' })
    };
  }

  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await axios.post(apiUrl, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.data.candidates?.[0]?.content?.parts?.[0]) {
      throw new Error('Invalid response structure from API');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ text: response.data.candidates[0].content.parts[0].text })
    };
  } catch (error) {
    console.error('AI recommendations failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch AI recommendations' })
    };
  }
};