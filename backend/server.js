require('dotenv').config({ path: __dirname + '/.env' }); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- MIDDLEWARES (CONFIGURATION CORS RENFORCÉE) ---
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // PATCH et OPTIONS sont vitaux ici
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json()); 

// Log des requêtes pour faciliter le débogage sur Render (Très utile pour voir si PATCH arrive)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// --- DÉCLARATION DES ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/invoices', require('./routes/invoices'));

// --- CONNEXION MONGODB ---
const uri = process.env.MONGO_URI;

mongoose.set('strictQuery', false);

if (!uri) {
  console.error("❌ ERREUR : La variable MONGO_URI n'est pas définie dans l'environnement !");
  process.exit(1);
}

mongoose.connect(uri)
  .then(() => {
    console.log("✅ CONNEXION RÉUSSIE : Base de données liée.");
    
    // Correction Render : On écoute sur 0.0.0.0
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SERVEUR : Lancé sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ ERREUR CRITIQUE : Impossible de se connecter à MongoDB.");
    console.error("Détails :", err.message);
    process.exit(1); 
  });