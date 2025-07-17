const emailjs = require('@emailjs/node');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const {
    user_name,
    user_email,
    email,
    company_name,
    phone_number,
    compliance_score,
    full_summary
  } = JSON.parse(event.body);

  if (!user_name || !user_email || !company_name || !full_summary) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  try {
    // Initialize EmailJS with environment variables
    emailjs.init({
      publicKey: process.env.EMAILJS_PUBLIC_KEY
    });

    const firmParams = {
      user_name,
      user_email,
      email,
      company_name,
      phone_number: phone_number || '',
      compliance_score,
      full_summary
    };

    const clientParams = { ...firmParams }; // Same parameters for client email

    // Send email to the firm
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_FIRM_TEMPLATE_ID,
      firmParams
    );

    // Send email to the client
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_CLIENT_TEMPLATE_ID,
      clientParams
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails sent successfully' })
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send emails' })
    };
  }
};
