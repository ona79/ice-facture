const router = require('express').Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// --- 1. RÉCUPÉRER TOUTES LES FACTURES ---
router.get('/', auth, async (req, res) => {
  try {
    // Utilisation de ownerId pour le partage shop/employé
    const invoices = await Invoice.find({ userId: req.user.ownerId }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des factures" });
  }
});

router.get('/customers', auth, async (req, res) => {
  try {
    const ownerId = req.user.ownerId;
    // find() est plus fiable que aggregate() pour le casting automatique des IDs chez Mongoose
    const invoices = await Invoice.find({ userId: ownerId }).select('customerName customerPhone');

    const uniqueCustomers = {};
    invoices.forEach(inv => {
      const name = (inv.customerName || "").trim().toUpperCase();
      // On ignore le client par défaut
      if (name && name !== "CLIENT PASSAGER") {
        if (!uniqueCustomers[name]) {
          uniqueCustomers[name] = inv.customerPhone || "";
        }
      }
    });

    const result = Object.keys(uniqueCustomers).map(name => ({
      name,
      phone: uniqueCustomers[name]
    })).sort((a, b) => a.name.localeCompare(b.name));

    res.json(result);
  } catch (err) {
    console.error("Erreur clients:", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des clients" });
  }
});

// --- 2. CRÉER UNE NOUVELLE VENTE ---
router.post('/', auth, async (req, res) => {
  try {
    const { items, totalAmount, amountPaid, invoiceNumber, customerName, customerPhone } = req.body;

    const newInvoice = new Invoice({
      userId: req.user.ownerId,
      invoiceNumber: invoiceNumber,
      customerName: customerName || "Client Passager",
      customerPhone: customerPhone || "",
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

    // On cherche la facture appartenant à la boutique
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.ownerId });

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

    // 1. Restriction Rôle
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: "Seul le gérant peut annuler une vente." });
    }

    // 2. Vérification du mot de passe
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Mot de passe incorrect" });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.ownerId });
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