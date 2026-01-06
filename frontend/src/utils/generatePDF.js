import { jsPDF } from "jspdf";
import axios from 'axios';
import autoTable from "jspdf-autotable";
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
    console.error("Erreur chargement profil pour PDF", err);
  }

  // --- CONFIGURATION TICKET (80mm) ---
  // Hauteur dynamique estimée (200mm de base + marge par article)
  const estimatedHeight = 150 + (invoice.items.length * 10);

  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: [80, estimatedHeight] // Format Ticket 80mm
  });

  const width = 80; // Largeur papier
  const margin = 4; // Marge gauche/droite
  const contentWidth = width - (margin * 2);
  let yPos = 5; // Position verticale curseur

  // --- 1. EN-TÊTE ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(userData.shopName.toUpperCase(), width / 2, yPos, { align: "center" });

  yPos += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(userData.address || "Conakry", width / 2, yPos, { align: "center" });
  yPos += 4;
  doc.text(`Tel: ${userData.phone}`, width / 2, yPos, { align: "center" });
  yPos += 6;

  // Ligne séparation
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, width - margin, yPos);
  yPos += 5;

  // --- 2. INFOS TICKET ---
  doc.setFontSize(8);
  doc.text(`DATE : ${new Date(invoice.createdAt || new Date()).toLocaleDateString('fr-FR')}`, margin, yPos);
  yPos += 4;
  doc.text(`HEURE : ${new Date(invoice.createdAt || new Date()).toLocaleTimeString('fr-FR').slice(0, 5)}`, margin, yPos);
  yPos += 4;
  doc.setFont("helvetica", "bold");
  doc.text(`N°: ${invoice.invoiceNumber.split('-').pop()}`, margin, yPos);

  // Client (à droite ou dessous)
  doc.setFont("helvetica", "normal");
  const clientName = (invoice.customerName || "Passager").toUpperCase();
  doc.text(clientName, width - margin, yPos, { align: "right" });

  yPos += 2;

  // --- 3. TABLEAU DES ARTICLES ---
  const tableRows = invoice.items.map(item => [
    item.name.substring(0, 15).toUpperCase(), // On tronque le nom si trop long
    item.quantity,
    formatF(item.price * item.quantity)
  ]);

  autoTable(doc, {
    startY: yPos + 2,
    margin: { left: margin, right: margin },
    head: [["ART", "QTÉ", "TOTAL"]],
    body: tableRows,
    theme: 'plain', // Pas de grille lourde
    styles: {
      fontSize: 8,
      cellPadding: 1,
      font: "helvetica",
      textColor: [0, 0, 0]
    },
    headStyles: {
      borderBottomWidth: 0.1,
      borderBottomColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Nom large
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 'auto', halign: 'right' }
    }
  });

  // --- 4. TOTAUX ---
  let finalY = doc.lastAutoTable.finalY + 4;

  // Ligne de total
  doc.setLineWidth(0.2);
  doc.line(margin, finalY, width - margin, finalY);
  finalY += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL PRIX :", margin, finalY);
  doc.text(formatF(invoice.totalAmount), width - margin, finalY, { align: "right" });
  finalY += 5;

  if (invoice.amountPaid && invoice.amountPaid > 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Payé :", margin, finalY);
    doc.text(formatF(invoice.amountPaid), width - margin, finalY, { align: "right" });
    finalY += 4;

    const reste = invoice.totalAmount - invoice.amountPaid;
    if (reste > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Reste à Payer :", margin, finalY);
      doc.text(formatF(reste), width - margin, finalY, { align: "right" });
      finalY += 5;
    }
  }

  // --- 5. FOOTER & QR ---
  finalY += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("MERCI DE VOTRE VISITE !", width / 2, finalY, { align: "center" });

  try {
    // QR Code petit et centré
    const cleanPhone = userData.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
    const qrText = `https://wa.me/${formattedPhone}?text=Facture ${invoice.invoiceNumber}`;
    const qrDataUrl = await QRCode.toDataURL(qrText);

    // QR Code 20x20mm
    doc.addImage(qrDataUrl, 'PNG', (width / 2) - 10, finalY + 4, 20, 20);
  } catch (err) {
    console.error("QR Error", err);
  }

  // Sauvegarde
  doc.save(`TICKET_${invoice.invoiceNumber}.pdf`);
};
// --- FIN DE LA FONCTION GENERATEPDF ---