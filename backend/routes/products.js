const router = require('express').Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// VOIR LES PRODUITS
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AJOUTER UN PRODUIT
router.post('/', auth, async (req, res) => {
  try {
    const { name, price, stock } = req.body;
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

// SUPPRIMER UN PRODUIT
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user });
    if (!product) return res.status(404).json({ msg: "Produit non trouvé" });
    res.json({ msg: "Produit supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;