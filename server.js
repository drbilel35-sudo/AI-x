require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (your HTML)
app.use(express.static('.'));

// Your Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY is not set!');
}

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Gemini proxy is running',
        apiKeySet: !!GEMINI_API_KEY,
        serveStatic: true
    });
});

// Main API endpoint
app.post('/api/gemini', async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ 
                error: 'API key not configured on server' 
            });
        }

        console.log('📨 Received message:', req.body.contents?.[0]?.parts?.[0]?.text || 'Empty');

        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        res.status(response.status).json(data);

    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error: ' + error.message 
        });
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
    console.log(`📍 Health: http://localhost:${PORT}/health`);
});
