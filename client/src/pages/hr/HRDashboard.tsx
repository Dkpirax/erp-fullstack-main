import { Card, Row, Col, Table, Badge } from "react-bootstrap";
import { Users, UserPlus, UserMinus, DollarSign } from "lucide-react";

const stats = [
    { name: "Total Employees", value: "48", change: "+2 this month", icon: Users, color: "primary" },
    { name: "New Hires", value: "3", change: "Last 30 days", icon: UserPlus, color: "success" },
    { name: "Turnover Rate", value: "2.1%", change: "-0.5% vs last month", icon: UserMinus, color: "danger" },
    { name: "Upcoming Payroll", value: "$142,500", change: "Due in 5 days", icon: DollarSign, color: "info" },
];

const upcomingLeaves = [
    { id: 1, employee: "Sarah Johnson", type: "Annual Leave", dates: "Oct 28 - Nov 3", status: "Approved" },
    { id: 2, employee: "Michael Chen", type: "Sick Leave", dates: "Oct 26", status: "Pending" },
    { id: 3, employee: "Emily Davis", type: "Remote Work", dates: "Oct 27 - Oct 28", status: "Approved" },
];

export function HRDashboard() {
    return (
        <div>
            <h1 className="h2 mb-4">HR Dashboard</h1>

            <Row className="g-4 mb-4">
                {stats.map((stat) => (
                    <Col key={stat.name} sm={6} lg={3}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="text-muted small">{stat.name}</div>
                                    <div className={`p-2 rounded bg-${stat.color}-subtle text-${stat.color}`}>
                                        <stat.icon size={16} />
                                    </div>
                                </div>
                                <div className="h3 mb-1">{stat.value}</div>
                                <div className="small text-muted">{stat.change}</div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-4">
                <Col lg={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0">Department Distribution</h5>
                        </Card.Header>
                        <Card.Body className="d-flex align-items-center justify-content-center">
                            <div className="text-center text-muted py-5">
                                Chart Placeholder (Recharts/Chart.js)
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0">Upcoming Leaves</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="border-0">Employee</th>
                                        <th className="border-0">Type</th>
                                        <th className="border-0">Dates</th>
                                        <th className="border-0">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {upcomingLeaves.map((leave) => (
                                        <tr key={leave.id}>
                                            <td className="fw-medium">{leave.employee}</td>
                                            <td>{leave.type}</td>
                                            <td className="text-muted small">{leave.dates}</td>
                                            <td>
                                                <Badge bg={leave.status === 'Approved' ? 'success' : 'warning'}>
                                                    {leave.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
