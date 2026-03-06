
import React, { useEffect, useState } from 'react';
import { getCompanies, getCustomers, type Company, type Customer } from '../../lib/api';

// Defined locally to match ReceiptModal structure
interface InvoiceItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

interface InvoiceTemplateProps {
    transaction: {
        id: string;
        date: string;
        items: InvoiceItem[];
        subtotal: number;
        tax: number;
        total: number;
        discount?: number;
        paymentMethod: string;
        amountTendered?: number;
        change?: number;
        customerId?: number;
        customerName?: string; // Fallback
    };
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ transaction }) => {
    const [company, setCompany] = useState<Company | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        // Fetch Company Data
        getCompanies().then(companies => {
            if (companies.length > 0) {
                setCompany(companies[0]);
            }
        }).catch(err => console.error("Failed to fetch company info", err));

        // Fetch Customer Data if ID exists
        if (transaction.customerId && transaction.customerId !== 0) {
            getCustomers().then(customers => {
                const found = customers.find(c => c.id == transaction.customerId);
                if (found) setCustomer(found);
            }).catch(err => console.error("Failed to fetch customer info", err));
        }
    }, [transaction.customerId]);

    // Colors roughly matching the image
    const orangeColor = '#FF5722';
    const blueColor = '#1A237E';

    return (
        <div className="invoice-container bg-white position-relative" style={{ width: '100%', minHeight: '1000px', fontFamily: 'Arial, sans-serif', padding: '40px', boxSizing: 'border-box' }}>

            {/* Header Shapes */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '60%',
                height: '150px',
                background: `linear-gradient(135deg, transparent 20%, ${orangeColor} 20%)`,
                zIndex: 0
            }}>
                <div style={{ position: 'absolute', right: '40px', top: '40px', color: 'white', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                        <div style={{ background: 'white', padding: '5px', borderRadius: '4px' }}>
                            {/* Logo Placeholder */}
                            <svg width="24" height="24" viewBox="0 0 24 24" fill={orangeColor}>
                                <path d="M12 2L2 12l10 10 10-10L12 2zm0 18l-8-8 8-8 8 8-8 8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{company?.name || 'Brand Name'}</h2>
                            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>TAGLINE SPACE HERE</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoice Title & Left Shape */}
            <div style={{ marginTop: '40px', position: 'relative', zIndex: 1 }}>
                <h1 style={{ color: blueColor, fontSize: '48px', fontWeight: 'bold', margin: 0, letterSpacing: '2px' }}>INVOICE</h1>

                {/* Blue Bar under Invoice */}
                <div style={{
                    marginTop: '20px',
                    background: blueColor,
                    height: '40px',
                    width: '50%',
                    clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0% 100%)'
                }}></div>
            </div>

            {/* Invoice Info Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '40px', gap: '100px' }}>
                {/* Invoice To */}
                <div>
                    <h5 style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>Invoice to:</h5>
                    <h4 style={{ margin: 0, fontWeight: 'bold' }}>{customer?.name || transaction.customerName || 'Walk-in Customer'}</h4>
                    <p style={{ margin: 0, color: '#555', maxWidth: '200px' }}>
                        {customer?.company || '123 Customer Street, City Area'} <br />
                        {customer?.email}<br />
                        {customer?.phone}
                    </p>
                </div>

                {/* Details */}
                <div style={{ flexGrow: 1, textAlign: 'right', paddingRight: '50px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '40px', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Invoice#</span>
                        <span>{transaction.id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '40px' }}>
                        <span style={{ fontWeight: 'bold' }}>Date</span>
                        <span>{transaction.date || new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{ marginTop: '50px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderTop: `2px solid ${orangeColor}`, borderBottom: `2px solid ${orangeColor}` }}>
                            <th style={{ padding: '15px 10px', textAlign: 'left', width: '50px' }}>SL.</th>
                            <th style={{ padding: '15px 10px', textAlign: 'left' }}>Item Description</th>
                            <th style={{ padding: '15px 10px', textAlign: 'right' }}>Price</th>
                            <th style={{ padding: '15px 10px', textAlign: 'center' }}>Qty.</th>
                            <th style={{ padding: '15px 10px', textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transaction.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px 10px' }}>{idx + 1}</td>
                                <td style={{ padding: '15px 10px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                                    <div style={{ fontSize: '12px', color: '#777' }}>Product item description here...</div>
                                </td>
                                <td style={{ padding: '15px 10px', textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                                <td style={{ padding: '15px 10px', textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ padding: '15px 10px', textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Summary */}
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '50%' }}>
                    <h5 style={{ fontWeight: 'bold' }}>Thank you for your business</h5>

                    <div style={{ marginTop: '30px' }}>
                        <h6 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Payment Info:</h6>
                        <table style={{ fontSize: '12px' }}>
                            <tbody>
                                {company?.bank_name && (
                                    <tr>
                                        <td style={{ paddingRight: '20px', fontWeight: 'bold' }}>Bank:</td>
                                        <td>{company.bank_name}</td>
                                    </tr>
                                )}
                                {company?.account_number && (
                                    <tr>
                                        <td style={{ paddingRight: '20px', fontWeight: 'bold' }}>Account Number:</td>
                                        <td>{company.account_number}</td>
                                    </tr>
                                )}
                                {company?.account_name && (
                                    <tr>
                                        <td style={{ paddingRight: '20px', fontWeight: 'bold' }}>A/C Name:</td>
                                        <td>{company.account_name}</td>
                                    </tr>
                                )}
                                {(company?.iban || company?.swift) && (
                                    <tr>
                                        <td style={{ paddingRight: '20px', fontWeight: 'bold' }}>IBAN / Swift:</td>
                                        <td>
                                            {company.iban} {company.swift ? `/ ${company.swift}` : ''}
                                        </td>
                                    </tr>
                                )}
                                {!company?.bank_name && !company?.account_number && (
                                    <tr>
                                        <td colSpan={2} style={{ fontStyle: 'italic', color: '#999' }}>Bank details not set</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '30px' }}>
                        <h6 style={{ fontWeight: 'bold' }}>Terms & Conditions</h6>
                        <p style={{ fontSize: '10px', color: '#777', maxWidth: '300px' }}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Fusce dignissim pretium consectetur.
                        </p>
                    </div>
                </div>

                <div style={{ width: '40%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 'bold' }}>
                        <span>Sub Total:</span>
                        <span>${transaction.subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span>Tax:</span>
                        <span>{transaction.tax > 0 ? `$${transaction.tax.toFixed(2)}` : '0.00%'}</span>
                    </div>
                    {transaction.discount ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'green' }}>
                            <span>Discount:</span>
                            <span>-${transaction.discount.toFixed(2)}</span>
                        </div>
                    ) : null}

                    <div style={{ borderTop: '2px solid #ddd', margin: '20px 0' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 'bold', color: blueColor }}>
                        <span>Total:</span>
                        <span>${transaction.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Authorised Sign */}
            <div style={{ marginTop: '60px', textAlign: 'right' }}>
                <div style={{ display: 'inline-block', textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #333', width: '200px', marginBottom: '5px' }}></div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Authorised Sign</span>
                </div>
            </div>

            {/* Bottom Shapes */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '40px',
                zIndex: 0
            }}>
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '60%',
                    height: '40px',
                    background: blueColor,
                    clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0% 100%)'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '50%',
                    height: '20px',
                    background: orangeColor
                }}></div>
            </div>

        </div>
    );
};
