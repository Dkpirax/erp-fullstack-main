import { useState, useEffect } from "react";
import { Card, Table, Form, InputGroup, Badge, Spinner, Button, Modal } from "react-bootstrap";
import { Search, Calendar, DollarSign, User, Eye, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPOSOrders, type POSOrder } from "../../lib/api";

export function SalesHistory() {
    const [sales, setSales] = useState<POSOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const data = await getPOSOrders();
                setSales(Array.isArray(data) ? data : []);
                console.log("Sales data:", data);
            } catch (error) {
                console.error("Failed to fetch sales history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSales();
    }, []);

    const filteredSales = sales.filter(sale =>
        (sale.order_number?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (sale.status?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    const [selectedOrder, setSelectedOrder] = useState<POSOrder | null>(null);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const handleViewOrder = (sale: POSOrder) => {
        setSelectedOrder(sale);
        setShowModal(true);
    };

    const handlePrintReceipt = () => {
        if (selectedOrder) {
            navigate(`/pos/receipt/${selectedOrder.id}`);
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">Sales History</h1>
            </div>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search orders by number or status..."
                            className="border-start-0 shadow-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center p-5">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 ps-4">Order #</th>
                                    <th className="border-0">Date & Time</th>
                                    <th className="border-0">Customer</th>
                                    <th className="border-0">Items</th>
                                    <th className="border-0">Total</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0">Payment</th>
                                    <th className="border-0 pe-4 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-4 text-muted">No orders found</td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale) => (
                                        <tr key={sale.id}>
                                            <td className="ps-4 fw-medium">{sale.order_number || `ORD-${sale.id}`}</td>
                                            <td className="text-muted">
                                                <div className="d-flex align-items-center">
                                                    <Calendar size={14} className="me-2" />
                                                    {new Date(sale.created_at).toLocaleString()}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <User size={14} className="me-2 text-muted" />
                                                    {sale.customer_name || (sale.customer_id ? `Customer #${sale.customer_id}` : "Walk-in Customer")}
                                                </div>
                                            </td>
                                            <td>{sale.items?.reduce((acc, item) => acc + item.quantity, 0) || 0}</td>
                                            <td className="fw-bold">
                                                <div className="d-flex align-items-center">
                                                    <DollarSign size={14} className="me-1 text-muted" />
                                                    {Number(sale.total_amount || 0).toFixed(2)}
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg={sale.status === 'COMPLETED' ? 'success' : 'warning'}>
                                                    {sale.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg={
                                                    (sale.payments && sale.payments[0]?.method === 'CASH') ? 'success' :
                                                        (sale.payments && sale.payments[0]?.method === 'CARD') ? 'primary' : 'secondary'
                                                }>
                                                    {sale.payments && sale.payments.length > 0 ? sale.payments[0].method : 'N/A'}
                                                </Badge>
                                            </td>
                                            <td className="pe-4 text-end">
                                                <Button variant="light" size="sm" onClick={() => handleViewOrder(sale)}>
                                                    <Eye size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Order Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder ? (
                        <div>
                            <div className="d-flex justify-content-between mb-4">
                                <div>
                                    <h5 className="fw-bold mb-1">Order #{selectedOrder.order_number || selectedOrder.id}</h5>
                                    <div className="text-muted small">{new Date(selectedOrder.created_at).toLocaleString()}</div>
                                </div>
                                <div className="text-end">
                                    <Badge bg={selectedOrder.status === 'COMPLETED' ? 'success' : 'warning'} className="fs-6">
                                        {selectedOrder.status}
                                    </Badge>
                                </div>
                            </div>

                            <Card className="mb-4 bg-light border-0">
                                <Card.Body>
                                    <h6 className="fw-bold mb-3">Customer Information</h6>
                                    <div className="d-flex align-items-center">
                                        <User size={18} className="me-2 text-muted" />
                                        <span>{selectedOrder.customer_name || (selectedOrder.customer_id ? `Customer #${selectedOrder.customer_id}` : "Walk-in Customer")}</span>
                                    </div>
                                </Card.Body>
                            </Card>

                            <h6 className="fw-bold mb-3">Order Items</h6>
                            <Table responsive className="mb-4">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="border-0">Item</th>
                                        <th className="border-0 text-center">Qty</th>
                                        <th className="border-0 text-end">Price</th>
                                        <th className="border-0 text-end">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.items?.map((item: any) => (
                                        <tr key={item.id}>
                                            <td>{item.product_name || `Product #${item.product_id}`}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-end">${Number(item.unit_price || 0).toFixed(2)}</td>
                                            <td className="text-end fw-bold">${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            <div className="d-flex justify-content-end">
                                <div style={{ width: '250px' }}>
                                    <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                                        <span className="fw-bold">Total Amount</span>
                                        <span className="fw-bold fs-5">${Number(selectedOrder.total_amount).toFixed(2)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between text-muted small">
                                        <span>Payment Method</span>
                                        <span>{selectedOrder.payments && selectedOrder.payments.length > 0 ? selectedOrder.payments[0].method : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-muted">No order selected</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handlePrintReceipt}>
                        <Printer size={16} className="me-2" />
                        Print Receipt
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
