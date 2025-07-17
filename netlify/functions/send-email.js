const { send } = require('@emailjs/nodejs');

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

  console.log('Received request with data:', { user_name, user_email, company_name, full_summary });

  if (!user_name || !user_email || !company_name || !full_summary) {
    console.log('Missing required fields:', { user_name, user_email, company_name, full_summary });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  try {
    console.log('Environment variables:', {
      serviceId: process.env.EMAILJS_SERVICE_ID,
      firmTemplateId: process.env.EMAILJS_FIRM_TEMPLATE_ID,
      clientTemplateId: process.env.EMAILJS_CLIENT_TEMPLATE_ID,
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

    const clientParams = { ...firmParams };

    // Send email to the firm
    await send({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_FIRM_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: firmParams
    });

    // Send email to the client
    await send({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_CLIENT_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: clientParams
    });

    console.log('Emails sent successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails sent successfully' })
    };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not send emails. Please try again later.' })
    };
  }
};
