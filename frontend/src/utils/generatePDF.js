import { jsPDF } from "jspdf";
import axios from 'axios';
import autoTable from "jspdf-autotable";
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : "https://ta-facture.onrender.com");

export const generatePDF = async (invoice) => {
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const formatF = (amount) => {
    return Math.round(amount).toLocaleString('fr-FR').replace(/\s/g, ' ') + " F";
  };

  let userData = { shopName: "Ma Boutique", address: "Adresse", phone: "770000000" };
  try {
    const res = await axios.get(`${API_URL}/api/auth/profile`, config);
    if (res.data) userData = res.data;
  } catch (err) {
    console.error("Erreur profil PDF", err);
  }

  // --- CONFIGURATION A5 PORTRAIT ---
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a5"
  });

  const width = doc.internal.pageSize.getWidth();

  // --- QR CODE (HAUT GAUCHE) ---
  try {
    const cleanPhone = userData.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
    const qrText = `https://wa.me/${formattedPhone}?text=Facture ${invoice.invoiceNumber}`;
    const qrDataUrl = await QRCode.toDataURL(qrText);
    doc.addImage(qrDataUrl, 'PNG', 5, 5, 18, 18);
  } catch (err) { console.error(err); }

  // --- EN-TÊTE CENTRÉ ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(userData.shopName.toUpperCase(), width / 2, 12, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(userData.address || "Adresse non définie", width / 2, 17, { align: "center" });
  doc.text(`Tél: ${userData.phone}`, width / 2, 21, { align: "center" });

  // --- CADRES INFOS (Style Bon de commande) ---
  const yInfo = 30;
  doc.setLineWidth(0.1);
  doc.setDrawColor(0);

  // Client
  doc.rect(5, yInfo, (width / 2) - 7, 12);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT :", 7, yInfo + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text((invoice.customerName || "Passager").toUpperCase(), 7, yInfo + 9);

  // Date / N°
  doc.rect((width / 2) + 2, yInfo, (width / 2) - 7, 12);
  doc.setFontSize(8);
  doc.text(`Date : ${new Date(invoice.createdAt).toLocaleDateString()}`, (width / 2) + 4, yInfo + 5);
  doc.setFont("helvetica", "bold");
  doc.text(`N° : ${invoice.invoiceNumber.split('-').pop()}`, (width / 2) + 4, yInfo + 10);

  // --- TABLEAU ---
  const tableRows = invoice.items.map(item => [
    item.quantity,
    item.name.toUpperCase(),
    formatF(item.price),
    formatF(item.price * item.quantity)
  ]);

  autoTable(doc, {
    startY: yInfo + 15,
    margin: { left: 5, right: 5 },
    head: [["Qté", "Désignation", "P.U", "Montant"]],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' }
    }
  });

  // --- RÉCAPITULATIF (Bas Droite) ---
  let finalY = doc.lastAutoTable.finalY + 5;
  const boxW = 60;
  const boxX = width - boxW - 5;

  doc.rect(boxX, finalY, boxW, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Total Facture:", boxX + 2, finalY + 5);
  doc.text(formatF(invoice.totalAmount), width - 7, finalY + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Avance:", boxX + 2, finalY + 10);
  doc.text(formatF(invoice.amountPaid || 0), width - 7, finalY + 10, { align: "right" });

  const reste = invoice.totalAmount - (invoice.amountPaid || 0);
  doc.setFont("helvetica", "bold");
  doc.text("Reste à Payer:", boxX + 2, finalY + 15);
  doc.text(formatF(reste), width - 7, finalY + 15, { align: "right" });

  // --- FOOTER ---
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Merci de votre confiance !", width / 2, 200, { align: "center" });

  // DATE ET HEURE D'IMPRESSION (Ajouté suite demande utilisateur)
  doc.setFontSize(6);
  doc.setTextColor(150); // Gris
  doc.text(`Imprimé le : ${new Date().toLocaleString()}`, width / 2, 204, { align: "center" });

  doc.save(`FACT_${invoice.invoiceNumber}.pdf`);
};
// --- FIN DE LA FONCTION GENERATEPDF ---