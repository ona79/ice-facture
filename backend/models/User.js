const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  shopName: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true // Force l'email en minuscules pour éviter les doublons
  },
  password: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String, 
    default: "" 
  },
  // --- MODIFICATION ICI ---
  phone: { 
    type: String, 
    required: true, // Requis pour l'inscription
    unique: true,   // Empêche deux boutiques d'avoir le même numéro
    trim: true      // Enlève les espaces inutiles
  },
  footerMessage: { 
    type: String, 
    default: "Merci de votre confiance !" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', UserSchema);