// send-email.js
const { init, send } = require('@emailjs/nodejs')

// 1) Initialize the SDK with your keys
init({
  publicKey:  process.env.EMAILJS_PUBLIC_KEY.trim(),
  privateKey: process.env.EMAILJS_PRIVATE_KEY.trim(),
})

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }

  // 2) Parse JSON
  let body
  try {
    body = typeof event.body === 'string'
      ? JSON.parse(event.body)
      : event.body
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  // 3) Destructure & basic validation
  const {
    user_name,
    user_email,
    company_name,
    phone_number = '',
    compliance_score,
    full_summary,
    attachments = []          // <-- this is your array of { name, data }
  } = body

  if (!user_name || !user_email || !company_name || !full_summary) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  // 4) Load your EmailJS IDs
  const serviceId   = process.env.EMAILJS_SERVICE_ID
  const firmTplId   = process.env.EMAILJS_FIRM_TEMPLATE_ID
  const clientTplId = process.env.EMAILJS_CLIENT_TEMPLATE_ID

  if (!serviceId || !firmTplId || !clientTplId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' }),
    }
  }

  // 5) Build the template parameters
  const templateParams = {
    user_name,
    user_email,
    company_name,
    phone_number,
    compliance_score: parseInt(compliance_score, 10) || 0,
    full_summary,
  }

  // 6) Turn your incoming attachments into what the v5 SDK expects
  //    EmailJS wants an array of { filename, content, encoding }
  const emailJsAttachments = attachments.map(att => {
    // att.data === "data:application/pdf;base64,JVBERi0xLjc..."
    const [ , base64 ] = att.data.split(',')
    return {
      filename: att.name,
      content:  base64,
      encoding: 'base64',
    }
  })

  try {
    // → Send to your firm
    await send({
      serviceId,
      templateId: firmTplId,
      templateParams,
      attachments: emailJsAttachments
    })

    // → Send to the client
    await send({
      serviceId,
      templateId: clientTplId,
      templateParams,
      attachments: emailJsAttachments
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Both emails sent successfully' })
    }

  } catch (err) {
    console.error('EmailJS error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.text || err.message || 'EmailJS error' })
    }
  }
}
