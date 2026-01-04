const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  // Propriétaire de la facture
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Numéro de facture (ex: FAC-164130)
  invoiceNumber: { 
    type: String, 
    required: true 
  },
  // Liste des produits vendus
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 }
    }
  ],
  // Somme totale
  totalAmount: { 
    type: Number, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);