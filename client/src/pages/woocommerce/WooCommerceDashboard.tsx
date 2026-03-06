import { useState, useEffect } from "react";
import { Card, Row, Col, Button, Alert } from "react-bootstrap";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";

export function WooCommerceDashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        totalCustomers: 0,
        salesTotal: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("access_token");

            console.log("Fetching WooCommerce dashboard data...");
            console.log("Token exists:", !!token);

            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/woocommerce/reports/totals`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                throw new Error(`Failed to fetch data: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log("Received data:", data);

            setStats({
                totalProducts: data.products?.find((p: any) => p.slug === "all")?.total || 0,
                totalOrders: data.orders?.reduce((sum: number, o: any) => sum + parseInt(o.total), 0) || 0,
                totalCustomers: data.customers?.find((c: any) => c.slug === "all")?.total || 0,
                salesTotal: 0
            });
        } catch (err: any) {
            console.error("Dashboard fetch error:", err);
            setError(err.message || "Failed to fetch dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { title: "Total Products", value: stats.totalProducts, icon: Package, color: "primary" },
        { title: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "success" },
        { title: "Total Customers", value: stats.totalCustomers, icon: Users, color: "info" },
        { title: "Sales", value: `$${stats.salesTotal}`, icon: TrendingUp, color: "warning" },
    ];

    return (
        <div className="p-4">
            <h2 className="mb-4">WooCommerce Dashboard</h2>

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
                                        <Button variant="outline-primary" href="/woocommerce/products">
                                            Manage Products
                                        </Button>
                                        <Button variant="outline-success" href="/woocommerce/orders">
                                            View Orders
                                        </Button>
                                        <Button variant="outline-info" href="/woocommerce/customers">
                                            View Customers
                                        </Button>
                                        <Button variant="outline-secondary" href="/woocommerce/settings">
                                            Settings
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body>
                                    <h5 className="mb-3">Store Information</h5>
                                    <p className="text-muted">Connected to WooCommerce store</p>
                                    <small className="text-success">● Online</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
}
