import { useState, useEffect } from "react";
import { Card, Table, Button, Badge, Form, Alert } from "react-bootstrap";
import { RefreshCw } from "lucide-react";

export function WooCommerceOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("any");
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");
            const status = statusFilter !== "any" ? `&status=${statusFilter}` : "";
            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/woocommerce/orders?page=${page}&per_page=20${status}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error("Failed to fetch orders");
            const data = await response.json();
            setOrders(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>WooCommerce Orders</h2>
                <Button variant="primary" onClick={fetchOrders}>
                    <RefreshCw size={18} className="me-2" />
                    Refresh
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <Form.Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="any">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                        <option value="failed">Failed</option>
                    </Form.Select>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" />
                        </div>
                    ) : (
                        <>
                            <Table hover responsive>
                                <thead className="bg-light">
                                    <tr>
                                        <th>Order #</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center text-muted py-4">
                                                No orders found
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="fw-medium">#{order.number}</td>
                                                <td>{order.billing?.first_name} {order.billing?.last_name}</td>
                                                <td>${order.total}</td>
                                                <td>
                                                    <Badge bg={
                                                        order.status === "completed" ? "success" :
                                                            order.status === "processing" ? "info" :
                                                                order.status === "pending" ? "warning" : "secondary"
                                                    }>
                                                        {order.status}
                                                    </Badge>
                                                </td>
                                                <td className="text-muted small">{new Date(order.date_created).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <Button variant="outline-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
                                    Previous
                                </Button>
                                <span>Page {page}</span>
                                <Button variant="outline-secondary" disabled={orders.length < 20} onClick={() => setPage(page + 1)}>
                                    Next
                                </Button>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
