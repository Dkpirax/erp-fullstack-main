import { useState } from "react";
import { Card, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { Save, CheckCircle, XCircle } from "lucide-react";

export function SocialMediaSettings() {
    const [settings, setSettings] = useState({
        facebookPageId: "",
        facebookAccessToken: "",
        instagramAccountId: "",
        whatsappPhoneNumberId: "0719195591",
        whatsappAccessToken: "EAAIfMg1iTR4BQCTvHw2ObjGXgnp69UF5z8CZC8JgvgG0oMB9JRRpndgCMFZCYvTfuGiHv3TNpyM0ataHVFPTDltQhd5AuPiH3WZB9ZCwj9NBqytIRAUYPZAzGsZCxRaNfstFhjK669Phk7VDcM8mYUUDRj3pMA3AavYO24W8bKD98Sud5MHgS7zA1as5BKqKZBULSwgbnMdpFBNNO3i0kftQ4Jst3zErjC5AQV10h6EDUUDBejJLZAXZC7KRhKy4VRu73O1ISZCp04XtdatgJRMAbliJRptKxilLLNmRZAm6AZDZD",
        webhookVerifyToken: "",
        webhookBaseUrl: `${import.meta.env.VITE_API_URL || ''}`
    });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        localStorage.setItem("social_media_settings", JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const connectionStatus = [
        { platform: "Facebook", connected: !!settings.facebookAccessToken },
        { platform: "Instagram", connected: !!settings.instagramAccountId },
        { platform: "WhatsApp", connected: !!settings.whatsappAccessToken },
    ];

    return (
        <div className="p-4">
            <h2 className="mb-4">Social Media Settings</h2>

            {saved && <Alert variant="success">Settings saved successfully!</Alert>}

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <h5 className="mb-3">Connection Status</h5>
                    <Row>
                        {connectionStatus.map((status, idx) => (
                            <Col key={idx} md={4}>
                                <div className="d-flex align-items-center gap-2 p-2 border rounded">
                                    {status.connected ? (
                                        <CheckCircle size={20} className="text-success" />
                                    ) : (
                                        <XCircle size={20} className="text-danger" />
                                    )}
                                    <span>{status.platform}</span>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <h5 className="mb-3">Facebook/Instagram Configuration</h5>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Facebook Page ID</Form.Label>
                            <Form.Control
                                type="text"
                                value={settings.facebookPageId}
                                onChange={(e) => setSettings({ ...settings, facebookPageId: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Facebook Page Access Token</Form.Label>
                            <Form.Control
                                type="password"
                                value={settings.facebookAccessToken}
                                onChange={(e) => setSettings({ ...settings, facebookAccessToken: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Instagram Account ID</Form.Label>
                            <Form.Control
                                type="text"
                                value={settings.instagramAccountId}
                                onChange={(e) => setSettings({ ...settings, instagramAccountId: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <h5 className="mb-3">WhatsApp Business Configuration</h5>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Phone Number ID</Form.Label>
                            <Form.Control
                                type="text"
                                value={settings.whatsappPhoneNumberId}
                                onChange={(e) => setSettings({ ...settings, whatsappPhoneNumberId: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>WhatsApp Access Token</Form.Label>
                            <Form.Control
                                type="password"
                                value={settings.whatsappAccessToken}
                                onChange={(e) => setSettings({ ...settings, whatsappAccessToken: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <h5 className="mb-3">Webhook Configuration</h5>
                    <Alert variant="info">
                        <strong>Local Development:</strong> Webhooks work on your local server. For production, update the base URL to your server's public URL.
                    </Alert>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Webhook Verify Token</Form.Label>
                            <Form.Control
                                type="text"
                                value={settings.webhookVerifyToken}
                                onChange={(e) => setSettings({ ...settings, webhookVerifyToken: e.target.value })}
                            />
                            <Form.Text className="text-muted">
                                Use this token when configuring webhooks in Facebook/WhatsApp developer console
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Webhook Base URL</Form.Label>
                            <Form.Control
                                type="text"
                                value={settings.webhookBaseUrl}
                                onChange={(e) => setSettings({ ...settings, webhookBaseUrl: e.target.value })}
                            />
                            <Form.Text className="text-muted">
                                Facebook Webhook: {settings.webhookBaseUrl}/api/v1/social-media/webhooks/facebook<br />
                                WhatsApp Webhook: {settings.webhookBaseUrl}/api/v1/social-media/webhooks/whatsapp
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Card.Body>
            </Card>

            <Button variant="primary" onClick={handleSave}>
                <Save size={18} className="me-2" />
                Save Settings
            </Button>
        </div>
    );
}
