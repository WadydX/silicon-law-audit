const { send } = require('@emailjs/nodejs');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Parse the body directly from event.body (string or Buffer)
  const body = typeof event.body === 'string' ? event.body : await new Promise((resolve) => resolve(event.body.toString()));
  const formData = new URLSearchParams(body);
  const params = {
    user_name: formData.get('user_name'),
    user_email: formData.get('user_email'),
    email: formData.get('email'),
    company_name: formData.get('company_name'),
    phone_number: formData.get('phone_number') || '',
    compliance_score: parseInt(formData.get('compliance_score'), 10) || 0,
    full_summary: formData.get('full_summary')
  };

  console.log('Received params:', params);

  if (!params.user_name || !params.user_email || !params.company_name || !params.full_summary) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const firmTemplateId = process.env.EMAILJS_FIRM_TEMPLATE_ID;
  const clientTemplateId = process.env.EMAILJS_CLIENT_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  console.log('Environment variables present:', { serviceId: !!serviceId, firmTemplateId: !!firmTemplateId, clientTemplateId: !!clientTemplateId, publicKey: !!publicKey });

  if (!serviceId || !firmTemplateId || !clientTemplateId || !publicKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing configuration' }) };
  }

  try {
    const trimmedPublicKey = publicKey.trim();
    console.log('Trimmed publicKey value (last 2 chars masked):', `${trimmedPublicKey.slice(0, -2)}XX`);

    const firmResponse = await send({
      service_id: serviceId,
      template_id: firmTemplateId,
      user_id: trimmedPublicKey,
      template_params: params
    });
    console.log('Firm email response:', firmResponse);

    const clientResponse = await send({
      service_id: serviceId,
      template_id: clientTemplateId,
      user_id: trimmedPublicKey,
      template_params: params
    });
    console.log('Client email response:', clientResponse);

    if (!firmResponse.success || !clientResponse.success) {
      throw new Error(firmResponse.error || clientResponse.error);
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Emails sent successfully' }) };
  } catch (error) {
    console.error('Email sending failed:', { error, message: error.message });
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not send emails' }) };
  }
};
