import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { ArrowLeft, Save } from "lucide-react";
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

export function WooCommerceProductEdit() {
    const { id } = useParams<{ id: string }>();
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/woocommerce/products/${id}`);
            const product = response.data;
            setFormData({
                name: product.name || "",
                description: product.description || "",
                short_description: product.short_description || "",
                sku: product.sku || "",
                regular_price: product.regular_price || "",
                sale_price: product.sale_price || "",
                status: product.status || "publish",
                stock_status: product.stock_status || "instock",
                manage_stock: product.manage_stock || false,
                stock_quantity: product.stock_quantity,
                featured: product.featured || false
            });
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to load product");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);

            const productData = {
                ...formData,
                regular_price: formData.regular_price.toString(),
                sale_price: formData.sale_price || undefined,
                stock_quantity: formData.manage_stock ? formData.stock_quantity : undefined
            };

            await api.put(`/woocommerce/products/${id}`, productData);
            setSuccess(true);
            setTimeout(() => {
                navigate(`/woocommerce/products/${id}`);
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to update product");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 text-center">
                <Spinner animation="border" />
                <p className="mt-2">Loading product...</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="d-flex align-items-center gap-2 mb-4">
                <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/woocommerce/products/${id}`)}>
                    <ArrowLeft size={18} />
                </Button>
                <h2 className="mb-0">Edit Product</h2>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">Product updated successfully!</Alert>}

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
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Short Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formData.short_description}
                                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                                    />
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
                                            />
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
                                    />
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
                                        <Save size={18} className="me-2" />
                                        {saving ? "Saving..." : "Update Product"}
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => navigate(`/woocommerce/products/${id}`)}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
