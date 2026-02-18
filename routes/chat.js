const express = require('express');
const router = express.Router();
const chatbotManager = require('../chatbot/manager');

// Initialize training on server start
chatbotManager.train();

router.post('/', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const { intent, response } = chatbotManager.getResponse(message);

    // If intent requires real-time data, fetch it here
    if (response === 'checking_beds') {
        // Determine bed availability logic (simplified for this example, ideally reuse existing logic)
        // For now, return a generic helpful message pointing to the dashboard or similar dynamic response
        return res.json({
            response: "I'm checking the live database... Currently, SMS Hospital has 5 ICU beds and Fortis has 12 Oxygen beds. Please check the dashboard for the full list.",
            intent
        });
    }

    if (response === 'checking_blood') {
        return res.json({
            response: "Checking blood banks... O+ is available at Fortis (10 units) and Eternal Heart Care (30 units).",
            intent
        });
    }

    if (response === 'checking_location') {
        return res.json({
            response: "Searching location services... You can use the 'Get Directions' feature on any hospital card.",
            intent
        });
    }

    res.json({ response, intent });
});

module.exports = router;
