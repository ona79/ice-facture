const router = require('express').Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// --- 1. RÉCUPÉRER TOUTES LES DÉPENSES ---
router.get('/', auth, async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user.ownerId }).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la récupération des dépenses" });
    }
});

// --- 2. AJOUTER UNE DÉPENSE ---
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: "Accès refusé. Seul le gérant peut enregistrer une charge." });
        }

        const { description, amount, category, date } = req.body;
        const newExpense = new Expense({
            userId: req.user.ownerId,
            description,
            amount,
            category,
            date: date || undefined
        });
        const savedExpense = await newExpense.save();
        res.status(201).json(savedExpense);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de l'ajout de la dépense" });
    }
});

// --- 3. SUPPRIMER UNE DÉPENSE ---
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: "Accès refusé. Seul le gérant peut supprimer une charge." });
        }
        const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.ownerId });
        if (!expense) return res.status(404).json({ msg: "Dépense introuvable" });
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ msg: "Dépense supprimée" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
