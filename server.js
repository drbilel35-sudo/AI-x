require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Your API keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('⚠️ WARNING: GEMINI_API_KEY is not set!');
}
if (!GOOGLE_TTS_API_KEY) {
    console.warn('⚠️ WARNING: GOOGLE_TTS_API_KEY is not set!');
}

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const TTS_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`;

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Gemini proxy is running',
        apiKeySet: !!GEMINI_API_KEY,
        ttsKeySet: !!GOOGLE_TTS_API_KEY
    });
});

// Main API endpoint - Gemini
app.post('/api/gemini', async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        res.status(response.status).json(data);

    } catch (error) {
        console.error('❌ Gemini error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Text-to-Speech endpoint - Google TTS
app.post('/api/tts', async (req, res) => {
    try {
        if (!GOOGLE_TTS_API_KEY) {
            return res.status(500).json({ error: 'TTS API key not configured' });
        }

        const { 
            text, 
            voiceName = 'en-US-Wavenet-F', 
            speakingRate = 0.9, 
            pitch = -2.0 
        } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const ttsPayload = {
            input: { text: text },
            voice: {
                languageCode: 'en-US',
                name: voiceName,
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: speakingRate,
                pitch: pitch,
                effectsProfileId: ['headphone-class-device'],
            },
        };

        const response = await fetch(TTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ttsPayload),
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('❌ TTS API error:', data);
            return res.status(response.status).json({ 
                error: data.error?.message || 'TTS failed' 
            });
        }

        res.json(data);

    } catch (error) {
        console.error('❌ TTS error:', error);
        res.status(500).json({ error: 'TTS error: ' + error.message });
    }
});

// Redirect root to index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api/gemini`);
    console.log(`📍 TTS: http://localhost:${PORT}/api/tts`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
});
