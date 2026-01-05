const router = require('express').Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const User = require('../models/User'); 
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// --- 1. RÉCUPÉRER TOUTES LES FACTURES ---
router.get('/', auth, async (req, res) => {
  try {
    // Utilisation stricte de req.user.id
    const invoices = await Invoice.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des factures" });
  }
});

// --- 2. CRÉER UNE NOUVELLE VENTE ---
router.post('/', auth, async (req, res) => {
  try {
    const { items, totalAmount, amountPaid, invoiceNumber, customerName } = req.body;

    const newInvoice = new Invoice({
      userId: req.user.id,
      invoiceNumber: invoiceNumber,
      customerName: customerName || "Client Passager",
      items,
      totalAmount,
      amountPaid: Number(amountPaid) || 0,
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

// --- 3. RÉGLER UNE DETTE (PATCH) - CORRIGÉ POUR LE RÈGLEMENT MALICK ---
router.patch('/:id/pay', auth, async (req, res) => {
  try {
    const { amount } = req.body; 
    
    // On cherche la facture appartenant à l'utilisateur
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });

    if (!invoice) {
      return res.status(404).json({ msg: "Facture introuvable" });
    }

    // On ajoute le nouveau montant payé au montant déjà existant
    invoice.amountPaid += Number(amount);

    // Sécurité : Si le montant payé dépasse le total, on peut le plafonner (optionnel)
    // if (invoice.amountPaid > invoice.totalAmount) invoice.amountPaid = invoice.totalAmount;

    await invoice.save(); 

    res.json(invoice);
  } catch (err) {
    console.error("Erreur Règlement:", err);
    res.status(500).json({ msg: "Erreur lors du règlement sur le serveur" });
  }
});

// --- 4. SUPPRIMER UNE VENTE (SÉCURISÉ PAR MOT DE PASSE) ---
router.delete('/:id', auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ msg: "Mot de passe requis pour annuler une vente" });
    }

    // Vérification du mot de passe de l'utilisateur
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ msg: "Mot de passe incorrect" });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
    if (!invoice) return res.status(404).json({ msg: "Facture introuvable" });

    // Restauration du stock avant suppression
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