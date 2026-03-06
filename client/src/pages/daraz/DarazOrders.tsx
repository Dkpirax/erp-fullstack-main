import { useState, useEffect } from "react";
import { Card, Table, Button, Badge, Form, Alert, Modal, Row, Col } from "react-bootstrap";
import { RefreshCw, Eye } from "lucide-react";

export function DarazOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/daraz/orders?status=${statusFilter}`);
            const data = await response.json();
            setOrders(data.data?.orders || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    const viewOrderDetails = async (orderId: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/daraz/orders/${orderId}`);
            const data = await response.json();
            setSelectedOrder(data.data);
            setShowDetailsModal(true);
        } catch (err: any) {
            setError(err.message || "Failed to fetch order details");
        }
    };

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Daraz Orders</h2>
                <Button variant="primary" onClick={fetchOrders}>
                    <RefreshCw size={18} className="me-2" />
                    Refresh
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <Row className="g-2">
                        <Col md={6}>
                            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="pending">Pending</option>
                                <option value="ready_to_ship">Ready to Ship</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="canceled">Canceled</option>
                                <option value="returned">Returned</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" />
                        </div>
                    ) : (
                        <Table hover responsive>
                            <thead className="bg-light">
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-4">
                                            No orders found
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.order_id}>
                                            <td className="fw-medium">{order.order_number}</td>
                                            <td>{order.customer_first_name} {order.customer_last_name}</td>
                                            <td>{order.items_count || 1}</td>
                                            <td>PKR {order.price?.toFixed(2)}</td>
                                            <td>
                                                <Badge bg={
                                                    order.status === "pending" ? "warning" :
                                                        order.status === "shipped" ? "info" :
                                                            order.status === "delivered" ? "success" : "secondary"
                                                }>
                                                    {order.status}
                                                </Badge>
                                            </td>
                                            <td className="text-muted small">{new Date(order.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <Button
                                                    variant="link"
                                                    className="text-primary p-0"
                                                    onClick={() => viewOrderDetails(order.order_id)}
                                                >
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

            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Order Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <div>
                            <h6>Order #{selectedOrder.order_number}</h6>
                            <p className="text-muted">Customer: {selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</p>
                            <p>Total: PKR {selectedOrder.price?.toFixed(2)}</p>
                            <Badge bg="info">{selectedOrder.status}</Badge>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
