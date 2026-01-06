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

  // --- CONFIGURATION A5 (Petit Format Standard) ---
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a5" // 148 x 210 mm
  });

  const width = doc.internal.pageSize.getWidth(); // ~148mm

  // --- QR CODE (HAUT GAUCHE) ---
  try {
    const cleanPhone = userData.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
    const qrText = `https://wa.me/${formattedPhone}?text=Facture ${invoice.invoiceNumber}`;
    const qrDataUrl = await QRCode.toDataURL(qrText);
    // Petit QR Code en haut à gauche
    doc.addImage(qrDataUrl, 'PNG', 5, 5, 20, 20);
  } catch (err) { console.error(err); }

  // --- EN-TÊTE CENTRÉ ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  // On décale un peu pour ne pas chevaucher le QR
  doc.text(userData.shopName.toUpperCase(), width / 2, 12, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(userData.address || "Adresse non définie", width / 2, 18, { align: "center" });
  doc.text(`Tél: ${userData.phone}`, width / 2, 23, { align: "center" });

  // --- CADRES INFOS (Style Billet) ---
  const yInfo = 30;

  // Cadre Gauche : Client
  doc.setLineWidth(0.1);
  doc.rect(5, yInfo, (width / 2) - 7, 15);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT :", 7, yInfo + 5);
  doc.setFont("helvetica", "normal");
  doc.text((invoice.customerName || "Passager").toUpperCase(), 7, yInfo + 10);

  // Cadre Droite : Date / N°
  doc.rect((width / 2) + 2, yInfo, (width / 2) - 7, 15);
  doc.text(`Date : ${new Date(invoice.createdAt).toLocaleDateString()}`, (width / 2) + 4, yInfo + 5);
  doc.setFont("helvetica", "bold");
  doc.text(`N° : ${invoice.invoiceNumber.split('-').pop()}`, (width / 2) + 4, yInfo + 10);

  // --- TABLEAU (GRID COMPLET) ---
  const tableRows = invoice.items.map(item => [
    item.quantity,
    item.name.substring(0, 35).toUpperCase(),
    formatF(item.price), // Prix Unité
    formatF(item.price * item.quantity)
  ]);

  autoTable(doc, {
    startY: yInfo + 20,
    margin: { left: 5, right: 5 },
    head: [["Qté", "Désignation", "P.U", "Montant"]],
    body: tableRows,
    theme: 'grid', // Lignes complètes comme sur l'image
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: "helvetica",
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [230, 230, 230], // Gris clair
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' }
    }
  });

  // --- TOTAUX (Bas Droite Encadré) ---
  let finalY = doc.lastAutoTable.finalY + 5;
  const boxW = 60;
  const boxX = width - boxW - 5;

  // Cadre total
  doc.rect(boxX, finalY, boxW, 20);

  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.text("Total Facture:", boxX + 2, finalY + 6);
  doc.text(formatF(invoice.totalAmount), width - 7, finalY + 6, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Avance:", boxX + 2, finalY + 12);
  doc.text(formatF(invoice.amountPaid || 0), width - 7, finalY + 12, { align: "right" });

  const reste = invoice.totalAmount - (invoice.amountPaid || 0);
  doc.setFont("helvetica", "bold");
  doc.text("Reste à Payer:", boxX + 2, finalY + 18);
  doc.text(formatF(reste), width - 7, finalY + 18, { align: "right" });

  // --- FOOTER ---
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Page 1 sur 1", 5, 200);
  doc.text(new Date().toLocaleString(), width - 5, 200, { align: "right" });

  doc.save(`FACT_${invoice.invoiceNumber}.pdf`);
};
// --- FIN DE LA FONCTION GENERATEPDF ---