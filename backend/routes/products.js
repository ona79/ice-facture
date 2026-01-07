const router = require('express').Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// --- 1. VOIR LES PRODUITS ---
router.get('/', auth, async (req, res) => {
  try {
    // CORRECTION : On utilise ownerId pour que les employés voient les produits de la boutique
    const products = await Product.find({ userId: req.user.ownerId });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. AJOUTER UN PRODUIT (UPSERT: SI EXISTE, ON AJOUTE AU STOCK) ---
router.post('/', auth, async (req, res) => {
  try {
    const { name, stock, barcode } = req.body;

    if (!name) {
      return res.status(400).json({ msg: "Le nom du produit est obligatoire" });
    }

    const cleanName = name.trim();
    const quantityToAdd = Number(stock) || 0;

    // Recherche insensible à la casse pour le même utilisateur propriétaire
    // On peut aussi chercher par code-barres si présent
    let query = { userId: req.user.ownerId, $or: [{ name: { $regex: new RegExp(`^${cleanName}$`, 'i') } }] };
    if (barcode) query.$or.push({ barcode });

    let product = await Product.findOne(query);

    if (product) {
      // SI LE PRODUIT EXISTE -> ON AUGMENTE LE STOCK
      product.stock += quantityToAdd;
      if (barcode) product.barcode = barcode; // Mise à jour du code-barres si nouveau
      await product.save();
      return res.status(200).json(product);
    } else {
      // SI NOUVEAU -> ON CRÉE
      const newProduct = new Product({
        userId: req.user.ownerId,
        name: cleanName,
        price: 0,
        stock: quantityToAdd,
        barcode: barcode || ""
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

    // 1. Vérification du rôle : Seul l'admin peut supprimer
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: "Action interdite : Seul le gérant peut supprimer un produit." });
    }

    // 2. Vérification du mot de passe
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Mot de passe incorrect" });
    }

    // Suppression
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.ownerId
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