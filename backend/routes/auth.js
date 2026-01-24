const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validate, registerSchema, loginSchema } = require('../middleware/validate');

// --- 1. INSCRIPTION (REGISTER) ---
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { shopName, email, password, phone } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // Note: La validation du format (Gmail, téléphone, password) est désormais gérée par Zod via le middleware validate.

    let userEmail = await User.findOne({ email: cleanEmail });
    if (userEmail) return res.status(400).json({ msg: "Cet email est déjà utilisé" });


    let userPhone = await User.findOne({ phone });
    if (userPhone) return res.status(400).json({ msg: "Ce numéro de téléphone est déjà utilisé" });

    const user = new User({ shopName, email: cleanEmail, password, phone });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Payload structuré pour correspondre au middleware
    const payload = {
      user: {
        id: user._id,
        role: user.role,
        parentId: user.parentId
      }
    };
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
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ msg: "Utilisateur non trouvé ou email incorrect" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Mot de passe incorrect" });

    const payload = {
      user: {
        id: user._id,
        role: user.role,
        parentId: user.parentId
      }
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: { id: user._id, shopName: user.shopName, role: user.role }
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
    const { shopName, address, phone, footerMessage, email } = req.body;

    // Validation email si fourni
    if (email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!emailRegex.test(email.toLowerCase())) {
        return res.status(400).json({ msg: "Seuls les comptes Gmail (@gmail.com) sont autorisés." });
      }
      const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user.id } });
      if (existingEmail) return res.status(400).json({ msg: "Cet email est déjà utilisé" });
    }

    // Validation téléphone : entre 7 et 10 chiffres (validation stricte sur le frontend)
    if (phone && (phone.length < 7 || phone.length > 10)) {
      return res.status(400).json({ msg: "Format de téléphone incorrect." });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: req.user.id } });
      if (existingPhone) return res.status(400).json({ msg: "Ce numéro est déjà utilisé" });
    }

    const updateFields = { shopName, address, phone, footerMessage };
    if (email) updateFields.email = email.toLowerCase().trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
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

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!newPassword || !passwordRegex.test(newPassword)) {
      return res.status(400).json({
        msg: "Le nouveau mot de passe doit contenir des lettres et des chiffres (au moins 6 caractères)."
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

// --- 5. CRÉATION DE COMPTE EMPLOYÉ (ADMIN SEUL) ---
router.post('/create-employee', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (admin.role !== 'admin') {
      return res.status(403).json({ msg: "Accès refusé. Seul l'administrateur peut créer des comptes employés." });
    }

    const { email, password, phone } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    let existing = await User.findOne({
      $or: [{ email: cleanEmail }, { phone }]
    });

    if (existing) {
      return res.status(400).json({ msg: "Email ou téléphone déjà utilisé." });
    }

    const employee = new User({
      shopName: admin.shopName,
      email: cleanEmail,
      password,
      phone,
      role: 'employee',
      parentId: admin._id,
      address: admin.address,
      footerMessage: admin.footerMessage
    });

    const salt = await bcrypt.genSalt(10);
    employee.password = await bcrypt.hash(password, salt);

    await employee.save();
    res.status(201).json({ msg: "Compte employé créé avec succès", employee: { email: employee.email, role: employee.role } });
  } catch (err) {
    res.status(500).json({ msg: "Erreur lors de la création de l'employé" });
  }
});

// --- 6. LISTER LES EMPLOYÉS (ADMIN SEUL) ---
router.get('/employees', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ msg: "Accès refusé." });
    }

    const employees = await User.find({ parentId: admin._id }).select('-password');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ msg: "Erreur lors de la récupération des employés" });
  }
});

// --- 7. SUPPRIMER UN EMPLOYÉ (ADMIN SEUL) ---
// --- 7. SUPPRIMER UN EMPLOYÉ (ADMIN SEUL) ---
router.delete('/employees/:id', auth, async (req, res) => {
  try {
    const adminId = req.user.id;
    const employeeId = req.params.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ msg: "Mot de passe requis pour supprimer un employé." });
    }

    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ msg: "Admin introuvable." });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Mot de passe incorrect" });
    }

    // On vérifie que l'employé appartient bien à cet admin
    const employee = await User.findOne({ _id: employeeId, parentId: adminId });
    if (!employee) {
      return res.status(404).json({ msg: "Employé introuvable ou vous n'avez pas les droits." });
    }

    await User.findByIdAndDelete(employeeId);
    res.json({ msg: "Employé supprimé avec succès." });
  } catch (err) {
    res.status(500).json({ msg: "Erreur lors de la suppression de l'employé" });
  }
});

// --- 8. VÉRIFICATION POUR DÉVERROUILLAGE (FIXED) ---
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

// --- 7. MOT DE PASSE OUBLIÉ (GÉNÉRATION TOKEN) ---
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ msg: "Aucun compte associé à cet email." });
    }

    // Génération du token
    const token = crypto.randomBytes(20).toString('hex');

    // Sauvegarde du token (expirations dans 1 heure)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    // Simulation d'envoi d'email
    console.log("-----------------------------------------");
    console.log("LIEN DE RÉINITIALISATION (SIMULATION) :");
    console.log(`http://localhost:5173/reset-password/${token}`);
    console.log("-----------------------------------------");

    res.json({ msg: "Un lien de réinitialisation a été généré (voir console serveur)." });
  } catch (err) {
    res.status(500).json({ msg: "Erreur lors de la génération du token." });
  }
});

// --- 8. RÉINITIALISATION DU MOT DE PASSE (UTILISATION TOKEN) ---
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: "Lien invalide ou expiré." });
    }

    // Regex de validation mot de passe
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ msg: "Le mot de passe doit contenir au moins 6 caractères, une lettre et un chiffre." });
    }

    // Hachage du nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Nettoyage du token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ msg: "Mot de passe réinitialisé avec succès !" });
  } catch (err) {
    res.status(500).json({ msg: "Erreur lors de la réinitialisation." });
  }
});

// --- 9. SUPPRESSION DU COMPTE (SÉCURITÉ MAXIMALE) ---
router.delete('/profile', auth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ msg: "Mot de passe requis pour supprimer le compte." });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Mot de passe incorrect. Suppression annulée." });

    // Suppression en cascade (Produits, Factures, et l'Utilisateur)
    const Product = require('../models/Product');
    const Invoice = require('../models/Invoice');

    await Product.deleteMany({ userId: req.user.id });
    await Invoice.deleteMany({ userId: req.user.id });
    await User.findByIdAndDelete(req.user.id);

    res.json({ msg: "Compte et toutes les données associées supprimés avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur lors de la suppression du compte." });
  }
});

module.exports = router;