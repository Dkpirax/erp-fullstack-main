import { Card, Row, Col, ProgressBar } from "react-bootstrap";
import { Users, Target, Phone, Mail } from "lucide-react";

const stats = [
    { name: "Total Customers", value: "1,203", change: "+45 this month", icon: Users, color: "primary" },
    { name: "Active Leads", value: "86", change: "12 new today", icon: Target, color: "warning" },
    { name: "Calls Made", value: "142", change: "This week", icon: Phone, color: "info" },
    { name: "Emails Sent", value: "1,890", change: "This week", icon: Mail, color: "success" },
];

const pipelineStages = [
    { name: "New Lead", count: 24, value: "$120,000", color: "info", percent: 100 },
    { name: "Qualified", count: 18, value: "$240,000", color: "primary", percent: 75 },
    { name: "Proposal", count: 12, value: "$360,000", color: "warning", percent: 50 },
    { name: "Negotiation", count: 8, value: "$180,000", color: "danger", percent: 30 },
    { name: "Closed Won", count: 24, value: "$540,000", color: "success", percent: 100 },
];

export function CRMDashboard() {
    return (
        <div>
            <h1 className="h2 mb-4">CRM Dashboard</h1>

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
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0">Sales Pipeline</h5>
                        </Card.Header>
                        <Card.Body>
                            {pipelineStages.map((stage) => (
                                <div key={stage.name} className="mb-4 last:mb-0">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="fw-medium">{stage.name}</span>
                                        <span className="text-muted">{stage.count} deals ({stage.value})</span>
                                    </div>
                                    <ProgressBar now={stage.percent} variant={stage.color} style={{ height: 10 }} />
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0">Recent Activity</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex gap-3 mb-3">
                                <div className="bg-primary-subtle text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                    <Phone size={14} />
                                </div>
                                <div>
                                    <p className="mb-0 small fw-bold">Call with Acme Corp</p>
                                    <p className="mb-0 small text-muted">Discussed Q4 requirements</p>
                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>2 hours ago</small>
                                </div>
                            </div>
                            <div className="d-flex gap-3 mb-3">
                                <div className="bg-success-subtle text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                    <Mail size={14} />
                                </div>
                                <div>
                                    <p className="mb-0 small fw-bold">Email to John Doe</p>
                                    <p className="mb-0 small text-muted">Sent proposal v2</p>
                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>5 hours ago</small>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
