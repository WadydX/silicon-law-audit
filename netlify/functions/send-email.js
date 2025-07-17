const { send } = require('@emailjs/nodejs');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let params;
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : {};
    params = {
      user_name: body.user_name || null,
      user_email: body.user_email || null,
      email: body.email || null,
      company_name: body.company_name || null,
      phone_number: body.phone_number || '',
      compliance_score: parseInt(body.compliance_score, 10) || 0,
      full_summary: body.full_summary || null
    };
  } catch (error) {
    console.error('Failed to parse JSON body:', error);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  console.log('Received params:', params);

  if (!params.user_name || !params.user_email || !params.company_name || !params.full_summary) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const firmTemplateId = process.env.EMAILJS_FIRM_TEMPLATE_ID;
  const clientTemplateId = process.env.EMAILJS_CLIENT_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY; // Optional private key

  console.log('Environment variables present:', { serviceId: !!serviceId, firmTemplateId: !!firmTemplateId, clientTemplateId: !!clientTemplateId, publicKey: !!publicKey, privateKey: !!privateKey });

  if (!serviceId || !firmTemplateId || !clientTemplateId || !publicKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing configuration' }) };
  }

  try {
    const userId = privateKey || publicKey; // Use privateKey if available, else publicKey
    console.log('Using userId (last 2 chars masked):', `${userId.slice(0, -2)}XX`);

    const firmResponse = await send({
      service_id: serviceId,
      template_id: firmTemplateId,
      user_id: userId,
      template_params: params
    });
    console.log('Firm email response:', firmResponse);

    const clientResponse = await send({
      service_id: serviceId,
      template_id: clientTemplateId,
      user_id: userId,
      template_params: params
    });
    console.log('Client email response:', clientResponse);

    if (!firmResponse.success || !clientResponse.success) {
      throw new Error(firmResponse.error || clientResponse.error);
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Emails sent successfully' }) };
  } catch (error) {
    console.error('Email sending failed:', { error, message: error.message });
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Could not send emails' }) };
  }
};
