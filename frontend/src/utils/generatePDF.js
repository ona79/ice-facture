import { jsPDF } from "jspdf";
import axios from 'axios';
import autoTable from "jspdf-autotable"; 

export const generatePDF = async (invoice) => {
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  
  const formatFCFA = (amount) => {
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
  };

  // --- NOUVELLE LOGIQUE DE NUMÉROTATION FIDÈLE ---
  let finalInvoiceNumber = invoice.invoiceNumber;
  
  // Si le numéro ne contient pas déjà la date (cas où on passe l'ancien FAC-001)
  if (!finalInvoiceNumber.includes(new Date().getFullYear().toString())) {
    const d = new Date(invoice.createdAt || new Date());
    const datePart = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    
    // On extrait le chiffre (ex: "001" de "FAC-001") et on le met sur 5 chiffres
    const rawNumber = finalInvoiceNumber.includes('-') 
      ? finalInvoiceNumber.split('-')[1] 
      : finalInvoiceNumber;
      
    const paddedSerial = rawNumber.replace(/\D/g, '').padStart(5, '0');
    finalInvoiceNumber = `FACT-${datePart}-${paddedSerial}`;
  }

  let userData = { shopName: "MA BOUTIQUE", address: "", phone: "", footerMessage: "" };
  try {
    const res = await axios.get('http://localhost:5000/api/auth/profile', config);
    userData = res.data;
  } catch (err) { console.error(err); }

  const doc = new jsPDF();

  // --- EN-TÊTE ---
  doc.setTextColor(0, 0, 0); 
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(userData.shopName.toUpperCase(), 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Adresse: ${userData.address || ""}`, 20, 35);
  doc.text(`Tel: ${userData.phone || ""}`, 20, 40);

  // SECTION NUMÉRO ET DATE
  doc.setFont("helvetica", "bold");
  doc.text(finalInvoiceNumber, 140, 35); 
  doc.setFont("helvetica", "normal");
  doc.text(`DATE : ${new Date(invoice.createdAt || new Date()).toLocaleDateString('fr-FR')}`, 140, 40);

  // --- TABLEAU ---
  const tableRows = invoice.items.map(item => [
    item.name,
    `${Math.round(item.price)} F`,
    item.quantity,
    formatFCFA(item.price * item.quantity)
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["Produit", "Prix Unitaire", "Qté", "Total"]],
    body: tableRows,
    theme: 'plain',
    headStyles: { 
      fillColor: [255, 255, 255], 
      textColor: [0, 0, 0],       
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]        
    },
    bodyStyles: { textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } }
  });

  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setLineWidth(0.8);
  doc.rect(130, finalY - 8, 65, 12); 

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const totalText = `TOTAL : ${formatFCFA(invoice.totalAmount)}`;
  doc.text(totalText, 190, finalY, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  doc.text(userData.footerMessage || "Merci de votre confiance !", 105, 285, { align: "center" });

  doc.save(`${finalInvoiceNumber}.pdf`);
};