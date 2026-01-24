const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze user query and generate response with data context
 * @param {string} userMessage - User's question
 * @param {object} dataContext - Data from MongoDB (invoices, products, etc.)
 * @returns {Promise<string>} - AI generated response
 */
async function generateAIResponse(userMessage, dataContext) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Build context prompt with data
        const systemPrompt = `Tu es un assistant IA pour une application de facturation appelée "Ice Facture". 
Tu aides l'utilisateur à comprendre ses données commerciales et à prendre des décisions.

CONTEXTE DES DONNÉES:
${JSON.stringify(dataContext, null, 2)}

INSTRUCTIONS:
- Réponds en français uniquement
- Sois concis et précis
- Utilise les données fournies pour répondre
- Si les données sont vides, mentionne gentiment qu'il n'y a pas encore de données
- Utilise des émojis pour rendre les réponses plus engageantes 
- Formate les montants avec "F" (francs) et utilise des séparateurs de milliers
- Sois professionnel mais amical

Question de l'utilisateur: ${userMessage}

Réponds de manière claire et utile basée sur les données fournies.`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini API Error:', error);

        // Handle specific error cases
        if (error.message?.includes('API_KEY')) {
            return "❌ Erreur: Clé API Gemini invalide ou manquante.";
        }
        if (error.message?.includes('quota')) {
            return "⚠️ Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.";
        }

        return "❌ Désolé, une erreur s'est produite. Veuillez réessayer.";
    }
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
