// netlify/functions/send-email.js

// 1️⃣ Import & initialize EmailJS SDK
const emailjs = require('@emailjs/nodejs');

// Pull your keys out of environment vars and trim whitespace
const PUBLIC_KEY  = process.env.EMAILJS_PUBLIC_KEY?.trim();
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY?.trim();

// Initialize the SDK so every send() call includes your keys
emailjs.init({
  publicKey:  PUBLIC_KEY,
  privateKey: PRIVATE_KEY,
});

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // 2️⃣ Parse the incoming JSON body
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

  // 3️⃣ Build & validate template parameters
  const params = {
    user_name:        body.user_name,
    user_email:       body.user_email,
    company_name:     body.company_name,
    phone_number:     body.phone_number || '',
    compliance_score: parseInt(body.compliance_score, 10) || 0,
    full_summary:     body.full_summary,
  };

  if (
    !params.user_name ||
    !params.user_email ||
    !params.company_name ||
    !params.full_summary
  ) {
    console.error('Validation error – missing fields:', params);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  // 4️⃣ Grab your EmailJS IDs from env vars
  const serviceId   = process.env.EMAILJS_SERVICE_ID;
  const firmTplId   = process.env.EMAILJS_FIRM_TEMPLATE_ID;
  const clientTplId = process.env.EMAILJS_CLIENT_TEMPLATE_ID;

  if (!serviceId || !firmTplId || !clientTplId || !PUBLIC_KEY) {
    console.error('EmailJS config missing:', {
      serviceId, firmTplId, clientTplId, publicKeyPresent: Boolean(PUBLIC_KEY)
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  try {
    // 5️⃣ Send the audit summary to the firm
    console.log('Sending firm email with params:', params);
    const firmRes = await emailjs.send(
      serviceId,
      firmTplId,
      params
    );
    console.log('Firm email response:', firmRes);

    // 6️⃣ Send the audit results back to the client
    //     We *don’t* inject a separate `to_email` here—your template should
    //     have its “To” field set to use {{user_email}} :contentReference[oaicite:1]{index=1}
    console.log('Sending client email with params:', params);
    const clientRes = await emailjs.send(
      serviceId,
      clientTplId,
      params
    );
    console.log('Client email response:', clientRes);

    // 7️⃣ Return success
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Both emails sent successfully' })
    };

  } catch (err) {
    // 8️⃣ Error handling
    console.error('Email sending failed:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.text || err.message || 'EmailJS error'
      })
    };
  }
};
