// netlify/functions/send-email.js

// 1️⃣ Import & initialize EmailJS SDK
const emailjs = require('@emailjs/nodejs');

// Pull and trim your keys from environment variables
const PUBLIC_KEY  = process.env.EMAILJS_PUBLIC_KEY?.trim();
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY?.trim();

// Initialize EmailJS so every send() call auto-includes your keys :contentReference[oaicite:0]{index=0}
emailjs.init({
  publicKey:  PUBLIC_KEY,
  privateKey: PRIVATE_KEY,
});

exports.handler = async (event) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // 2️⃣ Parse JSON body
  let body;
  try {
    body = typeof event.body === 'string'
      ? JSON.parse(event.body)
      : event.body;
  } catch (err) {
    console.error('Invalid JSON body:', err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  // 3️⃣ Destructure & validate
  const {
    user_name,
    user_email,
    company_name,
    phone_number = '',
    compliance_score,
    full_summary
  } = body;

  if (!user_name || !user_email || !company_name || !full_summary) {
    console.error('Validation error – missing fields:', { user_name, user_email, company_name, full_summary });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  // 4️⃣ Load your EmailJS IDs
  const serviceId   = process.env.EMAILJS_SERVICE_ID;
  const firmTplId   = process.env.EMAILJS_FIRM_TEMPLATE_ID;
  const clientTplId = process.env.EMAILJS_CLIENT_TEMPLATE_ID;

  if (!serviceId || !firmTplId || !clientTplId || !PUBLIC_KEY) {
    console.error('EmailJS config missing:', { serviceId, firmTplId, clientTplId, publicKeyPresent: Boolean(PUBLIC_KEY) });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  // 5️⃣ Build template parameters—note we include both user_email and to_email/reply_to
  const params = {
    user_name,
    user_email,
    to_email: user_email,    // for templates using {{to_email}}
    reply_to: user_email,    // for templates using {{reply_to}}
    company_name,
    phone_number,
    compliance_score: parseInt(compliance_score, 10) || 0,
    full_summary,
  };

  try {
    // → Send to your firm
    console.log('Sending firm email with params:', params);
    const firmRes = await emailjs.send(
      serviceId,
      firmTplId,
      params
    );
    console.log('Firm email response:', firmRes);

    // → Send to the client
    console.log('Sending client email with params:', params);
    const clientRes = await emailjs.send(
      serviceId,
      clientTplId,
      params
    );
    console.log('Client email response:', clientRes);

    // 6️⃣ Return success
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Both emails sent successfully' })
    };

  } catch (err) {
    // 7️⃣ Error handling
    console.error('Email sending failed:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.text || err.message || 'EmailJS error'
      })
    };
  }
};
