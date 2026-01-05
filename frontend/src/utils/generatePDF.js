import { jsPDF } from "jspdf";
import axios from 'axios';
import autoTable from "jspdf-autotable"; 
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// --- FONCTION DE PARTAGE WHATSAPP ---
export const shareOnWhatsApp = (invoice, userData) => {
  const reste = invoice.totalAmount - (invoice.amountPaid || 0);
  const statusText = reste <= 0 ? "✅ PAYÉ" : `⚠️ DETTE (Reste: ${reste} F)`;
  
  const message = `*${userData.shopName.toUpperCase()}*%0A` +
    `--------------------------%0A` +
    `*FACTURE :* ${invoice.invoiceNumber}%0A` +
    `*DATE :* ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}%0A` +
    `*TOTAL :* ${invoice.totalAmount} FCFA%0A` +
    `*VERSEMENT :* ${invoice.amountPaid || 0} FCFA%0A` +
    `*STATUT :* ${statusText}%0A` +
    `--------------------------%0A` +
    `Merci de votre confiance !`;

  window.open(`https://wa.me/?text=${message}`, '_blank');
};

export const generatePDF = async (invoice) => {
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  
  const formatFCFA = (amount) => {
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
  };

  let userData = null;
  try {
    const res = await axios.get(`${API_URL}/api/auth/profile`, config);
    userData = res.data;

    if (!userData.address || !userData.phone) {
      toast.error("TÉLÉCHARGEMENT BLOQUÉ", {
        icon: '⚠️',
        style: { background: '#09090b', color: '#ff4b4b', border: '1px solid #ff4b4b', fontSize: '10px', fontWeight: '900' }
      });
      return;
    }
  } catch (err) { 
    toast.error("ERREUR DE VÉRIFICATION");
    return;
  }

  const doc = new jsPDF();

  // --- LOGIQUE DE NUMÉROTATION ---
  let finalInvoiceNumber = invoice.invoiceNumber;
  if (!finalInvoiceNumber.includes(new Date().getFullYear().toString())) {
    const d = new Date(invoice.createdAt || new Date());
    const datePart = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const rawNumber = finalInvoiceNumber.includes('-') ? finalInvoiceNumber.split('-')[1] : finalInvoiceNumber;
    const paddedSerial = rawNumber.replace(/\D/g, '').padStart(6, '0');
    finalInvoiceNumber = `FACT-${datePart}-${paddedSerial}`;
  }

  // --- EN-TÊTE ---
  doc.setTextColor(0, 0, 0); 
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(userData.shopName.toUpperCase(), 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Adresse: ${userData.address}`, 20, 35);
  doc.text(`Tel: ${userData.phone}`, 20, 42);

  doc.setFont("helvetica", "bold");
  doc.text(finalInvoiceNumber, 140, 35); 
  doc.setFont("helvetica", "normal");
  doc.text(`DATE : ${new Date(invoice.createdAt || new Date()).toLocaleDateString('fr-FR')}`, 140, 42);

  // --- TABLEAU ---
  const tableRows = invoice.items.map(item => [
    item.name,
    `${Math.round(item.price)} F`,
    item.quantity,
    formatFCFA(item.price * item.quantity)
  ]);

  autoTable(doc, {
    startY: 55,
    head: [["Produit", "Prix Unitaire", "Qté", "Total"]],
    body: tableRows,
    theme: 'plain',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] },
    bodyStyles: { textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right', fontStyle: 'bold' } }
  });

  // --- BLOC RÉCAPITULATIF (TOTAL & DETTES) ---
  const finalY = doc.lastAutoTable.finalY + 15;
  const reste = invoice.totalAmount - (invoice.amountPaid || 0);

  // Boîte récapitulative
  doc.setLineWidth(0.5);
  doc.rect(120, finalY - 8, 75, 28); 

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`TOTAL :`, 125, finalY);
  doc.text(formatFCFA(invoice.totalAmount), 190, finalY, { align: "right" });

  doc.text(`VERSÉ :`, 125, finalY + 8);
  doc.text(formatFCFA(invoice.amountPaid || 0), 190, finalY + 8, { align: "right" });

  // Reste à payer (en gras si dette)
  if (reste > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(200, 0, 0); // Texte rouge pour la dette
    doc.text(`RESTE À PAYER :`, 125, finalY + 16);
    doc.text(formatFCFA(reste), 190, finalY + 16, { align: "right" });
  } else {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 150, 0); // Vert pour payé
    doc.text(`STATUT :`, 125, finalY + 16);
    doc.text("PAYÉ", 190, finalY + 16, { align: "right" });
  }

  // --- PIED DE PAGE ---
  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(userData.footerMessage || "Merci de votre confiance !", 105, 285, { align: "center" });

  doc.save(`${finalInvoiceNumber}.pdf`);
};