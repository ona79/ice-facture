import { jsPDF } from "jspdf";
import axios from 'axios';
import autoTable from "jspdf-autotable"; 

// --- DÉTECTION DYNAMIQUE DE L'URL API ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const generatePDF = async (invoice) => {
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  
  const formatFCFA = (amount) => {
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
  };

  // --- LOGIQUE DE NUMÉROTATION ---
  let finalInvoiceNumber = invoice.invoiceNumber;
  
  if (!finalInvoiceNumber.includes(new Date().getFullYear().toString())) {
    const d = new Date(invoice.createdAt || new Date());
    const datePart = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    
    const rawNumber = finalInvoiceNumber.includes('-') 
      ? finalInvoiceNumber.split('-')[1] 
      : finalInvoiceNumber;
      
    const paddedSerial = rawNumber.replace(/\D/g, '').padStart(6, '0'); // Ajusté pour correspondre à ton image
    finalInvoiceNumber = `FACT-${datePart}-${paddedSerial}`;
  }

  // --- RÉCUPÉRATION DES INFOS BOUTIQUE (PROFIL) ---
  let userData = { shopName: "MA BOUTIQUE", address: "", phone: "", footerMessage: "" };
  try {
    // Correction de l'URL pour pointer vers Render ou Localhost
    const res = await axios.get(`${API_URL}/api/auth/profile`, config);
    userData = res.data;
  } catch (err) { 
    console.error("Erreur lors de la récupération du profil pour le PDF:", err); 
  }

  const doc = new jsPDF();

  // --- EN-TÊTE DYNAMIQUE ---
  doc.setTextColor(0, 0, 0); 
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(userData.shopName.toUpperCase(), 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  // Utilisation des données récupérées via l'API
  doc.text(`Adresse: ${userData.address || "Non spécifiée"}`, 20, 35);
  doc.text(`Tel: ${userData.phone || "Non spécifié"}`, 20, 42);

  // SECTION NUMÉRO ET DATE (À DROITE)
  doc.setFont("helvetica", "bold");
  doc.text(finalInvoiceNumber, 140, 35); 
  doc.setFont("helvetica", "normal");
  doc.text(`DATE : ${new Date(invoice.createdAt || new Date()).toLocaleDateString('fr-FR')}`, 140, 42);

  // --- TABLEAU DES PRODUITS ---
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
    headStyles: { 
      fillColor: [255, 255, 255], 
      textColor: [0, 0, 0],       
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]        
    },
    bodyStyles: { textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right', fontStyle: 'bold' } 
    }
  });

  // --- TOTAL FINAL ---
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setLineWidth(0.8);
  doc.rect(125, finalY - 8, 70, 15); // Boîte autour du total

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const totalText = `TOTAL : ${formatFCFA(invoice.totalAmount)}`;
  doc.text(totalText, 190, finalY, { align: "right" });

  // --- PIED DE PAGE (Footer Message) ---
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  const footerNote = userData.footerMessage || "Merci de votre confiance !";
  doc.text(footerNote, 105, 285, { align: "center" });

  doc.save(`${finalInvoiceNumber}.pdf`);
};