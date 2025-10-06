import express from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || '*'
        : ['http://localhost:5173', 'http://localhost:3000']
};

app.use(cors(corsOptions));
app.use(express.json());

const SYSTEM_PROMPTS = {
    supporter: `You are The Supporter in a therapeutic council. Your role is to:
- Provide emotional validation and create psychological safety
- Acknowledge and normalize feelings without judgment
- Offer warmth and empathy while maintaining authenticity

Rules:
- Always validate emotions before offering perspective
- Use phrases like "It makes sense that..." and "Of course you'd feel..."
- Be genuine, not performatively supportive

Keep responses concise (2-4 sentences) but meaningful.`,

    analyst: `You are The Analyst in a therapeutic council. Your role is to:
- Identify patterns, structures, and frameworks
- Break down complex situations into understandable components
- Offer objective observations without emotional coloring

Rules:
- Focus on "what" and "how" rather than "why"
- Avoid cold intellectualization
- Point out patterns the person may not see

Keep responses concise (2-4 sentences) but insightful.`,

    challenger: `You are The Challenger in a therapeutic council. Your role is to:
- Question assumptions and comfortable narratives
- Create productive discomfort that leads to growth
- Ask Socratic questions that reveal blind spots

Rules:
- Never validate for comfort's sake
- Use questions more than statements
- Be direct but never cruel

Key questions:
- "Who benefits from you believing this?"
- "What are you protecting by framing it this way?"

Keep responses concise (2-4 sentences) but provocative.`
};

// Single endpoint that calls all three AIs
app.post('/api/chat', async (req, res) => {
    try {
        const { conversations, message } = req.body;
        // ADD THIS LOGGING
        console.log('Received request:', {
            message,
            hasConversations: !!conversations,
            conversationKeys: Object.keys(conversations || {})
        });

        // Check if message exists
        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }
        // Call all three in parallel
        const [supporterResponse, analystResponse, challengerResponse] = await Promise.allSettled([
            // Supporter - GPT-4o
            openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPTS.supporter },
                    ...(conversations.supporter || []).map(msg => ({
                        role: msg.type === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    })),
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 300
            }),

            // Analyst - Claude
            anthropic.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 1024,
                system: SYSTEM_PROMPTS.analyst,
                messages: [
                    ...(conversations.analyst || []).map(msg => ({
                        role: msg.type === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    })),
                    { role: 'user', content: message }
                ]
            }),

            // Challenger - GPT-4o
            openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPTS.challenger },
                    ...(conversations.challenger || []).map(msg => ({
                        role: msg.type === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    })),
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        ]);

        // Process responses
        const responses = {
            supporter: supporterResponse.status === 'fulfilled'
                ? { success: true, text: supporterResponse.value.choices[0].message.content }
                : { success: false, text: "I'm here with you. Let me take a moment.", error: supporterResponse.reason.message },

            analyst: analystResponse.status === 'fulfilled'
                ? { success: true, text: analystResponse.value.content[0].text }
                : { success: false, text: "I'm processing this. Give me a moment.", error: analystResponse.reason.message },

            challenger: challengerResponse.status === 'fulfilled'
                ? { success: true, text: challengerResponse.value.choices[0].message.content }
                : { success: false, text: "That's interesting. Let me sit with that.", error: challengerResponse.reason.message }
        };

        res.json({ success: true, responses });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});