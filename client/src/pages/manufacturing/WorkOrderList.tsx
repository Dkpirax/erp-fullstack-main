import { useState } from "react";
import { Card, Table, Badge, Button, ProgressBar, Form } from "react-bootstrap";
import { Plus, Calendar } from "lucide-react";
import { GenericModal } from "../../components/common/GenericModal";

const initialWorkOrders = [
    { id: "WO-2023-001", product: "Office Chair X1", quantity: 50, completed: 35, status: "In Progress", dueDate: "2023-11-30" },
    { id: "WO-2023-002", product: "Executive Desk", quantity: 20, completed: 2, status: "Just Started", dueDate: "2023-12-15" },
    { id: "WO-2023-003", product: "Monitor Stand", quantity: 100, completed: 100, status: "Completed", dueDate: "2023-10-20" },
];

export function WorkOrderList() {
    const [workOrders, setWorkOrders] = useState(initialWorkOrders);
    const [showModal, setShowModal] = useState(false);
    const [newOrder, setNewOrder] = useState({
        product: "",
        quantity: "",
        dueDate: ""
    });

    const handleCreateOrder = () => {
        const order = {
            id: `WO-2023-${String(workOrders.length + 1).padStart(3, '0')}`,
            product: newOrder.product,
            quantity: parseInt(newOrder.quantity) || 0,
            completed: 0,
            status: "Just Started",
            dueDate: newOrder.dueDate
        };

        setWorkOrders([...workOrders, order]);
        setShowModal(false);
        setNewOrder({ product: "", quantity: "", dueDate: "" });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">Work Orders</h1>
                <Button variant="primary" className="d-flex align-items-center" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="me-2" />
                    Create Order
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0 ps-4">Order ID</th>
                                <th className="border-0">Product</th>
                                <th className="border-0">Quantity</th>
                                <th className="border-0" style={{ width: '25%' }}>Progress</th>
                                <th className="border-0">Due Date</th>
                                <th className="border-0 pe-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workOrders.map((order) => (
                                <tr key={order.id}>
                                    <td className="ps-4 fw-medium">{order.id}</td>
                                    <td>{order.product}</td>
                                    <td>{order.quantity}</td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <span className="me-2 small text-muted">{Math.round((order.completed / order.quantity) * 100)}%</span>
                                            <ProgressBar
                                                now={(order.completed / order.quantity) * 100}
                                                variant={order.status === 'Completed' ? 'success' : 'primary'}
                                                style={{ height: 6, flexGrow: 1 }}
                                            />
                                        </div>
                                    </td>
                                    <td className="text-muted">
                                        <div className="d-flex align-items-center">
                                            <Calendar size={14} className="me-2" /> {order.dueDate}
                                        </div>
                                    </td>
                                    <td className="pe-4">
                                        <Badge bg={
                                            order.status === 'Completed' ? 'success' :
                                                order.status === 'In Progress' ? 'primary' : 'secondary'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <GenericModal
                show={showModal}
                onHide={() => setShowModal(false)}
                title="Create Work Order"
                onConfirm={handleCreateOrder}
                confirmText="Create Order"
            >
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Product Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. Office Chair"
                            value={newOrder.product}
                            onChange={(e) => setNewOrder({ ...newOrder, product: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="e.g. 100"
                            value={newOrder.quantity}
                            onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Due Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={newOrder.dueDate}
                            onChange={(e) => setNewOrder({ ...newOrder, dueDate: e.target.value })}
                        />
                    </Form.Group>
                </Form>
            </GenericModal>
        </div>
    );
}
