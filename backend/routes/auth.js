const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- 1. INSCRIPTION (REGISTER) ---
router.post('/register', async (req, res) => {
  try {
    const { shopName, email, password, phone } = req.body;

    // Conversion de l'email en minuscules
    const cleanEmail = email.toLowerCase().trim();

    if (!phone || phone.length !== 9) {
      return res.status(400).json({ msg: "Le numéro de téléphone doit comporter exactement 9 chiffres." });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,8}$/;
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({ 
        msg: "Le mot de passe doit contenir des lettres et des chiffres (6 à 8 caractères)." 
      });
    }

    let userEmail = await User.findOne({ email: cleanEmail });
    if (userEmail) return res.status(400).json({ msg: "Cet email est déjà utilisé" });

    let userPhone = await User.findOne({ phone });
    if (userPhone) return res.status(400).json({ msg: "Ce numéro de téléphone est déjà utilisé" });

    const user = new User({ shopName, email: cleanEmail, password, phone });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Payload structuré pour correspondre au middleware
    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: { id: user._id, shopName: user.shopName, email: user.email, phone: user.phone }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Erreur serveur lors de l'inscription" });
  }
});

// --- 2. CONNEXION (LOGIN) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const cleanEmail = email.toLowerCase().trim();
    
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ msg: "Utilisateur non trouvé ou email incorrect" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Mot de passe incorrect" });

    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ 
      token, 
      user: { id: user._id, shopName: user.shopName } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. RÉCUPÉRATION DU PROFIL ---
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: "Session expirée ou utilisateur introuvable" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

// --- 4. MISE À JOUR DU PROFIL ---
router.put('/profile', auth, async (req, res) => {
  try {
    const { shopName, address, phone, footerMessage } = req.body;

    if (phone && phone.length !== 9) {
      return res.status(400).json({ msg: "Le numéro doit comporter exactement 9 chiffres." });
    }

    if (phone) {
        const existing = await User.findOne({ phone, _id: { $ne: req.user.id } });
        if (existing) return res.status(400).json({ msg: "Ce numéro est déjà utilisé" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { shopName, address, phone, footerMessage } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour" });
  }
});

// --- 5. MISE À JOUR DU MOT DE PASSE (SÉCURITÉ) ---
router.put('/update-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,8}$/;
    if (!newPassword || !passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        msg: "Le nouveau mot de passe doit contenir des lettres et des chiffres (6 à 8 caractères)." 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: "L'ancien mot de passe est incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    res.json({ msg: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    res.status(500).json({ msg: "Erreur lors de la modification du mot de passe" });
  }
});

// --- 6. VÉRIFICATION POUR DÉVERROUILLAGE (FIXED) ---
router.post('/verify-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ msg: "Mot de passe requis" });

    // On récupère l'utilisateur en base pour comparer les hashs
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      // On renvoie success true pour débloquer le frontend
      return res.json({ success: true, msg: "Accès autorisé" });
    } else {
      return res.status(401).json({ success: false, msg: "Mot de passe incorrect" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Erreur serveur" });
  }
});

module.exports = router;