const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  shopName: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    // Note : On ne met pas de maxlength ici car le mot de passe 
    // sera haché (bcrypt), ce qui génère une chaîne longue de 60 caractères.
  },
  address: { 
    type: String, 
    default: "" 
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true,   
    trim: true,
    // Sécurité au niveau de la base de données
    minlength: 9,
    maxlength: 9
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