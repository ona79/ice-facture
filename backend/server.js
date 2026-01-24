require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

// --- 0. CORS (EN PREMIER POUR TOUT AUTORISER) ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// --- 1. SÉCURITÉ DES HEADERS HTTP (HELMET) ---
app.use(helmet());

// --- 2. PROTECTION CONTRE LES INJECTIONS NOSQL ---
app.use(mongoSanitize());

// --- 3. CONFIGURATION DES LIMITES DE REQUÊTES (RATE LIMITING) ---
// Limiteur général (prévenir les abus globaux)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: { msg: "Trop de requêtes, veuillez réessayer plus tard." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiteur strict pour l'authentification (prévenir le brute-force)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // Max 10 tentatives de connexion/inscription par heure par IP
  message: { msg: "Trop de tentatives de connexion, compte bloqué temporairement (1h)." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// --- MIDDLEWARES DE BASE ---

app.use(express.json({ limit: '10kb' })); // Protection contre les payloads trop lourd
// Log des requêtes pour faciliter le débogage sur Render (Très utile pour voir si PATCH arrive)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// --- DÉCLARATION DES ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/chat', require('./routes/chat'));

// --- CONNEXION MONGODB ---
const uri = process.env.MONGO_URI;

mongoose.set('strictQuery', false);

// --- FONCTION DE DÉMARRAGE ---
const startServer = async () => {
  try {
    if (!uri) {
      throw new Error("MONGO_URI is not defined");
    }
    await mongoose.connect(uri);
    console.log("✅ CONNEXION RÉUSSIE : Base de données liée.");

    // Correction Render : On écoute sur 0.0.0.0
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SERVEUR : Lancé sur le port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ ERREUR CRITIQUE : Impossible de se connecter à MongoDB.");
    console.error("Détails :", err.message);
    process.exit(1);
  }
};

// Démarrer uniquement si le fichier est exécuté directement
if (require.main === module) {
  startServer();
}

module.exports = app;