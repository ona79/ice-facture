const router = require('express').Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const User = require('../models/User'); 
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// --- RÉCUPÉRER TOUTES LES FACTURES ---
router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des factures" });
  }
});

// --- CRÉER UNE NOUVELLE VENTE ---
router.post('/', auth, async (req, res) => {
  try {
    const { items, totalAmount, customerName } = req.body;

    const newInvoice = new Invoice({
      userId: req.user,
      items,
      totalAmount,
      customerName: customerName || "Client Comptant",
      invoiceNumber: `FAC-${Math.floor(100000 + Math.random() * 900000)}` 
    });

    const savedInvoice = await newInvoice.save();

    // Mise à jour du stock
    for (const item of items) {
      const idToUpdate = item.productId || item._id;
      if (idToUpdate) {
        await Product.findByIdAndUpdate(idToUpdate, {
          $inc: { stock: -Number(item.quantity) }
        });
      }
    }

    res.status(201).json(savedInvoice);
  } catch (err) {
    console.error("Erreur Vente:", err);
    res.status(500).json({ error: "Erreur serveur lors de la vente" });
  }
});

// --- SUPPRIMER UNE VENTE (SÉCURISÉ) ---
router.delete('/:id', auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ msg: "Mot de passe requis" });
    }

    // Vérification du mot de passe utilisateur
    const user = await User.findById(req.user);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Mot de passe incorrect" });

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user });
    if (!invoice) return res.status(404).json({ msg: "Facture introuvable" });

    // Restauration du stock
    for (const item of invoice.items) {
      const idToUpdate = item.productId || item._id;
      if (idToUpdate) {
        await Product.findByIdAndUpdate(idToUpdate, {
          $inc: { stock: Number(item.quantity) }
        });
      }
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ msg: "Vente annulée" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;