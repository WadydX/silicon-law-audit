// netlify/functions/send-email.js
const emailjs = require('@emailjs/nodejs');

// Pull your keys out of env, trim off any stray whitespace:
const PUBLIC_KEY  = process.env.EMAILJS_PUBLIC_KEY?.trim();
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY?.trim();

// Immediately initialize the SDK with your keys.
// The publicKey is **required**; privateKey is optional but recommended
// for non-browser (server-side) use :contentReference[oaicite:0]{index=0}.
emailjs.init({
  publicKey:  PUBLIC_KEY,
  privateKey: PRIVATE_KEY,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Parse and validate JSON body
  let body;
  try {
    body = typeof event.body === 'string'
      ? JSON.parse(event.body)
      : event.body;
  } catch (err) {
    console.error('Failed to parse JSON body:', err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const params = {
    user_name:       body.user_name,
    user_email:      body.user_email,
    email:           body.email,
    company_name:    body.company_name,
    phone_number:    body.phone_number || '',
    compliance_score: parseInt(body.compliance_score, 10) || 0,
    full_summary:    body.full_summary,
  };

  // Basic field checks
  if (!params.user_name || !params.user_email || !params.company_name || !params.full_summary) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  // Check that your environment variables are set
  const serviceId        = process.env.EMAILJS_SERVICE_ID;
  const firmTemplateId   = process.env.EMAILJS_FIRM_TEMPLATE_ID;
  const clientTemplateId = process.env.EMAILJS_CLIENT_TEMPLATE_ID;
  if (!serviceId || !firmTemplateId || !clientTemplateId || !PUBLIC_KEY) {
    console.error('Missing config:', {
      serviceId, firmTemplateId, clientTemplateId, publicKey: !!PUBLIC_KEY
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing EmailJS configuration' })
    };
  }

  try {
    // Send to your firm
    const firmRes = await emailjs.send(
      serviceId,
      firmTemplateId,
      params
    );
    console.log('Firm email response:', firmRes);

    // Send to your client
    const clientRes = await emailjs.send(
      serviceId,
      clientTemplateId,
      params
    );
    console.log('Client email response:', clientRes);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails sent successfully' })
    };
  } catch (err) {
    console.error('Email sending failed:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Could not send emails' })
    };
  }
};
