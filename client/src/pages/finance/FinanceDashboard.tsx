import { Card, Row, Col, Table, Badge } from "react-bootstrap";
import { DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";

const stats = [
    { name: "Total Assets", value: "$1,234,567", change: "+12%", icon: DollarSign, trend: "up" },
    { name: "Total Liabilities", value: "$456,789", change: "-5%", icon: TrendingDown, trend: "down" },
    { name: "Net Income", value: "$89,123", change: "+8%", icon: TrendingUp, trend: "up" },
    { name: "Expenses", value: "$32,456", change: "+2%", icon: Activity, trend: "up" },
];

const recentTransactions = [
    { id: "TRX-001", date: "2023-10-25", description: "Office Supplies", amount: "$1,200.00", type: "Expense" },
    { id: "TRX-002", date: "2023-10-24", description: "Client Payment - Acme Corp", amount: "$5,000.00", type: "Income" },
    { id: "TRX-003", date: "2023-10-24", description: "Server Hosting", amount: "$150.00", type: "Expense" },
    { id: "TRX-004", date: "2023-10-23", description: "Consulting Services", amount: "$2,500.00", type: "Income" },
];

export function FinanceDashboard() {
    return (
        <div>
            <h1 className="h2 mb-4">Financial Overview</h1>

            <Row className="g-4 mb-4">
                {stats.map((stat) => (
                    <Col key={stat.name} sm={6} lg={3}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="text-muted small">{stat.name}</div>
                                    <div className={`p-2 rounded bg-light text-primary`}>
                                        <stat.icon size={16} />
                                    </div>
                                </div>
                                <div className="h3 mb-1">{stat.value}</div>
                                <div className={`small ${stat.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                                    {stat.change} from last month
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <h5 className="mb-3">Quick Actions</h5>
                            <div className="d-grid gap-2">
                                <a href="/finance/ledger" className="btn btn-outline-primary text-start">
                                    General Ledger
                                </a>
                                <a href="/finance/payable" className="btn btn-outline-primary text-start">
                                    Accounts Payable
                                </a>
                                <a href="/finance/receivable" className="btn btn-outline-primary text-start">
                                    Accounts Receivable
                                </a>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={8}>
                    {/* Placeholder for a chart or more detailed stats */}
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex align-items-center justify-content-center text-muted">
                            Financial Performance Chart (Placeholder)
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-3">
                    <h5 className="mb-0">Recent Transactions</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0">Transaction ID</th>
                                <th className="border-0">Date</th>
                                <th className="border-0">Description</th>
                                <th className="border-0">Amount</th>
                                <th className="border-0">Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.map((trx) => (
                                <tr key={trx.id}>
                                    <td className="fw-medium">{trx.id}</td>
                                    <td className="text-muted">{trx.date}</td>
                                    <td>{trx.description}</td>
                                    <td className="fw-bold">{trx.amount}</td>
                                    <td>
                                        <Badge bg={trx.type === 'Income' ? 'success' : 'danger'} pill>
                                            {trx.type}
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
