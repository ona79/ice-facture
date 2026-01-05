const router = require('express').Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// --- 1. VOIR LES PRODUITS ---
router.get('/', auth, async (req, res) => {
  try {
    // CORRECTION : On s'assure d'utiliser l'ID pour ne voir que ses propres produits
    const products = await Product.find({ userId: req.user.id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. AJOUTER UN PRODUIT ---
router.post('/', auth, async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    
    // Validation rapide
    if (!name || price === undefined) {
      return res.status(400).json({ msg: "Veuillez remplir tous les champs obligatoires" });
    }

    // CORRECTION : Attribution stricte de l'ID via req.user.id
    const newProduct = new Product({
      userId: req.user.id, 
      name,
      price: Number(price), // Force le format nombre
      stock: Number(stock) || 0
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("Erreur Backend Ajout:", err.message);
    res.status(500).json({ error: "Erreur lors de la création du produit" });
  }
});

// --- 3. SUPPRIMER UN PRODUIT ---
router.delete('/:id', auth, async (req, res) => {
  try {
    // CORRECTION : On vérifie que le produit appartient bien à l'utilisateur
    const product = await Product.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!product) {
      return res.status(404).json({ msg: "Produit non trouvé ou accès non autorisé" });
    }

    res.json({ msg: "Produit supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;