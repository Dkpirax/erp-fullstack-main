import { useState } from "react";
import { Card, Row, Col, Button, Table, Badge, Form, InputGroup, Tabs, Tab } from "react-bootstrap";
import { Plus, Edit2, Trash2, Gift, Award, Save } from "lucide-react";
import { GenericModal } from "../../components/common/GenericModal";
import { useCoupons, type Coupon } from "../../hooks/useCoupons";
import { useLoyaltySettings } from "../../hooks/useLoyaltySettings";

export function LoyaltyAndCoupons() {
    const { coupons, addCoupon, updateCoupon, deleteCoupon } = useCoupons();
    const { settings, updateSettings } = useLoyaltySettings();

    const [showCouponModal, setShowCouponModal] = useState(false);
    const [editingCouponId, setEditingCouponId] = useState<number | null>(null);

    const [couponForm, setCouponForm] = useState<Omit<Coupon, "id">>({
        code: "",
        value: 0,
        type: "percentage",
        expiryDate: "",
        description: "",
        minPurchase: 0,
        isActive: true
    });

    const handleOpenAddCoupon = () => {
        setEditingCouponId(null);
        setCouponForm({
            code: "",
            value: 0,
            type: "percentage",
            expiryDate: "",
            description: "",
            minPurchase: 0,
            isActive: true
        });
        setShowCouponModal(true);
    };

    const handleOpenEditCoupon = (coupon: Coupon) => {
        setEditingCouponId(coupon.id);
        setCouponForm({
            code: coupon.code,
            value: coupon.value,
            type: coupon.type,
            expiryDate: coupon.expiryDate || "",
            description: coupon.description || "",
            minPurchase: coupon.minPurchase,
            isActive: coupon.isActive
        });
        setShowCouponModal(true);
    };

    const handleConfirmCoupon = () => {
        if (editingCouponId) {
            updateCoupon(editingCouponId, couponForm);
        } else {
            addCoupon(couponForm);
        }
        setShowCouponModal(false);
    };

    return (
        <div className="p-4">
            <h2 className="mb-4">Loyalty & Coupons Management</h2>

            <Tabs defaultActiveKey="coupons" className="mb-3">
                {/* Coupons Tab */}
                <Tab eventKey="coupons" title={<span><Gift size={16} className="me-2" />Coupons</span>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">Manage Coupons</h5>
                                <Button variant="primary" onClick={handleOpenAddCoupon}>
                                    <Plus size={18} className="me-2" />
                                    Add Coupon
                                </Button>
                            </div>

                            <Table hover responsive>
                                <thead className="bg-light">
                                    <tr>
                                        <th>Code</th>
                                        <th>Discount</th>
                                        <th>Type</th>
                                        <th>Expiry</th>
                                        <th>Description</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.map(coupon => (
                                        <tr key={coupon.id}>
                                            <td className="fw-bold">{coupon.code}</td>
                                            <td>
                                                {coupon.type === "percentage"
                                                    ? `${(coupon.value * 100).toFixed(0)}%`
                                                    : `$${coupon.value.toFixed(2)}`}
                                            </td>
                                            <td>
                                                <Badge bg={coupon.type === "percentage" ? "info" : "success"}>
                                                    {coupon.type === "percentage" ? "Percentage" : "Fixed"}
                                                </Badge>
                                            </td>
                                            <td>{coupon.expiryDate}</td>
                                            <td className="text-muted small">{coupon.description || "-"}</td>
                                            <td>
                                                <Button
                                                    variant="link"
                                                    className="text-primary p-0 me-2"
                                                    onClick={() => handleOpenEditCoupon(coupon)}
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    className="text-danger p-0"
                                                    onClick={() => deleteCoupon(coupon.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* Loyalty Settings Tab */}
                <Tab eventKey="loyalty" title={<span><Award size={16} className="me-2" />Loyalty Settings</span>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h5 className="mb-4">Loyalty Program Configuration</h5>

                            <Form>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Points Earned Per Dollar Spent</Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    type="number"
                                                    step="0.1"
                                                    value={settings.pointsPerDollar}
                                                    onChange={(e) => updateSettings({ ...settings, pointsPerDollar: parseFloat(e.target.value) || 0 })}
                                                />
                                                <InputGroup.Text>points/$</InputGroup.Text>
                                            </InputGroup>
                                            <Form.Text className="text-muted">
                                                How many points customers earn for each dollar spent
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Dollar Value Per Point</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text>$</InputGroup.Text>
                                                <Form.Control
                                                    type="number"
                                                    step="0.01"
                                                    value={settings.redemptionRate}
                                                    onChange={(e) => updateSettings({ ...settings, redemptionRate: parseFloat(e.target.value) || 0 })}
                                                />
                                                <InputGroup.Text>/point</InputGroup.Text>
                                            </InputGroup>
                                            <Form.Text className="text-muted">
                                                How much each point is worth when redeemed
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Minimum Spending per Order</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text>$</InputGroup.Text>
                                                <Form.Control
                                                    type="number"
                                                    step="1"
                                                    value={settings.minSpending || 0}
                                                    onChange={(e) => updateSettings({ ...settings, minSpending: parseFloat(e.target.value) || 0 })}
                                                />
                                            </InputGroup>
                                            <Form.Text className="text-muted">
                                                Minimum order amount required to earn points
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="switch"
                                        id="loyalty-enabled"
                                        label="Enable Loyalty Program"
                                        checked={settings.isEnabled}
                                        onChange={(e) => updateSettings({ ...settings, isEnabled: e.target.checked })}
                                    />
                                </Form.Group>

                                <div className="alert alert-info">
                                    <strong>Example:</strong> With current settings, a customer spending $100 will earn{" "}
                                    <strong>{(100 * settings.pointsPerDollar).toFixed(0)} points</strong>, worth{" "}
                                    <strong>${(100 * settings.pointsPerDollar * settings.redemptionRate).toFixed(2)}</strong> in discounts.
                                </div>

                                <Button variant="success">
                                    <Save size={16} className="me-2" />
                                    Settings Auto-Saved
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* Coupon Modal */}
            <GenericModal
                show={showCouponModal}
                onHide={() => setShowCouponModal(false)}
                title={editingCouponId ? "Edit Coupon" : "Add New Coupon"}
                onConfirm={handleConfirmCoupon}
                confirmText={editingCouponId ? "Save Changes" : "Add Coupon"}
            >
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Coupon Code</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g., SAVE10"
                            value={couponForm.code}
                            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Discount Type</Form.Label>
                                <Form.Select
                                    value={couponForm.type}
                                    onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as "percentage" | "fixed" })}
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed Amount</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Discount Value</Form.Label>
                                <InputGroup>
                                    {couponForm.type === "fixed" && <InputGroup.Text>$</InputGroup.Text>}
                                    <Form.Control
                                        type="number"
                                        step={couponForm.type === "percentage" ? "0.01" : "1"}
                                        value={couponForm.value}
                                        onChange={(e) => setCouponForm({ ...couponForm, value: parseFloat(e.target.value) || 0 })}
                                    />
                                    {couponForm.type === "percentage" && <InputGroup.Text>%</InputGroup.Text>}
                                </InputGroup>
                                <Form.Text className="text-muted">
                                    {couponForm.type === "percentage"
                                        ? "Enter as decimal (e.g., 0.10 for 10%)"
                                        : "Enter dollar amount"}
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Expiry Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={couponForm.expiryDate}
                            onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description (Optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Brief description of the coupon"
                            value={couponForm.description}
                            onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                        />
                    </Form.Group>
                </Form>
            </GenericModal>
        </div>
    );
}
