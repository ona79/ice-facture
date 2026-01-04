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

// --- 2. SAUVEGARDE DU PROFIL (Infos générales) ---
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

// --- 3. MISE À JOUR DU MOT DE PASSE (Nouvelle Route intégrée) ---
router.put('/update-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user);

    // Vérifier si l'ancien mot de passe est correct
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: "L'ancien mot de passe est incorrect" });

    // Hachage du nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    res.json({ msg: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    res.status(500).json({ msg: "Erreur lors de la modification du mot de passe" });
  }
});

// --- 4. VÉRIFICATION DU MOT DE PASSE (Pour suppressions sécurisées) ---
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

// --- 5. CONNEXION (LOGIN) ---
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