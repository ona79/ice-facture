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
  // --- IDENTITÉ CLIENT ---
  customerName: { 
    type: String, 
    default: "Client Passager",
    trim: true 
  },
  customerPhone: { 
    type: String, 
    default: "",
    trim: true 
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
  // --- FINANCES (SYSTÈME DE DETTES) ---
  totalAmount: { 
    type: Number, 
    required: true 
  },
  // Montant réellement versé par le client
  amountPaid: { 
    type: Number, 
    default: 0 
  },
  // Montant restant à payer (Calculé automatiquement)
  remainingAmount: {
    type: Number,
    default: 0
  },
  // État de la facture
  status: { 
    type: String, 
    enum: ['Payé', 'Dette'], 
    default: 'Payé' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

/**
 * MIDDLEWARE DE CALCUL AUTOMATIQUE
 * Avant chaque sauvegarde (save), le serveur met à jour le reste à payer et le statut.
 */
InvoiceSchema.pre('save', function(next) {
  // On s'assure que les valeurs sont traitées comme des nombres
  const total = Number(this.totalAmount) || 0;
  const paid = Number(this.amountPaid) || 0;
  
  // Calcul automatique du montant restant
  this.remainingAmount = total - paid;
  
  // Sécurité : le reste à payer ne peut pas être négatif
  if (this.remainingAmount < 0) {
    this.remainingAmount = 0;
  }

  // Mise à jour automatique du statut selon le reste à payer
  if (this.remainingAmount > 0) {
    this.status = 'Dette';
  } else {
    this.status = 'Payé';
  }
  
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);