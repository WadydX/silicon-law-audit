// netlify/functions/send-email.js

const emailjs = require('@emailjs/nodejs');

// 1️⃣ Initialize with your trimmed keys
emailjs.init({
  publicKey:  process.env.EMAILJS_PUBLIC_KEY.trim(),
  privateKey: process.env.EMAILJS_PRIVATE_KEY.trim(),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // 2️⃣ Parse incoming JSON
  let body;
  try {
    body = typeof event.body === 'string'
      ? JSON.parse(event.body)
      : event.body;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // 3️⃣ Destructure & basic validation
  const {
    user_name,
    user_email,
    company_name,
    phone_number = '',
    compliance_score,
    full_summary,
    attachments = []       // <-- array of { name, data }
  } = body;

  if (!user_name || !user_email || !company_name || !full_summary) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  // 4️⃣ Load EmailJS IDs from env
  const serviceId   = process.env.EMAILJS_SERVICE_ID;
  const firmTplId   = process.env.EMAILJS_FIRM_TEMPLATE_ID;
  const clientTplId = process.env.EMAILJS_CLIENT_TEMPLATE_ID;
  if (!serviceId || !firmTplId || !clientTplId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server misconfiguration' }),
    };
  }

  // 5️⃣ Build your template parameters (no attachments here!)
  const templateParams = {
    user_name,
    user_email,
    company_name,
    phone_number,
    compliance_score: parseInt(compliance_score, 10) || 0,
    full_summary,
  };

  // 6️⃣ Prepare attachments for EmailJS options
  //    EmailJS expects: { filename, content (base64), encoding: 'base64' }
  const emailJsAttachments = attachments.map(att => {
    // att.data looks like: "data:<mime>;base64,AAAA..."
    const [, base64] = att.data.split(',');
    return {
      filename: att.name,
      content:  base64,
      encoding: 'base64'
    };
  });

  try {
    // → Send to your firm, passing attachments in the options parameter
    await emailjs.send(
      serviceId,
      firmTplId,
      templateParams,
      { attachments: emailJsAttachments }
    );

    // → Send to the client (using {{user_email}} in the To: field)
    await emailjs.send(
      serviceId,
      clientTplId,
      templateParams,
      { attachments: emailJsAttachments }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails sent successfully' })
    };

  } catch (err) {
    console.error('EmailJS error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.text || err.message || 'EmailJS failure' })
    };
  }
};
