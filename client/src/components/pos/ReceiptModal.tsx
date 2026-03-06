import { Modal, Button, Table, ButtonGroup } from 'react-bootstrap';
import { Printer, FileText, Receipt } from 'lucide-react';
import { InvoiceTemplate } from './InvoiceTemplate';
import { useState, useEffect } from 'react';

interface ReceiptItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

interface ReceiptModalProps {
    show: boolean;
    onHide: () => void;
    transaction: {
        id: string;
        date: string;
        items: ReceiptItem[];
        subtotal: number;
        tax: number;
        discount: number;
        couponDiscount?: number;
        loyaltyDiscount?: number;
        total: number;
        paymentMethod: string;
        customer?: string;
        customerId?: number;
        amountTendered?: number;
        change?: number;
    } | null;
}

export function ReceiptModal({ show, onHide, transaction }: ReceiptModalProps) {
    const [mode, setMode] = useState<'receipt' | 'invoice'>('receipt');

    useEffect(() => {
        if (show) setMode('receipt');
    }, [show]);

    if (!transaction) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Transaction Receipt</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0" id="receipt-content">
                {mode === 'invoice' ? (
                    <div className="overflow-auto" style={{ maxHeight: '80vh' }}>
                        <InvoiceTemplate transaction={transaction} />
                    </div>
                ) : (
                    <div className="p-4">
                        <div className="text-center mb-4">
                            <h4 className="fw-bold">ERP Store</h4>
                            <p className="text-muted mb-1">123 Business Ave, Tech City</p>
                            <p className="text-muted">Tel: +1 234 567 890</p>
                        </div>

                        <div className="d-flex justify-content-between mb-3 small">
                            <div>
                                <div><strong>Date:</strong> {transaction.date}</div>
                                <div><strong>Order ID:</strong> {transaction.id}</div>
                                {transaction.customer && <div><strong>Customer:</strong> {transaction.customer}</div>}
                            </div>
                        </div>

                        <Table size="sm" className="mb-4">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th className="text-end">Qty</th>
                                    <th className="text-end">Price</th>
                                    <th className="text-end">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transaction.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.name}</td>
                                        <td className="text-end">{item.quantity}</td>
                                        <td className="text-end">${item.price.toFixed(2)}</td>
                                        <td className="text-end">${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        <div className="border-top pt-3">
                            <div className="d-flex justify-content-between mb-1">
                                <span>Subtotal:</span>
                                <span>${transaction.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-1">
                                <span>Tax:</span>
                                <span>${transaction.tax.toFixed(2)}</span>
                            </div>
                            {transaction.discount > 0 && (
                                <div className="d-flex justify-content-between mb-1 text-success">
                                    <span>Total Discount:</span>
                                    <span>-${transaction.discount.toFixed(2)}</span>
                                </div>
                            )}
                            {transaction.couponDiscount && transaction.couponDiscount > 0 && (
                                <div className="d-flex justify-content-between mb-1 text-success small ps-3">
                                    <span>Coupon Savings:</span>
                                    <span>-${transaction.couponDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            {transaction.loyaltyDiscount && transaction.loyaltyDiscount > 0 && (
                                <div className="d-flex justify-content-between mb-1 text-primary small ps-3">
                                    <span>Loyalty Discount:</span>
                                    <span>-${transaction.loyaltyDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
                                <span>Total:</span>
                                <span>${transaction.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="border-top pt-3 mt-3">
                            <div className="d-flex justify-content-between mb-1">
                                <span>Payment Method:</span>
                                <span className="text-capitalize">{transaction.paymentMethod}</span>
                            </div>
                            {transaction.amountTendered !== undefined && (
                                <>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span>Amount Tendered:</span>
                                        <span>${transaction.amountTendered.toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between fw-bold">
                                        <span>Change:</span>
                                        <span>${transaction.change?.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="text-center mt-4 text-muted small">
                            <p>Thank you for your purchase!</p>
                            <p>Please keep this receipt for your records.</p>
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <div className="d-flex gap-2 w-100 justify-content-between align-items-center">
                    <ButtonGroup>
                        <Button
                            variant={mode === 'receipt' ? 'primary' : 'outline-primary'}
                            onClick={() => setMode('receipt')}
                            size="sm"
                        >
                            <Receipt size={16} className="me-1" /> Receipt
                        </Button>
                        <Button
                            variant={mode === 'invoice' ? 'primary' : 'outline-primary'}
                            onClick={() => setMode('invoice')}
                            size="sm"
                        >
                            <FileText size={16} className="me-1" /> Invoice (A4)
                        </Button>
                    </ButtonGroup>

                    <div className="d-flex gap-2">
                        <Button variant="secondary" onClick={onHide}>Close</Button>
                        <Button variant="success" onClick={handlePrint}>
                            <Printer size={16} className="me-2" />
                            Print
                        </Button>
                    </div>
                </div>
            </Modal.Footer>
        </Modal>
    );
}
