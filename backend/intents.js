const hf = require('./lib/hfClient');

const INTENTS = ['destination_recommendation', 'accommodation_search', 'general_travel'];

async function detectIntent(userText) {
    const prompt = `You are an intent classifier for a travel assistant. Classify the user's query into one of: ${INTENTS.join(', ')}.
Respond ONLY with valid JSON: {"intent": "<intent>", "confidence": 0.0}.
User query: "${userText.replace(/\"/g, '\\"')}"`;
    console.log("detectIntent prompt:", prompt);
    const res = await hf.generate(prompt, { max_new_tokens: 60, temperature: 0 });
    try {
        const parsed = JSON.parse(res);
        return parsed;
    } catch (e) {
        const lower = userText.toLowerCase();
        if (/hotel|stay|accommodation|room|hostel|booking/.test(lower)) return { intent: 'accommodation_search', confidence: 0.6 };
        return { intent: 'general_travel', confidence: 0.5 };
    }
}

async function extractSlotsForAccommodation(userText) {
    const prompt = `
You are a JSON extraction system.
Extract the following fields from the user query and return ONLY valid JSON (no explanation, no extra text):
{"city": "<city or null>", "checkin": "YYYY-MM-DD or null", "checkout": "YYYY-MM-DD or null", "budget_min": null, "budget_max": null}
If no checkin/checkout date is mentioned, set it to null.

User: "${userText.replace(/\"/g, '\\"')}"
Response:
`;
    console.log("extractSlotsForAccommodation prompt:", prompt);
    const raw = await hf.generate(prompt, { max_new_tokens: 60, temperature: 0 });

    // Extract JSON block using regex
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("JSON parse error:", e);
        }
    }

    // Fallback
    return { city: null, checkin: null, checkout: null, budget_min: null, budget_max: null };
}


module.exports = { detectIntent, extractSlotsForAccommodation };
