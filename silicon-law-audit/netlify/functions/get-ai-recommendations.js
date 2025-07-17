// This is your secure "private assistant" that talks to Google's AI.
// Save this file inside the "netlify/functions" folder.

const { GoogleGenerativeAI } = require("@google/generative-ai");

// This is where you will store your secret API key in Netlify's settings.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { answers, score } = JSON.parse(event.body);

    // Create the prompt for the AI
    let promptSummary = "The user's audit answers are as follows:\n";
    for (const key in answers) {
        const answerData = answers[key];
        const answerText = Array.isArray(answerData.answer) ? answerData.answer.join(', ') : answerData.answer;
        if (answerText) {
           promptSummary += `- ${answerData.question}: ${answerText}\n`;
        }
    }

    const prompt = `You are a helpful legal tech assistant for a law firm named 'Silicon Law'. A potential client has just completed a legal compliance audit. Their final compliance score is ${score}%. Based on their following answers, provide a brief, actionable summary of their top 3 legal risks and suggest concrete next steps. Frame the advice as helpful guidance, not as official legal advice. The tone should be professional, encouraging, and clear. Format the output as simple HTML using h4 for headings, ul and li for lists, and p for paragraphs. Do not wrap the entire response in a markdown block.\n\n${promptSummary}\n\nPlease provide the analysis now.`;

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ recommendation: text }),
    };
  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate recommendations." }),
    };
  }
};
