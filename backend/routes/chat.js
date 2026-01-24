const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateAIResponse, analyzeIntent, fetchRelevantData } = require('../utils/aiHelpers');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Expense = require('../models/Expense');

/**
 * POST /api/chat
 * Send a message to the AI chatbot and get a response
 * @body {message: string} - User's question/message
 * @returns {response: string} - AI generated response
 */
router.post('/', auth, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ msg: 'Message requis' });
        }

        // Prevent very long messages (safety)
        if (message.length > 500) {
            return res.status(400).json({ msg: 'Message trop long (max 500 caractères)' });
        }

        // 1. Analyze user intent
        const intent = analyzeIntent(message);
        console.log(`[CHAT] Intent détecté: ${intent} pour user ${userId}`);

        // 2. Fetch relevant data based on intent
        const models = { Invoice, Product, Expense };
        const dataContext = await fetchRelevantData(intent, models, userId);

        // 3. Generate AI response with context
        const aiResponse = await generateAIResponse(message, dataContext);

        // 4. Send response back to frontend
        res.json({
            response: aiResponse,
            intent: intent // Optional: can be used for analytics
        });

    } catch (error) {
        console.error('[CHAT ERROR]:', error);
        res.status(500).json({
            msg: 'Erreur serveur lors du traitement de la requête',
            response: "❌ Désolé, une erreur s'est produite. Veuillez réessayer."
        });
    }
});

module.exports = router;
