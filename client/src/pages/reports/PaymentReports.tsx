import { useState, useEffect } from "react";
import { Container, Card, Row, Col, Form, Button, Table, Badge, Spinner } from "react-bootstrap";
import { Calendar, DollarSign, CreditCard, Banknote, FileText, TrendingUp } from "lucide-react";
import api from "../../lib/api";

interface PaymentSummary {
    total_amount: number;
    count: number;
    by_method: {
        [key: string]: {
            count: number;
            amount: number;
        };
    };
}

interface Payment {
    id: number;
    order_id: number;
    payment_method: string;
    amount: string;
    check_number?: string;
    check_date?: string;
    check_type?: string;
    check_from?: string;
    bank_name?: string;
    deposit_date?: string;
    check_status?: string;
    createdAt: string;
}

export function PaymentReports() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [checkStatus, setCheckStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<PaymentSummary | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);
            if (paymentMethod) params.append("payment_method", paymentMethod);
            if (checkStatus) params.append("check_status", checkStatus);

            const response = await api.get(`/reports/payments?${params.toString()}`);
            setSummary(response.data.summary);
            setPayments(response.data.payments);
        } catch (error) {
            console.error("Failed to fetch payment reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Set default dates (last 30 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchReports();
        }
    }, [startDate, endDate]);

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case "CASH": return <Banknote size={16} />;
            case "CARD": return <CreditCard size={16} />;
            case "CHECK": return <FileText size={16} />;
            default: return <DollarSign size={16} />;
        }
    };

    const getCheckStatusBadge = (status?: string) => {
        if (!status) return null;
        const variants: { [key: string]: string } = {
            PENDING: "warning",
            DEPOSITED: "info",
            CLEARED: "success",
            BOUNCED: "danger"
        };
        return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
    };

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Payment Reports</h2>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Payment Method</Form.Label>
                                <Form.Select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <option value="">All Methods</option>
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="CHECK">Check</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Check Status</Form.Label>
                                <Form.Select
                                    value={checkStatus}
                                    onChange={(e) => setCheckStatus(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="DEPOSITED">Deposited</option>
                                    <option value="CLEARED">Cleared</option>
                                    <option value="BOUNCED">Bounced</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Button onClick={fetchReports} disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" /> : "Generate Report"}
                    </Button>
                </Card.Body>
            </Card>

            {/* Summary Cards */}
            {summary && (
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <TrendingUp size={32} className="text-success mb-2" />
                                <h3 className="mb-0">${summary.total_amount.toFixed(2)}</h3>
                                <p className="text-muted mb-0">Total Amount</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <Calendar size={32} className="text-primary mb-2" />
                                <h3 className="mb-0">{summary.count}</h3>
                                <p className="text-muted mb-0">Total Transactions</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    {Object.entries(summary.by_method).map(([method, data]) => (
                        <Col md={3} key={method}>
                            <Card className="text-center">
                                <Card.Body>
                                    <div className="mb-2">{getPaymentIcon(method)}</div>
                                    <h5 className="mb-0">${data.amount.toFixed(2)}</h5>
                                    <p className="text-muted mb-0">{method} ({data.count})</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Payments Table */}
            <Card>
                <Card.Body>
                    <Table hover responsive>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Order ID</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th>Check Details</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                                    <td>#{payment.order_id}</td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            {getPaymentIcon(payment.payment_method)}
                                            {payment.payment_method}
                                        </div>
                                    </td>
                                    <td className="fw-bold">${parseFloat(payment.amount).toFixed(2)}</td>
                                    <td>
                                        {payment.payment_method === "CHECK" && (
                                            <div className="small">
                                                <div><strong>Check #:</strong> {payment.check_number}</div>
                                                <div><strong>From:</strong> {payment.check_from}</div>
                                                <div><strong>Type:</strong> {payment.check_type}</div>
                                                {payment.bank_name && <div><strong>Bank:</strong> {payment.bank_name}</div>}
                                                <div><strong>Deposit:</strong> {payment.deposit_date}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td>{getCheckStatusBadge(payment.check_status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {payments.length === 0 && !loading && (
                        <div className="text-center text-muted py-4">
                            No payments found for the selected criteria
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}
