import { Card, Row, Col, Table, Badge, ProgressBar } from "react-bootstrap";
import { Package, AlertTriangle, Truck, CheckCircle } from "lucide-react";

const stats = [
    { name: "Total Inventory Value", value: "$534,231", icon: Package, color: "primary" },
    { name: "Low Stock Items", value: "12", icon: AlertTriangle, color: "warning" },
    { name: "Pending Orders", value: "5", icon: Truck, color: "info" },
    { name: "Fulfilled Orders", value: "128", icon: CheckCircle, color: "success" },
];

const lowStockItems = [
    { id: 1, name: "Wireless Mouse", sku: "ACC-002", stock: 5, min: 10, status: "Critical" },
    { id: 2, name: "Desk Lamp", sku: "LGT-001", stock: 8, min: 15, status: "Low" },
    { id: 3, name: "Monitor Stand", sku: "ACC-001", stock: 12, min: 20, status: "Low" },
];

export function SupplyChainDashboard() {
    return (
        <div>
            <h1 className="h2 mb-4">Supply Chain Dashboard</h1>

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

            <Row className="g-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0">Low Stock Alerts</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="border-0">Product Name</th>
                                        <th className="border-0">SKU</th>
                                        <th className="border-0">Current Stock</th>
                                        <th className="border-0">Status</th>
                                        <th className="border-0">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowStockItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="fw-medium">{item.name}</td>
                                            <td className="text-muted">{item.sku}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <span className="me-2">{item.stock} / {item.min}</span>
                                                    <ProgressBar
                                                        now={(item.stock / item.min) * 100}
                                                        variant={item.status === 'Critical' ? 'danger' : 'warning'}
                                                        style={{ width: 60, height: 6 }}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg={item.status === 'Critical' ? 'danger' : 'warning'}>
                                                    {item.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-primary">Reorder</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0">Supplier Performance</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span>TechSupplies Inc.</span>
                                    <span className="fw-bold">98%</span>
                                </div>
                                <ProgressBar now={98} variant="success" style={{ height: 8 }} />
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span>OfficeDepot Wholesale</span>
                                    <span className="fw-bold">85%</span>
                                </div>
                                <ProgressBar now={85} variant="info" style={{ height: 8 }} />
                            </div>
                            <div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span>Global Furniture Ltd.</span>
                                    <span className="fw-bold">72%</span>
                                </div>
                                <ProgressBar now={72} variant="warning" style={{ height: 8 }} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
