import { Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div>
            <h1 className="h2 mb-4">My Profile</h1>
            <Row>
                <Col md={8} lg={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center mb-4">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
                                    {(user.full_name || user.username).charAt(0)}
                                </div>
                                <div>
                                    <h2 className="h4 mb-1">{user.full_name || user.username}</h2>
                                    <Badge bg="primary" className="fw-normal">{user.is_superuser ? 'Admin' : 'User'}</Badge>
                                </div>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                <div className="d-flex align-items-center text-muted">
                                    <Mail size={18} className="me-3" />
                                    <span>{user.email}</span>
                                </div>
                                <div className="d-flex align-items-center text-muted">
                                    <Shield size={18} className="me-3" />
                                    <span>Role: {user.is_superuser ? 'Admin' : 'User'}</span>
                                </div>
                                <div className="d-flex align-items-center text-muted">
                                    <User size={18} className="me-3" />
                                    <span>User ID: {user.id}</span>
                                </div>
                                <div className="d-flex align-items-center text-muted">
                                    <Calendar size={18} className="me-3" />
                                    <span>Joined: November 2023</span>
                                </div>
                            </div>

                            <hr className="my-4" />

                            <Button variant="outline-primary">Edit Profile</Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
