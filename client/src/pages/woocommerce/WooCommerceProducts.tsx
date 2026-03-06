import { useState, useEffect } from "react";
import { Card, Table, Button, Badge, Form, InputGroup, Alert, Modal, Row, Col, Image, Spinner } from "react-bootstrap";
import { Search, RefreshCw, Package, Plus, Eye, Edit, Save, X } from "lucide-react";
import api from "../../lib/api";

interface WooCommerceProduct {
    id: number;
    woo_id?: number;
    name: string;
    sku: string;
    price: string;
    regular_price: string;
    sale_price: string;
    stock_quantity: number | null;
    stock_status: string;
    status: string;
    description: string;
    short_description: string;
    images?: Array<{ id: number; src: string; name: string; alt: string }>;
    image_url?: string;
    categories?: Array<{ id: number; name: string; slug: string }>;
    featured: boolean;
    manage_stock: boolean;
}

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

export function WooCommerceProducts() {
    const [products, setProducts] = useState<WooCommerceProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState("");
    const [viewMode, setViewMode] = useState<"cloud" | "local">("cloud");

    // Modal states
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<WooCommerceProduct | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
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

    useEffect(() => {
        fetchProducts();
    }, [page, viewMode]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const search = searchTerm ? `&search=${searchTerm}` : "";
            let data;
            if (viewMode === "cloud") {
                const response = await api.get(`/woocommerce/products?page=${page}&per_page=20${search}`);
                data = response.data;
            } else {
                const skip = (page - 1) * 20;
                const searchParam = searchTerm ? `&search=${searchTerm}` : "";
                const response = await api.get(`/woocommerce/local/products?skip=${skip}&limit=20${searchParam}`);
                data = response.data.products;
            }
            setProducts(data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchProducts();
    };

    const syncProducts = async () => {
        try {
            setSyncing(true);
            setSyncMessage("");
            const response: any = await api.post("/woocommerce/sync/products?per_page=100");
            console.log(response, 'response sync products');
            setSyncMessage(`Synced ${response.data.synced} new products, updated ${response.data.updated} existing products`);
            if (viewMode === "local") {
                fetchProducts();
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to sync products");
        } finally {
            setSyncing(false);
        }
    };

    const handleViewProduct = async (product: WooCommerceProduct) => {
        try {
            setModalLoading(true);
            setShowViewModal(true);
            setSelectedProduct(null);

            // Use the correct ID - for cloud products use id, for local use woo_id
            const productId = viewMode === "cloud" ? product.id : (product.woo_id || product.id);
            console.log("Fetching product with ID:", productId);

            const response = await api.get(`/woocommerce/products/${productId}`);
            console.log("Product data received:", response.data);
            setSelectedProduct(response.data);
            setError("");
        } catch (err: any) {
            console.error("Error loading product:", err);
            const errorMsg = err.response?.data?.detail || err.message || "Failed to load product";
            setError(errorMsg);
            setShowViewModal(false);
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditProduct = async (product: WooCommerceProduct) => {
        try {
            setModalLoading(true);
            setShowEditModal(true);
            setSelectedProduct(null);

            // Use the correct ID
            const productId = viewMode === "cloud" ? product.id : (product.woo_id || product.id);
            console.log("Fetching product for edit with ID:", productId);

            const response = await api.get(`/woocommerce/products/${productId}`);
            const prod = response.data;
            console.log("Product data for edit:", prod);

            setSelectedProduct(prod);
            setFormData({
                name: prod.name || "",
                description: prod.description || "",
                short_description: prod.short_description || "",
                sku: prod.sku || "",
                regular_price: prod.regular_price || "",
                sale_price: prod.sale_price || "",
                status: prod.status || "publish",
                stock_status: prod.stock_status || "instock",
                manage_stock: prod.manage_stock || false,
                stock_quantity: prod.stock_quantity,
                featured: prod.featured || false
            });
            setError("");
        } catch (err: any) {
            console.error("Error loading product for edit:", err);
            const errorMsg = err.response?.data?.detail || err.message || "Failed to load product";
            setError(errorMsg);
            setShowEditModal(false);
        } finally {
            setModalLoading(false);
        }
    };

    const handleAddProduct = () => {
        setFormData({
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
        setShowAddModal(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedProduct) return;
        try {
            setSaving(true);
            const productData = {
                ...formData,
                regular_price: formData.regular_price.toString(),
                sale_price: formData.sale_price || undefined,
                stock_quantity: formData.manage_stock ? formData.stock_quantity : undefined
            };
            await api.put(`/woocommerce/products/${selectedProduct.id}`, productData);
            setShowEditModal(false);
            fetchProducts();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to update product");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAdd = async () => {
        try {
            setSaving(true);
            const productData = {
                ...formData,
                type: "simple",
                regular_price: formData.regular_price.toString(),
                sale_price: formData.sale_price || undefined,
                stock_quantity: formData.manage_stock ? formData.stock_quantity : undefined
            };
            await api.post("/woocommerce/products", productData);
            setShowAddModal(false);
            fetchProducts();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to create product");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>WooCommerce Products</h2>
                <div className="d-flex gap-2">
                    <Button variant="success" onClick={handleAddProduct}>
                        <Plus size={18} className="me-2" />
                        Add Product
                    </Button>
                    <Button
                        variant={syncing ? "secondary" : "info"}
                        onClick={syncProducts}
                        disabled={syncing}
                    >
                        {syncing ? "Syncing..." : "Sync from Cloud"}
                    </Button>
                    <Button variant="primary" onClick={fetchProducts}>
                        <RefreshCw size={18} className="me-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
            {syncMessage && <Alert variant="success" dismissible onClose={() => setSyncMessage("")}>{syncMessage}</Alert>}

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <div className="d-flex gap-2 mb-3">
                        <Button
                            variant={viewMode === "cloud" ? "primary" : "outline-primary"}
                            onClick={() => { setViewMode("cloud"); setPage(1); }}
                        >
                            Cloud Products
                        </Button>
                        <Button
                            variant={viewMode === "local" ? "primary" : "outline-primary"}
                            onClick={() => { setViewMode("local"); setPage(1); }}
                        >
                            Local Database
                        </Button>
                    </div>
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search products..."
                            className="border-start-0 ps-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button variant="primary" onClick={handleSearch}>Search</Button>
                    </InputGroup>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" />
                        </div>
                    ) : (
                        <>
                            <Table hover responsive>
                                <thead className="bg-light">
                                    <tr>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>SKU</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center text-muted py-4">
                                                No products found
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((product) => (
                                            <tr key={product.id || product.woo_id}>
                                                <td>
                                                    {(product.images?.[0]?.src || product.image_url) ? (
                                                        <img src={product.images?.[0]?.src || product.image_url} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover' }} className="rounded" />
                                                    ) : (
                                                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <Package size={20} className="text-muted" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="fw-medium">{product.name}</td>
                                                <td className="text-muted small">{product.sku || 'N/A'}</td>
                                                <td>${product.price}</td>
                                                <td>{product.stock_quantity || 'N/A'}</td>
                                                <td>
                                                    <Badge bg={product.status === "publish" ? "success" : "secondary"}>
                                                        {product.status}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button size="sm" variant="outline-primary" onClick={() => handleViewProduct(product)}>
                                                            <Eye size={14} />
                                                        </Button>
                                                        <Button size="sm" variant="outline-secondary" onClick={() => handleEditProduct(product)}>
                                                            <Edit size={14} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <Button variant="outline-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
                                    Previous
                                </Button>
                                <span>Page {page}</span>
                                <Button variant="outline-secondary" disabled={products.length < 20} onClick={() => setPage(page + 1)}>
                                    Next
                                </Button>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* View Product Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Product Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : selectedProduct && (
                        <Row>
                            <Col md={12}>
                                {selectedProduct.images && selectedProduct.images.length > 0 && (
                                    <div className="mb-3">
                                        <h6>Images</h6>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {selectedProduct.images.map((image) => (
                                                <Image
                                                    key={image.id}
                                                    src={image.src}
                                                    alt={image.alt || selectedProduct.name}
                                                    thumbnail
                                                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <h5>{selectedProduct.name}</h5>
                                <div className="mb-2">
                                    <Badge bg={selectedProduct.status === "publish" ? "success" : "secondary"}>
                                        {selectedProduct.status}
                                    </Badge>
                                    {selectedProduct.featured && <Badge bg="warning" className="ms-2">Featured</Badge>}
                                </div>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <small className="text-muted">SKU</small>
                                        <div><strong>{selectedProduct.sku || "N/A"}</strong></div>
                                    </Col>
                                    <Col md={6}>
                                        <small className="text-muted">Price</small>
                                        <div className="fs-5 text-primary"><strong>${selectedProduct.price}</strong></div>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <small className="text-muted">Regular Price</small>
                                        <div>${selectedProduct.regular_price}</div>
                                    </Col>
                                    {selectedProduct.sale_price && (
                                        <Col md={6}>
                                            <small className="text-muted">Sale Price</small>
                                            <div className="text-danger">${selectedProduct.sale_price}</div>
                                        </Col>
                                    )}
                                </Row>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <small className="text-muted">Stock Status</small>
                                        <div>
                                            <Badge bg={selectedProduct.stock_status === "instock" ? "success" : "danger"}>
                                                {selectedProduct.stock_status}
                                            </Badge>
                                        </div>
                                    </Col>
                                    {selectedProduct.manage_stock && (
                                        <Col md={6}>
                                            <small className="text-muted">Stock Quantity</small>
                                            <div><strong>{selectedProduct.stock_quantity ?? "N/A"}</strong></div>
                                        </Col>
                                    )}
                                </Row>

                                {selectedProduct.description && (
                                    <div className="mb-3">
                                        <h6>Description</h6>
                                        <div dangerouslySetInnerHTML={{ __html: selectedProduct.description }} />
                                    </div>
                                )}

                                {selectedProduct.categories && selectedProduct.categories.length > 0 && (
                                    <div>
                                        <small className="text-muted">Categories</small>
                                        <div className="d-flex gap-1 flex-wrap mt-1">
                                            {selectedProduct.categories.map((cat) => (
                                                <Badge key={cat.id} bg="info">{cat.name}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                        Close
                    </Button>
                    {selectedProduct && (
                        <Button variant="primary" onClick={() => {
                            setShowViewModal(false);
                            handleEditProduct(selectedProduct);
                        }}>
                            <Edit size={18} className="me-2" />
                            Edit Product
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Edit Product Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Product</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Product Name *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </Form.Group>

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

                            <Form.Group className="mb-3">
                                <Form.Label>SKU</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Form.Group>

                            <Row>
                                <Col md={6}>
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
                                </Col>
                                <Col md={6}>
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
                                </Col>
                            </Row>

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
                                <Form.Check
                                    type="checkbox"
                                    label="Featured product"
                                    checked={formData.featured}
                                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={saving}>
                        <X size={18} className="me-2" />
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveEdit} disabled={saving}>
                        <Save size={18} className="me-2" />
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Add Product Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add New Product</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
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
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>SKU</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="Enter SKU"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter product description"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Short Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.short_description}
                                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                                placeholder="Enter short description"
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
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
                            </Col>
                            <Col md={6}>
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
                            </Col>
                        </Row>

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
                            <Form.Check
                                type="checkbox"
                                label="Featured product"
                                checked={formData.featured}
                                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={saving}>
                        <X size={18} className="me-2" />
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleSaveAdd} disabled={saving}>
                        <Plus size={18} className="me-2" />
                        {saving ? "Creating..." : "Create Product"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
