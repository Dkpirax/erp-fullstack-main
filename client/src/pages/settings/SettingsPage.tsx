import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { Bell, Moon, Lock } from 'lucide-react';

export function SettingsPage() {
    return (
        <div>
            <h1 className="h2 mb-4">Settings</h1>
            <Row>
                <Col md={8}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0 d-flex align-items-center">
                                <Bell size={20} className="me-2" />
                                Notifications
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Form.Check
                                    type="switch"
                                    id="email-notifs"
                                    label="Email Notifications"
                                    defaultChecked
                                    className="mb-3"
                                />
                                <Form.Check
                                    type="switch"
                                    id="push-notifs"
                                    label="Push Notifications"
                                    defaultChecked
                                    className="mb-3"
                                />
                                <Form.Check
                                    type="switch"
                                    id="marketing-emails"
                                    label="Marketing Emails"
                                />
                            </Form>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0 d-flex align-items-center">
                                <Moon size={20} className="me-2" />
                                Appearance
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Theme</Form.Label>
                                    <Form.Select defaultValue="light">
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="system">System Default</option>
                                    </Form.Select>
                                </Form.Group>
                            </Form>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0 d-flex align-items-center">
                                <Lock size={20} className="me-2" />
                                Security
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Button variant="outline-danger">Change Password</Button>
                        </Card.Body>
                    </Card>

                    <div className="d-flex justify-content-end">
                        <Button variant="primary">Save Changes</Button>
                    </div>
                </Col>
            </Row>
        </div>
    );
}
