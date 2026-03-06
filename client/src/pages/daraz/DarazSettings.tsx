import { useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { Save } from "lucide-react";

export function DarazSettings() {
    const [settings, setSettings] = useState({
        appKey: "",
        appSecret: "",
        apiUrl: "https://api.daraz.pk/rest"
    });
    const [syncSettings, setSyncSettings] = useState({
        autoSync: false,
        syncInterval: 60, // minutes
        orderNotifications: false,
        inventorySync: false
    });
    const [saved, setSaved] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);

    // Load settings from localStorage
    useState(() => {
        const savedSettings = localStorage.getItem("daraz_settings");
        const savedSyncSettings = localStorage.getItem("daraz_sync_settings");
        if (savedSettings) setSettings(JSON.parse(savedSettings));
        if (savedSyncSettings) setSyncSettings(JSON.parse(savedSyncSettings));
    });

    const handleSave = () => {
        localStorage.setItem("daraz_settings", JSON.stringify(settings));
        localStorage.setItem("daraz_sync_settings", JSON.stringify(syncSettings));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);

        // Start auto-sync if enabled
        if (syncSettings.autoSync) {
            startAutoSync();
        }
    };

    const startAutoSync = () => {
        // Trigger sync
        syncProducts();

        // Set up interval
        const intervalMs = syncSettings.syncInterval * 60 * 1000;
        const intervalId = setInterval(() => {
            syncProducts();
        }, intervalMs);

        // Store interval ID to clear later
        localStorage.setItem("daraz_sync_interval", intervalId.toString());
    };

    const syncProducts = async () => {
        try {
            // Call backend to sync products
            await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/daraz/products`);
            setLastSync(new Date());
            localStorage.setItem("daraz_last_sync", new Date().toISOString());
        } catch (error) {
            console.error("Sync failed:", error);
        }
    };

    const handleSyncNow = () => {
        syncProducts();
    };

    return (
        <div className="p-4">
            <h2 className="mb-4">Daraz Settings</h2>

            {saved && <Alert variant="success">Settings saved successfully!</Alert>}

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <h5 className="mb-3">API Configuration</h5>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>App Key</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter your Daraz App Key"
                                value={settings.appKey}
                                onChange={(e) => setSettings({ ...settings, appKey: e.target.value })}
                            />
                            <Form.Text className="text-muted">
                                Get your App Key from Daraz Seller Center
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>App Secret</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter your Daraz App Secret"
                                value={settings.appSecret}
                                onChange={(e) => setSettings({ ...settings, appSecret: e.target.value })}
                            />
                            <Form.Text className="text-muted">
                                Keep your App Secret secure
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>API URL</Form.Label>
                            <Form.Control
                                type="text"
                                value={settings.apiUrl}
                                onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                            />
                            <Form.Text className="text-muted">
                                Default: https://api.daraz.pk/rest
                            </Form.Text>
                        </Form.Group>

                        <Button variant="primary" onClick={handleSave}>
                            <Save size={18} className="me-2" />
                            Save Settings
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm mt-3">
                <Card.Body>
                    <h5 className="mb-3">Sync Preferences</h5>
                    {lastSync && (
                        <Alert variant="info" className="mb-3">
                            Last synced: {lastSync.toLocaleString()}
                        </Alert>
                    )}
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="auto-sync"
                                label="Enable auto-sync products"
                                checked={syncSettings.autoSync}
                                onChange={(e) => setSyncSettings({ ...syncSettings, autoSync: e.target.checked })}
                            />
                            <Form.Text className="text-muted">
                                Automatically sync products with Daraz at regular intervals
                            </Form.Text>
                        </Form.Group>

                        {syncSettings.autoSync && (
                            <Form.Group className="mb-3">
                                <Form.Label>Sync Interval (minutes)</Form.Label>
                                <Form.Select
                                    value={syncSettings.syncInterval}
                                    onChange={(e) => setSyncSettings({ ...syncSettings, syncInterval: parseInt(e.target.value) })}
                                >
                                    <option value="15">Every 15 minutes</option>
                                    <option value="30">Every 30 minutes</option>
                                    <option value="60">Every hour</option>
                                    <option value="180">Every 3 hours</option>
                                    <option value="360">Every 6 hours</option>
                                    <option value="1440">Daily</option>
                                </Form.Select>
                            </Form.Group>
                        )}

                        <Form.Check
                            type="switch"
                            id="order-notifications"
                            label="Enable order notifications"
                            className="mb-2"
                            checked={syncSettings.orderNotifications}
                            onChange={(e) => setSyncSettings({ ...syncSettings, orderNotifications: e.target.checked })}
                        />
                        <Form.Check
                            type="switch"
                            id="inventory-sync"
                            label="Sync inventory with Daraz"
                            checked={syncSettings.inventorySync}
                            onChange={(e) => setSyncSettings({ ...syncSettings, inventorySync: e.target.checked })}
                        />

                        <Button variant="outline-primary" className="mt-3" onClick={handleSyncNow}>
                            Sync Now
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
