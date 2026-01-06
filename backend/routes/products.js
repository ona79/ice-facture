const router = require('express').Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

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

// --- 2. AJOUTER UN PRODUIT (UPSERT: SI EXISTE, ON AJOUTE AU STOCK) ---
router.post('/', auth, async (req, res) => {
  try {
    const { name, stock } = req.body; // Prix retiré ou ignoré

    if (!name) {
      return res.status(400).json({ msg: "Le nom du produit est obligatoire" });
    }

    const cleanName = name.trim();
    const quantityToAdd = Number(stock) || 0;

    // Recherche insensible à la casse pour le même utilisateur
    let product = await Product.findOne({
      userId: req.user.id,
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') }
    });

    if (product) {
      // SI LE PRODUIT EXISTE -> ON AUGMENTE LE STOCK
      product.stock += quantityToAdd;
      await product.save();
      return res.status(200).json(product);
    } else {
      // SI NOUVEAU -> ON CRÉE
      const newProduct = new Product({
        userId: req.user.id,
        name: cleanName,
        price: 0, // Prix par défaut à 0 car variable
        stock: quantityToAdd
      });
      const savedProduct = await newProduct.save();
      return res.status(201).json(savedProduct);
    }

  } catch (err) {
    console.error("Erreur Backend Ajout:", err.message);
    res.status(500).json({ error: "Erreur lors de l'ajout du produit" });
  }
});

// --- 3. SUPPRIMER UN PRODUIT ---
// --- 3. SUPPRIMER UN PRODUIT (SÉCURISÉ) ---
router.delete('/:id', auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ msg: "Mot de passe requis" });
    }

    // Vérification du mot de passe
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Mot de passe incorrect" });
    }

    // Suppression
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!product) {
      return res.status(404).json({ msg: "Produit introuvable" });
    }

    res.json({ msg: "Produit supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;