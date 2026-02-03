import React, { forwardRef } from 'react';

const Receipt = forwardRef(({ invoice, shopName, shopAddress, shopPhone, footerMessage }, ref) => {
    if (!invoice) return null;

    const formatDate = (dateString) => {
        if (!dateString) return new Date().toLocaleString();
        return new Date(dateString).toLocaleString();
    };

    const footerText = footerMessage || "MERCI DE VOTRE VISITE !";

    return (
        <div className="sr-only" style={{ position: 'absolute', left: '-9999px' }}>
            <div ref={ref} className="printable-receipt">
                <style>
                    {`
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body * { visibility: hidden; }
              .printable-receipt, .printable-receipt * { visibility: visible; }
              .printable-receipt {
                position: absolute;
                left: 0;
                top: 0;
                width: 78mm; /* Marge secu */
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                color: black;
                background: white;
                padding: 10px;
                text-transform: uppercase;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .divider { border-top: 1px dashed black; margin: 5px 0; }
              .receipt-header { margin-bottom: 10px; }
              .receipt-footer { margin-top: 10px; font-size: 10px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 2px 0; }
            }
          `}
                </style>

                <div className="receipt-header text-center">
                    <h2 className="font-bold" style={{ fontSize: '16px', margin: 0 }}>{shopName || "MA BOUTIQUE"}</h2>
                    {shopAddress && <p style={{ margin: '2px 0', fontSize: '10px', color: '#666' }}>{shopAddress}</p>}
                    {shopPhone && <p style={{ margin: '2px 0', fontSize: '12px', fontWeight: 'bold' }}>Tél: {shopPhone}</p>}
                    <p style={{ margin: '2px 0' }}>TICKET DE CAISSE</p>
                    <p style={{ fontSize: '10px' }}>{formatDate(invoice.createdAt)}</p>
                    <p className="font-bold">#{invoice.invoiceNumber?.split('-').pop() || "Pending"}</p>
                </div>

                <div className="divider" />

                <div style={{ marginBottom: '5px' }}>
                    <p>CLIENT: <span className="font-bold">{invoice.customerName || "PASSAGER"}</span></p>
                    {invoice.customerPhone && invoice.customerPhone.trim() !== "" && (
                        <p style={{ fontSize: '10px', marginTop: '2px' }}>TEL: <span className="font-bold">{invoice.customerPhone}</span></p>
                    )}
                </div>

                <div className="divider" />

                <table>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>ART</th>
                            <th style={{ textAlign: 'center' }}>QT</th>
                            <th style={{ textAlign: 'right' }}>TOT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items && invoice.items.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ textAlign: 'left', width: '50%' }}>{item.name}</td>
                                <td style={{ textAlign: 'center', width: '20%' }}>x{item.quantity}</td>
                                <td style={{ textAlign: 'right', width: '30%' }}>{(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="divider" />

                <div className="text-right">
                    <p style={{ margin: '2px 0' }}>TOTAL: <span className="font-bold" style={{ fontSize: '14px' }}>{invoice.totalAmount?.toLocaleString()} F</span></p>
                    {invoice.amountPaid < invoice.totalAmount ? (
                        <p style={{ margin: '2px 0' }}>RESTE À PAYER: {(invoice.totalAmount - invoice.amountPaid).toLocaleString()} F</p>
                    ) : (
                        <p style={{ margin: '2px 0' }}>ENCAISSÉ: {invoice.amountPaid?.toLocaleString()} F</p>
                    )}
                </div>

                <div className="divider" />

                <div className="receipt-footer text-center">
                    <p>{footerText}</p>
                    <p>Powered by Ice Facture</p>

                </div>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';
export default Receipt;
