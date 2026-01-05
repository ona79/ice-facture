const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- 1. INSCRIPTION (REGISTER) ---
router.post('/register', async (req, res) => {
  try {
    const { shopName, email, password, phone } = req.body;

    // --- SÉCURITÉ : TÉLÉPHONE STRICTEMENT ÉGAL À 9 CHIFFRES ---
    if (!phone || phone.length !== 9) {
      return res.status(400).json({ msg: "Le numéro de téléphone doit comporter exactement 9 chiffres." });
    }

    // --- SÉCURITÉ : MOT DE PASSE (Lettres + Chiffres, 6-8 caractères) ---
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,8}$/;
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({ 
        msg: "Le mot de passe doit contenir des lettres et des chiffres (6 à 8 caractères)." 
      });
    }

    // Vérifier si l'email existe déjà
    let userEmail = await User.findOne({ email });
    if (userEmail) return res.status(400).json({ msg: "Cet email est déjà utilisé" });

    // Vérifier si le numéro de téléphone existe déjà
    let userPhone = await User.findOne({ phone });
    if (userPhone) return res.status(400).json({ msg: "Ce numéro de téléphone est déjà utilisé" });

    // Créer le nouvel utilisateur
    const user = new User({ shopName, email, password, phone });

    // Hachage du mot de passe
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Génération du token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

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
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
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
    const user = await User.findById(req.user).select('-password');
    if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

// --- 4. MISE À JOUR DU PROFIL ---
router.put('/profile', auth, async (req, res) => {
  try {
    const { shopName, address, phone, footerMessage } = req.body;

    // --- SÉCURITÉ : TÉLÉPHONE (STRICTEMENT 9 CHIFFRES) ---
    if (phone && phone.length !== 9) {
      return res.status(400).json({ msg: "Le numéro doit comporter exactement 9 chiffres." });
    }

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

// --- 5. MISE À JOUR DU MOT DE PASSE ---
router.put('/update-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // --- SÉCURITÉ : NOUVEAU MOT DE PASSE (Lettres + Chiffres, 6-8 caractères) ---
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,8}$/;
    if (!newPassword || !passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        msg: "Le nouveau mot de passe doit contenir des lettres et des chiffres (6 à 8 caractères)." 
      });
    }

    const user = await User.findById(req.user);
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

// --- 6. VÉRIFICATION DU MOT DE PASSE ---
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

module.exports = router;