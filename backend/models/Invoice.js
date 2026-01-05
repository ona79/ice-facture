const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  // Propriétaire de la facture (Lien avec l'utilisateur connecté)
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Numéro de facture généré (ex: FACT-20260105-1234)
  invoiceNumber: { 
    type: String, 
    required: true 
  },
  // --- NOUVEAU : NOM DU CLIENT ---
  customerName: { 
    type: String, 
    default: "Client Passager",
    trim: true 
  },
  // --- NOUVEAU : NUMÉRO WHATSAPP DU CLIENT ---
  customerPhone: { 
    type: String, 
    default: "",
    trim: true 
  },
  // Liste des produits vendus (Détails pour le PDF et les stats)
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 }
    }
  ],
  // Somme totale brute de la vente
  totalAmount: { 
    type: Number, 
    required: true 
  },
  
  // --- SYSTÈME DE GESTION DES DETTES ---
  
  // Montant que le client a réellement donné à la caisse
  amountPaid: { 
    type: Number, 
    default: 0 
  },
  // État de la facture calculé dynamiquement
  status: { 
    type: String, 
    enum: ['Payé', 'Dette'], 
    default: 'Payé' 
  },
  
  // ------------------------------------

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

/**
 * MIDDLEWARE DE SÉCURITÉ "FIDÈLE"
 * Avant chaque sauvegarde (save), le serveur compare le total et le versé.
 */
InvoiceSchema.pre('save', function(next) {
  // Sécurité supplémentaire : si amountPaid n'est pas défini, on le met à 0
  const paid = this.amountPaid || 0;
  
  if (paid < this.totalAmount) {
    this.status = 'Dette';
  } else {
    this.status = 'Payé';
  }
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
//backend/models/Invoice.js