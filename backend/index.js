require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const hf = require('./lib/hfClient');
const supabase = require('./lib/supabaseClient');
const { detectIntent, extractSlotsForAccommodation } = require('./intents');
const { searchHotels } = require('./services/accommodationService');

const app = express();
app.use(cors());
app.use(bodyParser.json());

async function retrieveDocs(query, k = 6) {
    const qvec = await hf.embed(query);
    const { data, error } = await supabase.rpc('match_documents', { query_embedding: qvec, match_count: k });
    if (error) { console.error('Supabase RPC error', error); return []; }
    return data;
}

app.post('/api/chat', async (req, res) => {
    try {
        const { history } = req.body;
        if (!history || !Array.isArray(history) || history.length === 0) {
            return res.status(400).json({ error: 'Missing or invalid history' });
        }

        const lastUserMessage = [...history].reverse().find(m => m.role === 'user');
        if (!lastUserMessage) return res.status(400).json({ error: 'No user message found in history' });
        const userText = lastUserMessage.text;

        // 1) Detect intent on last user message
        console.log("i am in intent decider");
        const intentRes = await detectIntent(userText);
        const intent = intentRes.intent || 'general_travel';

        // 2) Accommodation intent handling
        if (intent === 'accommodation_search') {
            console.log("i am at accomodation")
            const slots = await extractSlotsForAccommodation(userText);
            const city = slots.city;
            let hotels = [];
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            // Set default checkin if missing
            if (!slots.checkin) {
                slots.checkin = todayStr;
            }

            // Set default checkout if missing
            if (!slots.checkout) {
                const checkoutDate = new Date(slots.checkin);
                checkoutDate.setDate(checkoutDate.getDate() + 3); // default 3 nights
                slots.checkout = checkoutDate.toISOString().split('T')[0];
            }

            // Check if checkin date is before today, update if outdated
            if (new Date(slots.checkin) < today) {
                slots.checkin = todayStr;
            }

            // Check if checkout date is before or same as checkin, update if outdated
            if (new Date(slots.checkout) <= new Date(slots.checkin)) {
                const checkoutDate = new Date(slots.checkin);
                checkoutDate.setDate(checkoutDate.getDate() + 3); // default 3 nights
                slots.checkout = checkoutDate.toISOString().split('T')[0];
            }
            if (city) {
                hotels = await searchHotels({ cityName: city, checkInDate: slots.checkin, checkOutDate: slots.checkout });
            }
            return res.json({ type: 'accommodation', intent, slots, hotels });
        }

        // 3) General travel or destination recommendation: RAG + conversation context

        // Retrieve docs
        const docs = await retrieveDocs(userText, 6);
        const ctx = (docs || []).map(d => ({ id: d.id, title: d.title, body: d.body, metadata: d.metadata }));

        // Build context text for docs
        const contextText = ctx.map((d, i) => `[[${i + 1}] ${d.title}]\n${d.body}`).join('\n\n');

        // Build conversation history text (limit to last N messages)
        const maxMessages = 6;
        const recentHistory = history.slice(-maxMessages);
        const historyText = recentHistory.map(m => (m.role === 'user' ? `User: ${m.text}` : `Assistant: ${m.text}`)).join('\n');

        // Compose prompt
        const prompt = `
You are a helpful travel assistant. Use ONLY the provided CONTEXT for factual claims.

CONTEXT:
${contextText}

CONVERSATION HISTORY:
${historyText}

USER QUERY:
${userText}

INSTRUCTIONS:
Return valid JSON only with keys: answer (string), recommendations (array of {title, reason}), accommodations (array), itinerary (array), sources (array of {source_id, title}), needs_tool (bool).
`;

        const gen = await hf.generate(prompt, { max_new_tokens: 600, temperature: 0 });
        let parsed;
        try {
            parsed = JSON.parse(gen);
        } catch (e) {
            parsed = {
                answer: gen,
                recommendations: [],
                accommodations: [],
                itinerary: [],
                sources: ctx.map(c => ({ source_id: c.id, title: c.title })),
                needs_tool: false,
            };
        }

        return res.json({ type: 'rag', intent, ...parsed });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log('Backend running on', PORT));
