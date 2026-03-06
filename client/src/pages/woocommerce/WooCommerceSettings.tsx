import { useState, useEffect } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Save, CheckCircle, XCircle } from "lucide-react";
import api from "../../lib/api";

interface WooCommerceSettingsData {
    id?: number;
    store_url: string;
    consumer_key: string;
    consumer_secret: string;
    is_active?: boolean;
}

export function WooCommerceSettings() {
    const [settings, setSettings] = useState<WooCommerceSettingsData>({
        store_url: "",
        consumer_key: "",
        consumer_secret: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load settings from backend on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get<WooCommerceSettingsData>('/woocommerce/settings');
            setSettings(response.data);
            setError(null);
        } catch (err: any) {
            if (err.response?.status !== 404) {
                setError("Failed to load settings");
            }
            // 404 is okay - means no settings configured yet
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            console.log(settings, "settings");
            await api.put('/woocommerce/settings', settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const testConnection = async () => {
        try {
            await api.get("/woocommerce/products?per_page=1");
            setConnected(true);
        } catch {
            setConnected(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 text-center">
                <Spinner animation="border" />
                <p className="mt-2">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="mb-4">WooCommerce Settings</h2>

            {saved && <Alert variant="success">Settings saved successfully!</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        {connected ? (
                            <>
                                <CheckCircle size={20} className="text-success" />
                                <span className="text-success">Connected</span>
                            </>
                        ) : (
                            <>
                                <XCircle size={20} className="text-danger" />
                                <span className="text-danger">Not Connected</span>
                            </>
                        )}
                        <Button variant="outline-primary" size="sm" className="ms-auto" onClick={testConnection}>
                            Test Connection
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <h5 className="mb-3">API Configuration</h5>
                    <Alert variant="info">
                        <strong>Note:</strong> These settings are saved securely in the database and will be used for all WooCommerce API requests.
                    </Alert>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Store URL</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="https://your-store.com"
                                value={settings.store_url}
                                onChange={(e) => setSettings({ ...settings, store_url: e.target.value })}
                            />
                            <Form.Text className="text-muted">
                                Your WooCommerce store URL
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Consumer Key</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="ck_..."
                                value={settings.consumer_key}
                                onChange={(e) => setSettings({ ...settings, consumer_key: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Consumer Secret</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="cs_..."
                                value={settings.consumer_secret}
                                onChange={(e) => setSettings({ ...settings, consumer_secret: e.target.value })}
                            />
                        </Form.Group>

                        <Button
                            variant="primary"
                            onClick={handleSave}
                            className="d-flex align-items-center gap-2"
                            disabled={saving}
                        >
                            <Save size={18} />
                            {saving ? "Saving..." : "Save Settings"}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <h5 className="mb-3">How to Get API Credentials</h5>
                    <ol>
                        <li>Go to your WooCommerce store admin panel</li>
                        <li>Navigate to <strong>WooCommerce → Settings → Advanced → REST API</strong></li>
                        <li>Click <strong>Add Key</strong></li>
                        <li>Enter a description and select <strong>Read/Write</strong> permissions</li>
                        <li>Click <strong>Generate API Key</strong></li>
                        <li>Copy the Consumer Key and Consumer Secret</li>
                        <li>Add them to your backend <code>.env</code> file</li>
                    </ol>
                </Card.Body>
            </Card>
        </div>
    );
}
