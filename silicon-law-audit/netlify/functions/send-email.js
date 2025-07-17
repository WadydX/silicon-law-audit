// This is your new secure "private assistant" for sending emails.
// It uses the correct Node.js library for EmailJS.

const emailjs = require('@emailjs/nodejs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { answers, score } = JSON.parse(event.body);

  // These keys are securely accessed from your Netlify environment variables
  const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
  const FIRM_TEMPLATE_ID = process.env.EMAILJS_FIRM_TEMPLATE_ID;
  const CLIENT_TEMPLATE_ID = process.env.EMAILJS_CLIENT_TEMPLATE_ID;
  const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
  const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY; // The new, required private key

  const templateParams = {
    user_name: `${answers.firstName.answer} ${answers.lastName.answer}`,
    user_email: answers.email.answer,
    company_name: answers.companyName.answer,
    phone_number: answers.phone.answer,
    compliance_score: score,
    full_summary: Object.entries(answers).map(([key, value]) => `${value.question}: ${Array.isArray(value.answer) ? value.answer.join(', ') : value.answer}`).join('\n')
  };

  try {
    // Send email to the firm
    await emailjs.send(SERVICE_ID, FIRM_TEMPLATE_ID, templateParams, {
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY, 
    });
    console.log('Firm email sent successfully!');

    // Send email to the client
    await emailjs.send(SERVICE_ID, CLIENT_TEMPLATE_ID, templateParams, {
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY,
    });
    console.log('Client email sent successfully!');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails sent successfully' }),
    };

  } catch (error) {
    console.error('EmailJS submission FAILED...', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send one or more emails. Please check your EmailJS template variables and account settings.' }),
    };
  }
};
