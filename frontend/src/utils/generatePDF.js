import { jsPDF } from "jspdf";
import axios from 'axios';
import autoTable from "jspdf-autotable"; 
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const generatePDF = async (invoice) => {
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  
  const formatF = (amount) => {
    return Math.round(amount).toLocaleString('fr-FR').replace(/\s/g, ' ') + " F";
  };

  let userData = null;
  try {
    const res = await axios.get(`${API_URL}/api/auth/profile`, config);
    userData = res.data;
  } catch (err) { 
    toast.error("ERREUR DE VÉRIFICATION");
    return;
  }

  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a5"
  });

  const width = doc.internal.pageSize.getWidth();

  // --- EN-TÊTE ENCADRÉ ---
  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  // doc.rect(x, y, largeur, hauteur)
  doc.rect(5, 5, width - 10, 30); 

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(userData.shopName.toUpperCase(), width / 2, 14, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  // Espacement augmenté entre chaque ligne
  doc.text(userData.address || "Conakry", width / 2, 20, { align: "center" });
  doc.text(`Tel: ${userData.phone}`, width / 2, 25, { align: "center" });
  doc.text("(Sénégal)", width / 2, 30, { align: "center" });

  // --- INFOS CLIENT ET FACTURE ---
  doc.setLineWidth(0.3);
  doc.line(10, 42, width - 10, 42); // Ligne de séparation sous l'en-tête
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`CLIENT : ${(invoice.customerName || "PASSAGER").toUpperCase()}`, 10, 48);
  
  doc.setFont("helvetica", "normal");
  doc.text(`DATE : ${new Date(invoice.createdAt || new Date()).toLocaleDateString('fr-FR')}`, width - 10, 48, { align: "right" });
  doc.text(`FACTURE N° : ${invoice.invoiceNumber.split('-').pop()}`, width - 10, 53, { align: "right" });

  // --- TABLEAU ---
  const tableRows = invoice.items.map(item => [
    item.quantity,
    item.name.toUpperCase(),
    formatF(item.price),
    formatF(item.price * item.quantity)
  ]);

  autoTable(doc, {
    startY: 60,
    margin: { left: 10, right: 10 },
    head: [["Qté", "Désignation", "P.U", "Montant"]],
    body: tableRows,
    theme: 'grid',
    styles: { 
      fontSize: 8, 
      cellPadding: 2.5, 
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      font: "helvetica"
    },
    headStyles: { 
      fillColor: [245, 245, 245], 
      textColor: [0, 0, 0], 
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: { 
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 28, halign: 'right' }, 
      3: { cellWidth: 28, halign: 'right' } 
    }
  });

  // --- BLOC RÉCAPITULATIF (TOTAL / AVANCE / RESTE) ---
  const finalY = doc.lastAutoTable.finalY + 8;
  const boxWidth = 55;
  const startX = width - boxWidth - 10;

  doc.setDrawColor(0);
  doc.rect(startX, finalY, boxWidth, 21); 

  doc.setFontSize(9);
  const reste = invoice.totalAmount - (invoice.amountPaid || 0);

  doc.setFont("helvetica", "bold");
  doc.text("Total Facture :", startX + 2, finalY + 6);
  doc.text(formatF(invoice.totalAmount), width - 12, finalY + 6, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Avance :", startX + 2, finalY + 12);
  doc.text(formatF(invoice.amountPaid || 0), width - 12, finalY + 12, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text("Reste à Payer :", startX + 2, finalY + 18);
  doc.text(formatF(reste), width - 12, finalY + 18, { align: "right" });

  // --- FOOTER ---
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Merci de votre fidélité !", width / 2, 195, { align: "center" });

  doc.save(`FACT_${invoice.invoiceNumber}.pdf`);
};