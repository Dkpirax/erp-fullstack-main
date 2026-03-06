import { useState } from "react";
import { Card, Row, Col, Button, Form, InputGroup } from "react-bootstrap";
import { Lock, Unlock, DollarSign, Clock } from "lucide-react";

export function SessionManagement() {
    const [isSessionOpen, setIsSessionOpen] = useState(true);
    const [openingCash, setOpeningCash] = useState(200.00);
    const [closingCash, setClosingCash] = useState(0.00);

    return (
        <div className="d-flex justify-content-center">
            <div style={{ maxWidth: '600px', width: '100%' }}>
                <h1 className="h2 mb-4 text-center">Session Management</h1>

                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="mb-1">Current Session Status</h5>
                                <div className="text-muted small">Manage your daily register shift</div>
                            </div>
                            <span className={`badge rounded-pill px-3 py-2 ${isSessionOpen ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                {isSessionOpen ? 'OPEN' : 'CLOSED'}
                            </span>
                        </div>

                        {isSessionOpen ? (
                            <div className="d-grid gap-4">
                                <Row className="g-3">
                                    <Col xs={6}>
                                        <div className="p-3 bg-light rounded">
                                            <div className="text-muted small mb-1">Session Started</div>
                                            <div className="d-flex align-items-center fw-medium">
                                                <Clock size={16} className="me-2 text-muted" />
                                                Today, 09:00 AM
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="p-3 bg-light rounded">
                                            <div className="text-muted small mb-1">Opening Cash</div>
                                            <div className="d-flex align-items-center fw-medium">
                                                <DollarSign size={16} className="me-2 text-muted" />
                                                {openingCash.toFixed(2)}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <div className="border-top pt-4">
                                    <Form.Label className="fw-medium">Closing Cash Amount</Form.Label>
                                    <InputGroup className="mb-3">
                                        <InputGroup.Text className="bg-white">
                                            <DollarSign size={16} className="text-muted" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            value={closingCash}
                                            onChange={(e) => setClosingCash(parseFloat(e.target.value))}
                                        />
                                    </InputGroup>
                                </div>

                                <Button
                                    variant="danger"
                                    size="lg"
                                    className="d-flex align-items-center justify-content-center"
                                    onClick={() => setIsSessionOpen(false)}
                                >
                                    <Lock size={18} className="me-2" />
                                    Close Session
                                </Button>
                            </div>
                        ) : (
                            <div className="d-grid gap-4">
                                <div>
                                    <Form.Label className="fw-medium">Opening Cash Amount</Form.Label>
                                    <InputGroup className="mb-3">
                                        <InputGroup.Text className="bg-white">
                                            <DollarSign size={16} className="text-muted" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            value={openingCash}
                                            onChange={(e) => setOpeningCash(parseFloat(e.target.value))}
                                        />
                                    </InputGroup>
                                </div>

                                <Button
                                    variant="success"
                                    size="lg"
                                    className="d-flex align-items-center justify-content-center"
                                    onClick={() => setIsSessionOpen(true)}
                                >
                                    <Unlock size={18} className="me-2" />
                                    Open New Session
                                </Button>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
}
