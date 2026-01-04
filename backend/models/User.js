const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  footerMessage: { type: String, default: "Merci de votre confiance !" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);