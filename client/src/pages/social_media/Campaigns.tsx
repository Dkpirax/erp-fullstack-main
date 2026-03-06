import { useState, useEffect } from "react";
import { Card, Table, Button, Badge, Row, Col, Alert } from "react-bootstrap";
import { RefreshCw, Eye } from "lucide-react";

export function Campaigns() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/social-media/campaigns`);
            const data = await response.json();
            setCampaigns(data.data || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch campaigns");
        } finally {
            setLoading(false);
        }
    };

    const viewInsights = async (campaignId: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/social-media/campaigns/${campaignId}/insights`);
            const data = await response.json();
            setSelectedCampaign(data.data?.[0]);
        } catch (err: any) {
            setError(err.message || "Failed to fetch insights");
        }
    };

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Campaigns</h2>
                <Button variant="primary" onClick={fetchCampaigns}>
                    <RefreshCw size={18} className="me-2" />
                    Refresh
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {selectedCampaign && (
                <Card className="border-0 shadow-sm mb-3">
                    <Card.Body>
                        <h5>Campaign Insights</h5>
                        <Row>
                            <Col md={3}><strong>Impressions:</strong> {selectedCampaign.impressions}</Col>
                            <Col md={3}><strong>Reach:</strong> {selectedCampaign.reach}</Col>
                            <Col md={3}><strong>Clicks:</strong> {selectedCampaign.clicks}</Col>
                            <Col md={3}><strong>Spend:</strong> ${selectedCampaign.spend}</Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" />
                        </div>
                    ) : (
                        <Table hover responsive>
                            <thead className="bg-light">
                                <tr>
                                    <th>Campaign Name</th>
                                    <th>Objective</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center text-muted py-4">
                                            No campaigns found
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.map((campaign) => (
                                        <tr key={campaign.id}>
                                            <td className="fw-medium">{campaign.name}</td>
                                            <td>{campaign.objective}</td>
                                            <td>
                                                <Badge bg={campaign.status === "ACTIVE" ? "success" : "secondary"}>
                                                    {campaign.status}
                                                </Badge>
                                            </td>
                                            <td className="text-muted small">{new Date(campaign.created_time).toLocaleDateString()}</td>
                                            <td>
                                                <Button
                                                    variant="link"
                                                    className="text-primary p-0"
                                                    onClick={() => viewInsights(campaign.id)}
                                                >
                                                    <Eye size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
