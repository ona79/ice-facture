const router = require('express').Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// --- 1. VOIR LES PRODUITS ---
router.get('/', auth, async (req, res) => {
  try {
    // Récupère uniquement les produits appartenant à l'utilisateur connecté
    const products = await Product.find({ userId: req.user });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. AJOUTER UN PRODUIT (SANS MOT DE PASSE ADMIN) ---
router.post('/', auth, async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    
    // Création simple sans vérification de mot de passe supplémentaire
    const newProduct = new Product({
      userId: req.user,
      name,
      price: Number(price),
      stock: Number(stock) || 0
    });

    const savedProduct = await newProduct.save();
    res.json(savedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. SUPPRIMER UN PRODUIT (SANS MOT DE PASSE ADMIN) ---
router.delete('/:id', auth, async (req, res) => {
  try {
    // On vérifie que le produit appartient bien à l'utilisateur avant de supprimer
    const product = await Product.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user 
    });

    if (!product) {
      return res.status(404).json({ msg: "Produit non trouvé ou non autorisé" });
    }

    res.json({ msg: "Produit supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;