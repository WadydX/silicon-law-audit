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

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const firmTemplateId = process.env.EMAILJS_FIRM_TEMPLATE_ID;
  const clientTemplateId = process.env.EMAILJS_CLIENT_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !firmTemplateId || !clientTemplateId || !publicKey) {
    console.error('Missing environment variables:', { serviceId: !!serviceId, firmTemplateId: !!firmTemplateId, clientTemplateId: !!clientTemplateId, publicKey: !!publicKey });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing configuration. Please check environment variables.' })
    };
  }

  try {
    console.log('Attempting to send firm email');
    const firmParams = {
      user_name,
      user_email,
      email,
      company_name,
      phone_number: phone_number || '',
      compliance_score,
      full_summary
    };

    const firmResponse = await send({
      service_id: serviceId,
      template_id: firmTemplateId,
      user_id: publicKey,
      template_params: firmParams
    });
    console.log('Firm email response:', firmResponse);

    console.log('Attempting to send client email');
    const clientParams = { ...firmParams };
    const clientResponse = await send({
      service_id: serviceId,
      template_id: clientTemplateId,
      user_id: publicKey,
      template_params: clientParams
    });
    console.log('Client email response:', clientResponse);

    console.log('Emails sent successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails sent successfully' })
    };
  } catch (error) {
    console.error('Email sending failed:', {
      error: error,
      message: error?.message || 'No message',
      stack: error?.stack || 'No stack',
      code: error?.code || 'No code'
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not send emails. Please try again later.' })
    };
  }
};
