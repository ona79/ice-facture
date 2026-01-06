import { jsPDF } from "jspdf";
import axios from 'axios';
import autoTable from "jspdf-autotable";
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatF = (amount) => {
  return Math.round(amount).toLocaleString('fr-FR').replace(/\s/g, ' ') + " F";
};

// --- FONCTION DE DESSIN RÉUTILISABLE (Une Seule Facture) ---
const drawInvoice = async (doc, invoice, userData, yBase, typeLabel, qrDataUrl) => {
  const width = doc.internal.pageSize.getWidth();
  let currentY = yBase + 10;

  // --- QR CODE (HAUT GAUCHE) ---
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 10, yBase + 5, 18, 18);
  }

  // --- LABEL TYPE (ORIGINAL / COPIE) ---
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(7);
  doc.text(typeLabel, width - 10, yBase + 8, { align: "right" });

  // --- EN-TÊTE CENTRÉ ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(userData.shopName.toUpperCase(), width / 2, yBase + 12, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(userData.address || "Adresse non définie", width / 2, yBase + 17, { align: "center" });
  doc.text(`Tél: ${userData.phone}`, width / 2, yBase + 21, { align: "center" });

  // --- CADRES INFOS ---
  const yInfo = yBase + 28;
  doc.setLineWidth(0.1);
  doc.setDrawColor(0);

  // Client
  doc.rect(10, yInfo, (width / 2) - 12, 12);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT :", 12, yInfo + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text((invoice.customerName || "Passager").toUpperCase(), 12, yInfo + 9);

  // Date / N°
  doc.rect((width / 2) + 2, yInfo, (width / 2) - 12, 12);
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
    margin: { left: 10, right: 10 },
    head: [["Qté", "Désignation", "P.U", "Montant"]],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.1
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

  // --- RÉCAPITULATIF ---
  let finalY = doc.lastAutoTable.finalY + 3;
  const boxW = 55;
  const boxX = width - boxW - 10;

  doc.rect(boxX, finalY, boxW, 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Total Facture:", boxX + 2, finalY + 5);
  doc.text(formatF(invoice.totalAmount), width - 12, finalY + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Avance:", boxX + 2, finalY + 10);
  doc.text(formatF(invoice.amountPaid || 0), width - 12, finalY + 10, { align: "right" });

  const reste = invoice.totalAmount - (invoice.amountPaid || 0);
  doc.setFont("helvetica", "bold");
  doc.text("Reste à Payer:", boxX + 2, finalY + 15);
  doc.text(formatF(reste), width - 12, finalY + 15, { align: "right" });

  // --- FOOTER ---
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.text("Merci de votre fidélité !", width / 2, finalY + 22, { align: "center" });
};

export const generatePDF = async (invoice) => {
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  let userData = { shopName: "Ma Boutique", address: "Adresse", phone: "770000000" };
  try {
    const res = await axios.get(`${API_URL}/api/auth/profile`, config);
    if (res.data) userData = res.data;
  } catch (err) {
    console.error("Erreur profil PDF", err);
  }

  // --- CONFIGURATION A4 (Pour mettre 2 factures) ---
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4"
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Pré-génération du QR Code
  let qrDataUrl = null;
  try {
    const cleanPhone = userData.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
    const qrText = `https://wa.me/${formattedPhone}?text=Facture ${invoice.invoiceNumber}`;
    qrDataUrl = await QRCode.toDataURL(qrText);
  } catch (err) { console.error(err); }

  // --- DESSIN HAUT (ORIGINAL) ---
  await drawInvoice(doc, invoice, userData, 0, "ORIGINAL", qrDataUrl);

  // --- LIGNE DE DÉCOUPE ---
  doc.setLineDashPattern([2, 2], 0);
  doc.line(0, height / 2, width, height / 2);
  doc.setLineDashPattern([], 0);

  // --- DESSIN BAS (COPIE) ---
  await drawInvoice(doc, invoice, userData, height / 2, "COPIE BOUTIQUE", qrDataUrl);

  doc.save(`FACT_${invoice.invoiceNumber}.pdf`);
};
// --- FIN DE LA FONCTION GENERATEPDF ---