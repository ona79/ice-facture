const router = require('express').Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const User = require('../models/User'); 
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// --- RÉCUPÉRER TOUTES LES FACTURES ---
router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.id || req.user }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des factures" });
  }
});

// --- CRÉER UNE NOUVELLE VENTE (CORRIGÉ POUR LE NOM DU CLIENT) ---
router.post('/', auth, async (req, res) => {
  try {
    // AJOUT DE customerName DANS LA DÉSTRUCTURATION
    const { items, totalAmount, amountPaid, invoiceNumber, customerName } = req.body;

    const newInvoice = new Invoice({
      userId: req.user.id || req.user,
      invoiceNumber: invoiceNumber,
      customerName: customerName || "Client Passager", // SAUVEGARDE DU NOM
      items,
      totalAmount,
      amountPaid: amountPaid || 0,
    });

    const savedInvoice = await newInvoice.save();

    // Mise à jour du stock (Déduction)
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

// --- RÉGLER UNE DETTE (PATCH) ---
router.patch('/:id/pay', auth, async (req, res) => {
  try {
    const { amount } = req.body; 
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id || req.user });

    if (!invoice) {
      return res.status(404).json({ msg: "Facture introuvable" });
    }

    invoice.amountPaid += Number(amount);
    await invoice.save(); // Déclenche le recalcul du statut (Payé/Dette)

    res.json(invoice);
  } catch (err) {
    console.error("Erreur Règlement:", err);
    res.status(500).json({ msg: "Erreur lors du règlement sur le serveur" });
  }
});

// --- SUPPRIMER UNE VENTE (SÉCURISÉ) ---
router.delete('/:id', auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ msg: "Mot de passe requis" });
    }

    const user = await User.findById(req.user.id || req.user);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Mot de passe incorrect" });

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id || req.user });
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
    res.json({ msg: "Vente annulée et stock restauré" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;