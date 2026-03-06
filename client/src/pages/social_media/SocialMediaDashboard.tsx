import { useState, useEffect } from "react";
import { Card, Row, Col, Button, Alert } from "react-bootstrap";
import { MessageCircle, TrendingUp, Users, Facebook, Instagram, MessageSquare } from "lucide-react";

export function SocialMediaDashboard() {
    const [stats, setStats] = useState({
        totalMessages: 0,
        pendingMessages: 0,
        activeCampaigns: 0,
        totalReach: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch messages
            const messagesRes = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/social-media/messages`);
            const messagesData = await messagesRes.json();

            // Fetch campaigns
            const campaignsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/social-media/campaigns`);
            const campaignsData = await campaignsRes.json();

            setStats({
                totalMessages: messagesData.data?.length || 0,
                pendingMessages: messagesData.data?.filter((m: any) => !m.is_read)?.length || 0,
                activeCampaigns: campaignsData.data?.filter((c: any) => c.status === "ACTIVE")?.length || 0,
                totalReach: 0 // Would calculate from campaign insights
            });
        } catch (err: any) {
            setError(err.message || "Failed to fetch dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { title: "Total Messages", value: stats.totalMessages, icon: MessageCircle, color: "primary" },
        { title: "Pending Replies", value: stats.pendingMessages, icon: MessageSquare, color: "warning" },
        { title: "Active Campaigns", value: stats.activeCampaigns, icon: TrendingUp, color: "success" },
        { title: "Total Reach", value: stats.totalReach.toLocaleString(), icon: Users, color: "info" },
    ];

    const platforms = [
        { name: "Facebook", icon: Facebook, color: "#1877F2", connected: true },
        { name: "Instagram", icon: Instagram, color: "#E4405F", connected: true },
        { name: "WhatsApp", icon: MessageSquare, color: "#25D366", connected: true },
    ];

    return (
        <div className="p-4">
            <h2 className="mb-4">Social Media Dashboard</h2>

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

                    <Row className="g-3 mb-4">
                        <Col md={8}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body>
                                    <h5 className="mb-3">Platform Status</h5>
                                    <Row className="g-3">
                                        {platforms.map((platform, index) => (
                                            <Col key={index} md={4}>
                                                <div className="d-flex align-items-center p-3 border rounded">
                                                    <platform.icon size={32} style={{ color: platform.color }} className="me-3" />
                                                    <div>
                                                        <div className="fw-medium">{platform.name}</div>
                                                        <small className={`text-${platform.connected ? 'success' : 'danger'}`}>
                                                            {platform.connected ? 'Connected' : 'Disconnected'}
                                                        </small>
                                                    </div>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body>
                                    <h5 className="mb-3">Quick Actions</h5>
                                    <div className="d-grid gap-2">
                                        <Button variant="outline-primary" href="/social-media/inbox">
                                            View Messages
                                        </Button>
                                        <Button variant="outline-success" href="/social-media/campaigns">
                                            Manage Campaigns
                                        </Button>
                                        <Button variant="outline-secondary" href="/social-media/settings">
                                            Settings
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
}
