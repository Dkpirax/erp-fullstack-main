import { Card, Row, Col, Table, Badge, ProgressBar } from "react-bootstrap";
import { Factory, ClipboardList, AlertCircle, CheckCircle } from "lucide-react";

const stats = [
    { name: "Active Work Orders", value: "12", icon: ClipboardList, color: "primary" },
    { name: "Production Efficiency", value: "94%", icon: Factory, color: "success" },
    { name: "Machine Downtime", value: "2h 15m", icon: AlertCircle, color: "danger" },
    { name: "Completed Today", value: "45", icon: CheckCircle, color: "info" },
];

const activeOrders = [
    { id: "WO-2023-001", product: "Office Chair X1", quantity: 50, completed: 35, status: "In Progress" },
    { id: "WO-2023-002", product: "Executive Desk", quantity: 20, completed: 2, status: "Just Started" },
    { id: "WO-2023-003", product: "Monitor Stand", quantity: 100, completed: 100, status: "Completed" },
];

export function ManufacturingDashboard() {
    return (
        <div>
            <h1 className="h2 mb-4">Manufacturing Dashboard</h1>

            <Row className="g-4 mb-4">
                {stats.map((stat) => (
                    <Col key={stat.name} sm={6} lg={3}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="d-flex align-items-center">
                                <div className={`p-3 rounded-circle bg-${stat.color}-subtle text-${stat.color} me-3`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <div className="text-muted small">{stat.name}</div>
                                    <div className="h4 mb-0">{stat.value}</div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-3">
                    <h5 className="mb-0">Active Work Orders</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0">Order ID</th>
                                <th className="border-0">Product</th>
                                <th className="border-0">Progress</th>
                                <th className="border-0">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeOrders.map((order) => (
                                <tr key={order.id}>
                                    <td className="fw-medium">{order.id}</td>
                                    <td>{order.product}</td>
                                    <td style={{ width: '40%' }}>
                                        <div className="d-flex align-items-center">
                                            <span className="me-2 small">{order.completed}/{order.quantity}</span>
                                            <ProgressBar
                                                now={(order.completed / order.quantity) * 100}
                                                variant={order.status === 'Completed' ? 'success' : 'primary'}
                                                style={{ height: 6, flexGrow: 1 }}
                                            />
                                        </div>
                                    </td>
                                    <td>
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
        </div>
    );
}
