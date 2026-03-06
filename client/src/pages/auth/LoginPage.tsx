import { useState } from 'react';
import { Row, Col, Form, Button, Alert, Spinner, Container } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ChevronLeft, ChevronRight, AlertTriangle, Settings } from 'lucide-react';
import loginChart from '../../assets/login_chart.svg';
import '../../App.css'; // Ensure custom styles are loaded

export function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="vh-100 p-0 overflow-hidden bg-white">
            <Row className="h-100 g-0">
                {/* Left Side - Login Form */}
                <Col md={6} className="d-flex flex-column justify-content-center px-5 position-relative">

                    <div className="mx-auto w-100" style={{ maxWidth: '450px' }}>
                        <div className="mb-5">
                            <div className="d-flex align-items-center gap-2 text-primary fw-bold fs-5 mb-5">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 7H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M3 12H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M3 17H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                                ER Planning
                            </div>
                            <h2 className="fw-bold mb-4 display-6">Login</h2>
                        </div>

                        {error && (
                            <Alert variant="danger" className="d-flex align-items-center gap-2 py-2 fs-6">
                                <AlertTriangle size={16} /> {error}
                            </Alert>
                        )}

                        <Form onSubmit={handleLogin} className="position-relative">
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold text-secondary small">Username</Form.Label>
                                <div className="d-flex align-items-center">
                                    <Form.Control
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="form-control-lg bg-light border-0"
                                        style={{ fontSize: '0.95rem' }}
                                    />
                                    {/* Arrow Button next to input as requested by design quirk, though unusual */}

                                </div>
                            </Form.Group>

                            <Form.Group className="mb-4 position-relative">
                                <Form.Label className="fw-semibold text-secondary small">Password</Form.Label>
                                <div className="position-relative bg-light rounded d-flex align-items-center">
                                    <Form.Control
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="form-control-lg bg-transparent border-0"
                                        style={{ fontSize: '0.95rem', boxShadow: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-link text-muted pe-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="checkbox"
                                    label="Keep me logged in"
                                    id="keep-logged-in"
                                    className="text-muted small"
                                />
                            </Form.Group>

                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100 py-2 fw-semibold mb-4"
                                disabled={loading}
                                style={{ backgroundColor: '#0d6efd', border: 'none' }}
                            >
                                {loading ? (
                                    <>
                                        <Spinner size="sm" animation="border" className="me-2" />
                                        Authenticating...
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </Button>

                            <div className="d-flex justify-content-between align-items-center small text-muted mt-5">
                                <div>
                                    <a href="#" className="text-decoration-none text-muted">Forgot Your Password</a>
                                    {/* <span className="mx-2">|</span> */}
                                    {/* <a href="#" className="text-decoration-none text-muted">Sign up</a> */}
                                </div>
                                <div className="border px-2 py-1 rounded bg-light cursor-pointer d-flex align-items-center gap-1">
                                    Language En <ChevronLeft size={12} className="rotate-270" style={{ transform: 'rotate(-90deg)' }} />
                                </div>
                            </div>
                        </Form>
                    </div>
                </Col>

                {/* Right Side - App Demo Overview */}
                <Col md={6} className="bg-light d-none d-md-flex align-items-center justify-content-center position-relative p-0 text-center">
                    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center p-5">
                        <h5 className="mb-5 text-dark fw-bold fs-4">App demo Overview</h5>

                        <div className="position-relative w-100 d-flex justify-content-center align-items-center mb-4">
                            <button
                                type="button"
                                className="btn btn-light border ms-2 d-flex align-items-center justify-content-center p-0"
                                style={{ width: '40px', height: '40px', flexShrink: 0 }}
                            >
                                <ChevronLeft size={18} className="text-secondary" />
                            </button>
                            <div className="bg-white p-4 rounded-4 shadow-sm mx-auto d-flex align-items-center justify-content-center" style={{ minHeight: '300px', width: '100%', maxWidth: '450px' }}>
                                <img
                                    src={loginChart}
                                    alt="Chart"
                                    className="img-fluid"
                                />
                            </div>

                            {/* Right Arrow - Positioned absolutely to the right of the chart area or column */}
                            <button
                                className="btn btn-light border position-absolute end-0 me-4 shadow-sm d-flex align-items-center justify-content-center p-0"
                                style={{ width: '40px', height: '40px', borderRadius: '4px' }}
                            >
                                <ChevronRight size={20} className="text-secondary" />
                            </button>
                        </div>

                        <h5 className="fw-bold mb-3 fs-5">Sales</h5>
                        <p className="text-muted text-center px-4 lh-base" style={{ maxWidth: '450px', fontSize: '0.9rem' }}>
                            ERP systems can help businesses to manage their sales pipeline, track customer orders, and generate sales reports. This can help businesses to improve their sales performance and to better serve their customers.
                        </p>

                        <div className="d-flex gap-2 mt-4">
                            <div className="rounded-circle bg-secondary opacity-25" style={{ width: '8px', height: '8px' }}></div>
                            <div className="rounded-circle bg-primary" style={{ width: '8px', height: '8px' }}></div>
                            <div className="rounded-circle bg-secondary opacity-25" style={{ width: '8px', height: '8px' }}></div>
                            <div className="rounded-circle bg-secondary opacity-25" style={{ width: '8px', height: '8px' }}></div>
                            <div className="rounded-circle bg-secondary opacity-25" style={{ width: '8px', height: '8px' }}></div>
                        </div>
                    </div>

                    <div className="position-absolute bottom-0 end-0 p-4 text-muted d-flex gap-3">
                        <AlertTriangle size={18} className="cursor-pointer" />
                        <Settings size={18} className="cursor-pointer" />
                    </div>
                </Col>
            </Row>
        </Container>
    );
}
