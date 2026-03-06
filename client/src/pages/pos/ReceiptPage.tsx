
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Spinner, Alert } from "react-bootstrap";
import { Printer, ArrowLeft } from "lucide-react";
import api from "../../lib/api";
import { InvoiceTemplate } from "../../components/pos/InvoiceTemplate";

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

interface Order {
    id: number;
    total_amount: number;
    status: string;
    created_at: string;
    customer_id?: number;
    customer?: {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    items: OrderItem[];
    payments: { method: string; amount: number }[];
}

export function ReceiptPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/pos/orders/${id}`);
            setOrder(response.data);
        } catch (err: any) {
            setError("Failed to load receipt details.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger" className="m-4">{error}</Alert>;
    if (!order) return <Alert variant="warning" className="m-4">Order not found</Alert>;

    // Map API Order to InvoiceTemplate transaction prop
    const transaction = {
        id: order.id.toString(),
        date: new Date(order.created_at).toLocaleDateString(),
        items: order.items.map(item => ({
            id: item.id,
            name: item.product_name,
            price: Number(item.unit_price),
            quantity: item.quantity
        })),
        subtotal: Number(order.total_amount), // Assuming total is subtotal for simplified POS
        tax: 0, // Backend might calculate tax inside total, or return it separate. Assuming 0 or included.
        total: Number(order.total_amount),
        paymentMethod: order.payments[0]?.method || 'Unknown',
        amountTendered: order.payments.reduce((acc, p) => acc + Number(p.amount), 0),
        change: 0,
        customerId: order.customer_id,
        customerName: order.customer?.name // Fallback if ID lookup fails
    };

    return (
        <div className="bg-light min-vh-100 d-flex flex-column align-items-center py-4">
            {/* Action Bar (Hidden on Print) */}
            <div className="d-flex justify-content-between align-items-center mb-4 w-100 container d-print-none" style={{ maxWidth: '210mm' }}>
                <Button variant="outline-secondary" onClick={() => navigate("/pos")}>
                    <ArrowLeft size={18} className="me-2" /> Back to POS
                </Button>
                <Button variant="primary" onClick={handlePrint} className="d-flex align-items-center">
                    <Printer size={18} className="me-2" /> Print Invoice
                </Button>
            </div>

            {/* Invoice Container (A4 Width) */}
            <div className="bg-white shadow-lg mx-auto overflow-hidden invoice-print-container" style={{ width: '210mm', minHeight: '297mm' }}>
                <InvoiceTemplate transaction={transaction} />
            </div>

            <style>
                {`
                    @media print {
                        @page { 
                            size: auto; 
                            margin: 0mm; 
                        }
                        body {
                            background: white !important;
                            margin: 0 !important;
                        }
                        .d-print-none {
                            display: none !important;
                        }
                        .min-vh-100 {
                            min-height: auto !important;
                        }
                        .bg-light {
                            background: white !important;
                        }
                        .invoice-print-container {
                            box-shadow: none !important;
                            width: 100% !important;
                            margin: 0 !important;
                        }
                        /* Hide everything else */
                        body > *:not(#root) {
                            display: none;
                        }
                    }
                `}
            </style>
        </div>
    );
}
