import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Button, Row, Col, Alert } from "react-bootstrap";
import { ArrowLeft, Plus } from "lucide-react";
import api from "../../lib/api";

interface ProductFormData {
    name: string;
    description: string;
    short_description: string;
    sku: string;
    regular_price: string;
    sale_price: string;
    status: string;
    stock_status: string;
    manage_stock: boolean;
    stock_quantity: number | null;
    featured: boolean;
}

export function WooCommerceProductAdd() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        description: "",
        short_description: "",
        sku: "",
        regular_price: "",
        sale_price: "",
        status: "publish",
        stock_status: "instock",
        manage_stock: false,
        stock_quantity: null,
        featured: false
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);

            const productData = {
                ...formData,
                type: "simple",
                regular_price: formData.regular_price.toString(),
                sale_price: formData.sale_price || undefined,
                stock_quantity: formData.manage_stock ? formData.stock_quantity : undefined
            };

            const response = await api.post("/woocommerce/products", productData);
            navigate(`/woocommerce/products/${response.data.id}`);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to create product");
            setSaving(false);
        }
    };

    return (
        <div className="p-4">
            <div className="d-flex align-items-center gap-2 mb-4">
                <Button variant="outline-secondary" size="sm" onClick={() => navigate("/woocommerce/products")}>
                    <ArrowLeft size={18} />
                </Button>
                <h2 className="mb-0">Add New Product</h2>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm mb-3">
                            <Card.Body>
                                <h5 className="mb-3">Basic Information</h5>

                                <Form.Group className="mb-3">
                                    <Form.Label>Product Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter product name"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter product description"
                                    />
                                    <Form.Text className="text-muted">
                                        Full product description (supports HTML)
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Short Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formData.short_description}
                                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                                        placeholder="Enter short description"
                                    />
                                    <Form.Text className="text-muted">
                                        Brief summary displayed on product listings
                                    </Form.Text>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm mb-3">
                            <Card.Body>
                                <h5 className="mb-3">Pricing</h5>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Regular Price *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                value={formData.regular_price}
                                                onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                                                placeholder="0.00"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Sale Price</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                value={formData.sale_price}
                                                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                                                placeholder="0.00"
                                            />
                                            <Form.Text className="text-muted">
                                                Leave empty for no sale
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <Card.Body>
                                <h5 className="mb-3">Inventory</h5>

                                <Form.Group className="mb-3">
                                    <Form.Label>SKU</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        placeholder="Enter SKU"
                                    />
                                    <Form.Text className="text-muted">
                                        Stock Keeping Unit - unique identifier
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="Manage stock"
                                        checked={formData.manage_stock}
                                        onChange={(e) => setFormData({ ...formData, manage_stock: e.target.checked })}
                                    />
                                </Form.Group>

                                {formData.manage_stock && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Stock Quantity</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.stock_quantity || ""}
                                            onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || null })}
                                            placeholder="0"
                                        />
                                    </Form.Group>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label>Stock Status</Form.Label>
                                    <Form.Select
                                        value={formData.stock_status}
                                        onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                                    >
                                        <option value="instock">In Stock</option>
                                        <option value="outofstock">Out of Stock</option>
                                        <option value="onbackorder">On Backorder</option>
                                    </Form.Select>
                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        <Card className="border-0 shadow-sm mb-3">
                            <Card.Body>
                                <h5 className="mb-3">Publish</h5>

                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="publish">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="private">Private</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="Featured product"
                                        checked={formData.featured}
                                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                    />
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button type="submit" variant="primary" disabled={saving}>
                                        <Plus size={18} className="me-2" />
                                        {saving ? "Creating..." : "Create Product"}
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => navigate("/woocommerce/products")}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <Card.Body>
                                <h6 className="mb-2">Product Type</h6>
                                <p className="text-muted small mb-0">Simple Product</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
