import { useState, useEffect } from "react";
import { Card, Row, Col, Button, Alert } from "react-bootstrap";
import { Package, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";

export function DarazDashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        pendingOrders: 0,
        revenue: 0,
        performance: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch products count
            const productsRes = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/daraz/products?limit=1`);
            const productsData = await productsRes.json();

            // Fetch pending orders
            const ordersRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/daraz/orders?status=pending`);
            const ordersData = await ordersRes.json();

            setStats({
                totalProducts: productsData.data?.total_products || 0,
                pendingOrders: ordersData.data?.orders?.length || 0,
                revenue: 0, // Would come from finance API
                performance: 95 // Would come from seller performance API
            });
        } catch (err: any) {
            setError(err.message || "Failed to fetch dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { title: "Total Products", value: stats.totalProducts, icon: Package, color: "primary" },
        { title: "Pending Orders", value: stats.pendingOrders, icon: ShoppingCart, color: "warning" },
        { title: "Revenue (PKR)", value: `${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "success" },
        { title: "Performance", value: `${stats.performance}%`, icon: TrendingUp, color: "info" },
    ];

    return (
        <div className="p-4">
            <h2 className="mb-4">Daraz Dashboard</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                    <Row className="g-3 mb-4">
                        {statCards.map((stat, index) => (
                            <Col key={index} md={6} lg={3}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <p className="text-muted small mb-1">{stat.title}</p>
                                                <h3 className="mb-0">{stat.value}</h3>
                                            </div>
                                            <div className={`bg-${stat.color} bg-opacity-10 p-3 rounded`}>
                                                <stat.icon size={24} className={`text-${stat.color}`} />
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <Row className="g-3">
                        <Col md={6}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body>
                                    <h5 className="mb-3">Quick Actions</h5>
                                    <div className="d-grid gap-2">
                                        <Button variant="outline-primary" href="/daraz/products">
                                            Manage Products
                                        </Button>
                                        <Button variant="outline-warning" href="/daraz/orders">
                                            View Orders
                                        </Button>
                                        <Button variant="outline-secondary" href="/daraz/settings">
                                            Settings
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body>
                                    <h5 className="mb-3">Recent Activity</h5>
                                    <p className="text-muted">No recent activity</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
}
