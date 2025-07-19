// netlify/functions/send-email.js

const emailjs = require('@emailjs/nodejs');

// 1) Initialize with your trimmed keys
emailjs.init({
  publicKey:  process.env.EMAILJS_PUBLIC_KEY.trim(),
  privateKey: process.env.EMAILJS_PRIVATE_KEY.trim(),
});

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // 2) Parse JSON
  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  // 3) Destructure & validate (include attachments array)
  const {
    user_name,
    user_email,
    company_name,
    phone_number = '',
    compliance_score,
    full_summary,
    attachments = []           // <-- optional array of { name, data }
  } = body;
console.log('📎 attachments received in function:', attachments.length, attachments.map(a=>a.name));

  if (!user_name || !user_email || !company_name || !full_summary) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  // 4) Load your EmailJS IDs
  const serviceId   = process.env.EMAILJS_SERVICE_ID;
  const firmTplId   = process.env.EMAILJS_FIRM_TEMPLATE_ID;
  const clientTplId = process.env.EMAILJS_CLIENT_TEMPLATE_ID;
  if (!serviceId || !firmTplId || !clientTplId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  // 5) Build template params
  const params = {
    user_name,
    user_email,
    company_name,
    phone_number,
    compliance_score: parseInt(compliance_score, 10) || 0,
    full_summary,
  };

    // 6) Map incoming attachments into EmailJS format
  //    Pass full data-URI + filename and let the SDK infer mime.
  const emailJsAttachments = attachments.map(att => ({
    name: att.name,
    data: att.data
  }));


  try {
    // → Send to your firm, including attachments
    await emailjs.send(
      serviceId,
      firmTplId,
      params,
      { attachments: emailJsAttachments }
    );

    // → Send to the client (using {{user_email}} as the "To" address)
    await emailjs.send(
      serviceId,
      clientTplId,
      params,
      { attachments: emailJsAttachments }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Both emails sent successfully' })
    };

  } catch (err) {
    console.error('EmailJS error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.text || err.message || 'EmailJS error' })
    };
  }
};
