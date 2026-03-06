import { useEffect, useState } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import { DollarSign, Package, Users, ShoppingCart } from "lucide-react";
import { DashboardCharts } from "../components/dashboard/DashboardCharts";
import { DashboardTables } from "../components/dashboard/DashboardTables";
import { getPOSOrders, getProducts, getUsers } from "../lib/api";

export function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        revenue: 0,
        ordersToday: 0,
        productsCount: 0,
        usersCount: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [orders, products, users] = await Promise.all([
                    getPOSOrders(),
                    getProducts(),
                    getUsers()
                ]);

                // Ensure orders is a valid array
                const validOrders = Array.isArray(orders) ? orders : [];

                let revenue = 0;
                let ordersToday = 0;

                if (validOrders.length > 0) {
                    // Calculate Revenue (Sum of all completed orders)
                    revenue = validOrders
                        .filter(o => o.status === 'COMPLETED')
                        .reduce((sum, o) => sum + o.total_amount, 0);

                    // Calculate Orders Today
                    const today = new Date().toDateString();
                    ordersToday = validOrders.filter(o =>
                        new Date(o.created_at).toDateString() === today
                    ).length;
                }

                setStats({
                    revenue,
                    ordersToday,
                    productsCount: products.length,
                    usersCount: users.length
                });

            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            name: "Total Revenue",
            value: `$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: "text-primary",
            bg: "bg-primary-subtle"
        },
        {
            name: "Orders Today",
            value: stats.ordersToday.toString(),
            icon: ShoppingCart,
            color: "text-success",
            bg: "bg-success-subtle"
        },
        {
            name: "Total Products",
            value: stats.productsCount.toString(),
            icon: Package,
            color: "text-warning",
            bg: "bg-warning-subtle"
        },
        {
            name: "System Users",
            value: stats.usersCount.toString(),
            icon: Users,
            color: "text-info",
            bg: "bg-info-subtle"
        },
    ];

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">Dashboard Overview</h1>
                <span className="text-muted small">Live Data</span>
            </div>

            <Row className="g-4 mb-4">
                {statCards.map((stat) => (
                    <Col key={stat.name} sm={6} lg={3}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body className="d-flex align-items-center">
                                <div className={`rounded-circle p-3 me-3 ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <Card.Text className="text-muted mb-0 small">{stat.name}</Card.Text>
                                    <Card.Title className="h4 mb-0 fw-bold">{stat.value}</Card.Title>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <DashboardCharts />

            <DashboardTables />
        </div>
    );
}
