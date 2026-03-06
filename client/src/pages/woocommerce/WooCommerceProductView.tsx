import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Row, Col, Badge, Button, Spinner, Alert, Image } from "react-bootstrap";
import { ArrowLeft, Edit, Package, DollarSign, Layers } from "lucide-react";
import api from "../../lib/api";

interface WooCommerceProduct {
    id: number;
    name: string;
    slug: string;
    permalink: string;
    type: string;
    status: string;
    featured: boolean;
    description: string;
    short_description: string;
    sku: string;
    price: string;
    regular_price: string;
    sale_price: string;
    manage_stock: boolean;
    stock_quantity: number | null;
    stock_status: string;
    images: Array<{ id: number; src: string; name: string; alt: string }>;
    categories: Array<{ id: number; name: string; slug: string }>;
    date_created: string;
    date_modified: string;
}

export function WooCommerceProductView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<WooCommerceProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/woocommerce/products/${id}`);
            setProduct(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to load product");
        } finally {
            setLoading(false);
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

    if (error || !product) {
        return (
            <div className="p-4">
                <Alert variant="danger">{error || "Product not found"}</Alert>
                <Button variant="outline-secondary" onClick={() => navigate("/woocommerce/products")}>
                    <ArrowLeft size={18} className="me-2" />
                    Back to Products
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate("/woocommerce/products")}>
                        <ArrowLeft size={18} />
                    </Button>
                    <h2 className="mb-0">{product.name}</h2>
                </div>
                <Button variant="primary" onClick={() => navigate(`/woocommerce/products/${id}/edit`)}>
                    <Edit size={18} className="me-2" />
                    Edit Product
                </Button>
            </div>

            <Row>
                <Col lg={8}>
                    {/* Product Images */}
                    {product.images && product.images.length > 0 && (
                        <Card className="border-0 shadow-sm mb-3">
                            <Card.Body>
                                <h5 className="mb-3">Product Images</h5>
                                <div className="d-flex gap-2 flex-wrap">
                                    {product.images.map((image) => (
                                        <Image
                                            key={image.id}
                                            src={image.src}
                                            alt={image.alt || product.name}
                                            thumbnail
                                            style={{ width: "150px", height: "150px", objectFit: "cover" }}
                                        />
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Description */}
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <h5 className="mb-3">Description</h5>
                            <div dangerouslySetInnerHTML={{ __html: product.description || "No description available" }} />
                        </Card.Body>
                    </Card>

                    {/* Short Description */}
                    {product.short_description && (
                        <Card className="border-0 shadow-sm mb-3">
                            <Card.Body>
                                <h5 className="mb-3">Short Description</h5>
                                <div dangerouslySetInnerHTML={{ __html: product.short_description }} />
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                <Col lg={4}>
                    {/* Product Info */}
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <h5 className="mb-3">Product Information</h5>

                            <div className="mb-3">
                                <small className="text-muted">Status</small>
                                <div>
                                    <Badge bg={product.status === "publish" ? "success" : "secondary"}>
                                        {product.status}
                                    </Badge>
                                    {product.featured && (
                                        <Badge bg="warning" className="ms-2">Featured</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="mb-3">
                                <small className="text-muted">SKU</small>
                                <div className="d-flex align-items-center gap-2">
                                    <Package size={16} />
                                    <strong>{product.sku || "N/A"}</strong>
                                </div>
                            </div>

                            <div className="mb-3">
                                <small className="text-muted">Type</small>
                                <div className="d-flex align-items-center gap-2">
                                    <Layers size={16} />
                                    <span>{product.type}</span>
                                </div>
                            </div>

                            {product.categories && product.categories.length > 0 && (
                                <div className="mb-3">
                                    <small className="text-muted">Categories</small>
                                    <div className="d-flex gap-1 flex-wrap mt-1">
                                        {product.categories.map((cat) => (
                                            <Badge key={cat.id} bg="info">{cat.name}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Pricing */}
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <h5 className="mb-3 d-flex align-items-center gap-2">
                                <DollarSign size={20} />
                                Pricing
                            </h5>

                            <div className="mb-2">
                                <small className="text-muted">Regular Price</small>
                                <div><strong>${product.regular_price || "0.00"}</strong></div>
                            </div>

                            {product.sale_price && (
                                <div className="mb-2">
                                    <small className="text-muted">Sale Price</small>
                                    <div className="text-danger"><strong>${product.sale_price}</strong></div>
                                </div>
                            )}

                            <div>
                                <small className="text-muted">Current Price</small>
                                <div className="fs-4 text-primary"><strong>${product.price}</strong></div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Inventory */}
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <h5 className="mb-3">Inventory</h5>

                            <div className="mb-2">
                                <small className="text-muted">Stock Status</small>
                                <div>
                                    <Badge bg={product.stock_status === "instock" ? "success" : "danger"}>
                                        {product.stock_status}
                                    </Badge>
                                </div>
                            </div>

                            {product.manage_stock && (
                                <div>
                                    <small className="text-muted">Stock Quantity</small>
                                    <div><strong>{product.stock_quantity ?? "N/A"}</strong></div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Metadata */}
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h5 className="mb-3">Metadata</h5>
                            <div className="mb-2">
                                <small className="text-muted">Product ID</small>
                                <div><code>{product.id}</code></div>
                            </div>
                            <div className="mb-2">
                                <small className="text-muted">Created</small>
                                <div>{new Date(product.date_created).toLocaleString()}</div>
                            </div>
                            <div>
                                <small className="text-muted">Last Modified</small>
                                <div>{new Date(product.date_modified).toLocaleString()}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
