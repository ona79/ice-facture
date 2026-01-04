require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- MIDDLEWARES ---
// Assurez-vous que CORS est configuré avant les routes
app.use(cors());
// Permet de lire le corps des requêtes JSON (indispensable pour les ventes)
app.use(express.json());

// Log de chaque requête pour déboguer les 404 (Optionnel mais recommandé)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// --- DÉCLARATION DES ROUTES ---
// Vérifiez que les fichiers existent bien dans ./routes/
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/invoices', require('./routes/invoices'));

// --- CONNEXION MONGODB ---
const uri = process.env.MONGO_URI;

// Optionnel : Désactive le mode strict pour éviter certains avertissements de Mongoose
mongoose.set('strictQuery', false);

mongoose.connect(uri)
  .then(() => {
    console.log("✅ CONNEXION RÉUSSIE : Base de données liée.");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 SERVEUR : Lancé sur le port ${PORT}`);
      console.log(`📡 URL API : http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error("❌ ERREUR CRITIQUE : Impossible de se connecter à MongoDB.");
    console.error("Détails :", err.message);
    process.exit(1); 
  });