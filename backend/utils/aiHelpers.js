const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * List of Gemini models to try in order (fallback system)
 * Each model has different capabilities and token limits
 */
const GEMINI_MODELS = [
    {
        name: 'gemini-1.5-flash',
        maxTokens: 8000,
        description: 'Rapide et efficace'
    },
    {
        name: 'gemini-1.5-flash-8b',
        maxTokens: 4000,
        description: 'Ultra-rapide, contexte réduit'
    },
    {
        name: 'gemini-1.5-pro',
        maxTokens: 30000,
        description: 'Puissant, contexte large'
    },
    {
        name: 'gemini-2.0-flash-exp',
        maxTokens: 8000,
        description: 'Version expérimentale'
    }
];

/**
 * Truncate data context to fit within token limits
 * @param {object} dataContext - Full data context
 * @param {number} maxTokens - Maximum allowed tokens
 * @returns {string} - Truncated JSON string
 */
function truncateContext(dataContext, maxTokens) {
    let contextStr = JSON.stringify(dataContext, null, 2);
    const estimatedTokens = contextStr.length / 4; // Rough estimate: 1 token ≈ 4 chars

    if (estimatedTokens <= maxTokens * 0.6) { // Use 60% of max for safety
        return contextStr;
    }

    // Truncate arrays in the context
    const truncated = JSON.parse(JSON.stringify(dataContext));

    if (truncated.invoices && truncated.invoices.length > 5) {
        truncated.invoices = truncated.invoices.slice(0, 5);
        truncated._note = "Données limitées pour économiser l'espace";
    }
    if (truncated.products && truncated.products.length > 10) {
        truncated.products = truncated.products.slice(0, 10);
    }
    if (truncated.expenses && truncated.expenses.length > 5) {
        truncated.expenses = truncated.expenses.slice(0, 5);
    }

    contextStr = JSON.stringify(truncated, null, 2);

    // If still too long, use summary only
    if (contextStr.length / 4 > maxTokens * 0.6) {
        return JSON.stringify({
            summary: "Contexte résumé pour économiser l'espace",
            invoiceStats: truncated.invoiceStats,
            productStats: truncated.productStats,
            expenseStats: truncated.expenseStats
        }, null, 2);
    }

    return contextStr;
}

/**
 * Analyze user query and generate response with data context
 * Uses multiple Gemini models with fallback mechanism
 * @param {string} userMessage - User's question
 * @param {object} dataContext - Data from MongoDB (invoices, products, etc.)
 * @returns {Promise<string>} - AI generated response
 */
async function generateAIResponse(userMessage, dataContext) {
    let lastError = null;

    // Try each model in sequence until one works
    for (const modelConfig of GEMINI_MODELS) {
        try {
            console.log(`[AI] Tentative avec ${modelConfig.name}...`);

            const model = genAI.getGenerativeModel({ model: modelConfig.name });

            // Truncate context based on model's token limit
            const contextStr = truncateContext(dataContext, modelConfig.maxTokens);

            // Build context prompt with data
            const systemPrompt = `Tu es un assistant IA pour une application de facturation appelée "Ice Facture". 
Tu aides l'utilisateur à comprendre ses données commerciales et à prendre des décisions.

CONTEXTE DES DONNÉES:
${contextStr}

INSTRUCTIONS:
- Réponds en français uniquement
- Sois concis et précis (max 150 mots)
- Utilise les données fournies pour répondre
- Si les données sont vides, mentionne gentiment qu'il n'y a pas encore de données
- Utilise des émojis pour rendre les réponses plus engageantes 
- Formate les montants avec "F" (francs) et utilise des séparateurs de milliers
- Sois professionnel mais amical

Question de l'utilisateur: ${userMessage}

Réponds de manière claire et utile basée sur les données fournies.`;

            const result = await model.generateContent(systemPrompt);
            const response = await result.response;
            const text = response.text();

            console.log(`[AI] ✅ Succès avec ${modelConfig.name}`);
            return text;

        } catch (error) {
            console.error(`[AI] ❌ Échec avec ${modelConfig.name}:`, error.message);
            lastError = error;

            // If API key error, don't try other models
            if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
                return "❌ Erreur: Clé API Gemini invalide ou manquante. Vérifiez votre configuration.";
            }

            // Continue to next model
            continue;
        }
    }

    // All models failed
    console.error('[AI] ❌ Tous les modèles ont échoué');

    if (lastError?.message?.includes('quota') || lastError?.message?.includes('RESOURCE_EXHAUSTED')) {
        return "⚠️ Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.";
    }

    return "❌ Désolé, le service IA est temporairement indisponible. Veuillez réessayer.";
}

/**
 * Analyze user intent to determine what data to fetch
 * @param {string} message - User's message
 * @returns {string} - Intent type: 'invoices', 'products', 'expenses', 'stats', 'general'
 */
function analyzeIntent(message) {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.match(/facture|vente|client|dette|payé|impayé/)) {
        return 'invoices';
    }
    if (lowerMsg.match(/produit|stock|prix|article/)) {
        return 'products';
    }
    if (lowerMsg.match(/dépense|charge|coût|loyer|électricité/)) {
        return 'expenses';
    }
    if (lowerMsg.match(/chiffre|statistique|total|combien|résumé|bilan/)) {
        return 'stats';
    }

    return 'general';
}

/**
 * Fetch relevant data from MongoDB based on intent
 * @param {string} intent - Type of data needed
 * @param {object} models - MongoDB models (Invoice, Product, Expense)
 * @param {string} userId - Current user ID
 * @returns {Promise<object>} - Relevant data object
 */
async function fetchRelevantData(intent, models, userId) {
    const { Invoice, Product, Expense } = models;
    const data = {};

    try {
        switch (intent) {
            case 'invoices':
                data.invoices = await Invoice.find({ userId }).sort({ createdAt: -1 }).limit(10);
                data.totalInvoices = await Invoice.countDocuments({ userId });
                data.totalRevenue = data.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                data.totalDebt = data.invoices
                    .filter(inv => inv.status === 'Dette')
                    .reduce((sum, inv) => sum + inv.remainingAmount, 0);
                break;

            case 'products':
                data.products = await Product.find({ userId }).sort({ createdAt: -1 });
                data.totalProducts = data.products.length;
                data.outOfStock = data.products.filter(p => p.stock <= 0);
                break;

            case 'expenses':
                data.expenses = await Expense.find({ userId }).sort({ createdAt: -1 }).limit(10);
                data.totalExpenses = data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                break;

            case 'stats':
                // Fetch comprehensive stats
                const invoices = await Invoice.find({ userId });
                const products = await Product.find({ userId });
                const expenses = await Expense.find({ userId });

                data.invoiceStats = {
                    total: invoices.length,
                    revenue: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
                    paid: invoices.filter(inv => inv.status === 'Payé').length,
                    debt: invoices.filter(inv => inv.status === 'Dette').length,
                    totalDebt: invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0)
                };

                data.productStats = {
                    total: products.length,
                    outOfStock: products.filter(p => p.stock <= 0).length,
                    averagePrice: products.length > 0
                        ? products.reduce((sum, p) => sum + p.price, 0) / products.length
                        : 0
                };

                data.expenseStats = {
                    total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
                    count: expenses.length
                };

                data.profit = data.invoiceStats.revenue - data.expenseStats.total;
                break;

            case 'general':
                // Light summary data
                data.summary = {
                    invoiceCount: await Invoice.countDocuments({ userId }),
                    productCount: await Product.countDocuments({ userId }),
                    expenseCount: await Expense.countDocuments({ userId })
                };
                break;
        }

        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return {};
    }
}

module.exports = {
    generateAIResponse,
    analyzeIntent,
    fetchRelevantData
};
