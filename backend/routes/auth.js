const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- 1. RÉCUPÉRATION DU PROFIL ---
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

// --- 2. SAUVEGARDE DU PROFIL ---
router.put('/profile', auth, async (req, res) => {
  try {
    const { shopName, address, phone, footerMessage } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user,
      { $set: { shopName, address, phone, footerMessage } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour" });
  }
});

// --- 3. VÉRIFICATION DU MOT DE PASSE (C'est la route qui te manque !) ---
router.post('/verify-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ msg: "Mot de passe requis" });

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, msg: "Mot de passe incorrect" });
    }
  } catch (err) {
    res.status(500).json({ success: false, msg: "Erreur serveur" });
  }
});

// --- 4. CONNEXION (LOGIN) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, shopName: user.shopName } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;