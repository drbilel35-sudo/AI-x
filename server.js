const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Your Gemini API key - stored securely in environment variables
// For local development, create a .env file with: GEMINI_API_KEY=your_key_here
// For production, set this in your hosting platform's environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY is not set in environment variables!');
    console.warn('⚠️  Set it using: export GEMINI_API_KEY=your_key_here');
}

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Gemini proxy is running' });
});

// Main API endpoint
app.post('/api/gemini', async (req, res) => {
    try {
        // Check if API key is available
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ 
                error: 'Server configuration error: API key missing' 
            });
        }

        // Forward the request to Gemini API
        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        // Get the response data
        const data = await response.json();

        // Forward the status code and data back to the client
        res.status(response.status).json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error: ' + error.message 
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Gemini proxy server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 API endpoint: http://localhost:${PORT}/api/gemini`);
});
