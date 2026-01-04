require('dotenv').config({ path: __dirname + '/.env' }); // Garantit la lecture du .env dans le dossier backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- MIDDLEWARES ---
app.use(cors()); // Autorise ton frontend à communiquer avec ce backend
app.use(express.json()); // Indispensable pour recevoir les données JSON des formulaires

// Log des requêtes pour faciliter le débogage sur Render
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

// Configuration Mongoose
mongoose.set('strictQuery', false);

if (!uri) {
  console.error("❌ ERREUR : La variable MONGO_URI n'est pas définie dans l'environnement !");
  process.exit(1);
}

mongoose.connect(uri)
  .then(() => {
    console.log("✅ CONNEXION RÉUSSIE : Base de données liée.");
    // Render définit automatiquement le PORT, sinon on utilise 5000 par défaut
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 SERVEUR : Lancé sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ ERREUR CRITIQUE : Impossible de se connecter à MongoDB.");
    console.error("Détails :", err.message);
    process.exit(1); 
  });