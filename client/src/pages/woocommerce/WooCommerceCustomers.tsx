import { useState, useEffect } from "react";
import { Card, Table, Button, Badge, Form, InputGroup, Alert, Spinner } from "react-bootstrap";
import { Search, RefreshCw, User, Mail, Phone } from "lucide-react";
import api from "../../lib/api";

interface WooCommerceCustomer {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
    billing: {
        first_name: string;
        last_name: string;
        company: string;
        address_1: string;
        address_2: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
        email: string;
        phone: string;
    };
    shipping: {
        first_name: string;
        last_name: string;
        company: string;
        address_1: string;
        address_2: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
    };
    is_paying_customer: boolean;
    orders_count: number;
    total_spent: string;
    avatar_url: string;
    date_created: string;
    date_modified: string;
}

export function WooCommerceCustomers() {
    const [customers, setCustomers] = useState<WooCommerceCustomer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchCustomers();
    }, [page]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setError("");
            const search = searchTerm ? `&search=${searchTerm}` : "";
            const response = await api.get(`/woocommerce/customers?page=${page}&per_page=20${search}`);
            setCustomers(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to fetch customers");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchCustomers();
    };

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>WooCommerce Customers</h2>
                <Button variant="primary" onClick={fetchCustomers}>
                    <RefreshCw size={18} className="me-2" />
                    Refresh
                </Button>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search customers by name or email..."
                            className="border-start-0 ps-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button variant="primary" onClick={handleSearch}>Search</Button>
                    </InputGroup>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-2">Loading customers...</p>
                        </div>
                    ) : (
                        <>
                            <Table hover responsive>
                                <thead className="bg-light">
                                    <tr>
                                        <th>Customer</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Location</th>
                                        <th>Orders</th>
                                        <th>Total Spent</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center text-muted py-4">
                                                No customers found
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.map((customer) => (
                                            <tr key={customer.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        {customer.avatar_url ? (
                                                            <img
                                                                src={customer.avatar_url}
                                                                alt={`${customer.first_name} ${customer.last_name}`}
                                                                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                                                            />
                                                        ) : (
                                                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                                <User size={16} className="text-muted" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="fw-medium">
                                                                {customer.first_name || customer.billing?.first_name} {customer.last_name || customer.billing?.last_name}
                                                            </div>
                                                            <small className="text-muted">@{customer.username}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <Mail size={14} className="text-muted" />
                                                        <small>{customer.email || customer.billing?.email}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    {customer.billing?.phone ? (
                                                        <div className="d-flex align-items-center gap-1">
                                                            <Phone size={14} className="text-muted" />
                                                            <small>{customer.billing.phone}</small>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <small>
                                                        {customer.billing?.city && customer.billing?.country
                                                            ? `${customer.billing.city}, ${customer.billing.country}`
                                                            : customer.billing?.country || '-'}
                                                    </small>
                                                </td>
                                                <td>
                                                    <Badge bg="info">{customer.orders_count || 0}</Badge>
                                                </td>
                                                <td>
                                                    <strong>${parseFloat(customer.total_spent || '0').toFixed(2)}</strong>
                                                </td>
                                                <td>
                                                    <Badge bg={customer.is_paying_customer ? "success" : "secondary"}>
                                                        {customer.is_paying_customer ? "Paying" : "Guest"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <Button variant="outline-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
                                    Previous
                                </Button>
                                <span>Page {page}</span>
                                <Button variant="outline-secondary" disabled={customers.length < 20} onClick={() => setPage(page + 1)}>
                                    Next
                                </Button>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
