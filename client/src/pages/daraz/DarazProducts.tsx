import { useState, useEffect } from "react";
import { Card, Table, Button, Badge, Form, InputGroup, Alert, Modal } from "react-bootstrap";
import { Search, RefreshCw, Edit2, Package } from "lucide-react";

export function DarazProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showSyncModal, setShowSyncModal] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/daraz/products`);
            const data = await response.json();
            setProducts(data.data?.products || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.seller_sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Daraz Products</h2>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={() => setShowSyncModal(true)}>
                        <RefreshCw size={18} className="me-2" />
                        Sync with Inventory
                    </Button>
                    <Button variant="primary" onClick={fetchProducts}>
                        <RefreshCw size={18} className="me-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search products..."
                            className="border-start-0 ps-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
                        <Table hover responsive>
                            <thead className="bg-light">
                                <tr>
                                    <th>Image</th>
                                    <th>Product Name</th>
                                    <th>SKU</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-4">
                                            No products found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr key={product.item_id}>
                                            <td>
                                                {product.primary_image ? (
                                                    <img src={product.primary_image} alt={product.item_name} style={{ width: '40px', height: '40px', objectFit: 'cover' }} className="rounded" />
                                                ) : (
                                                    <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                        <Package size={20} className="text-muted" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="fw-medium">{product.item_name}</td>
                                            <td className="text-muted small">{product.seller_sku}</td>
                                            <td>PKR {product.price?.toFixed(2)}</td>
                                            <td>{product.quantity}</td>
                                            <td>
                                                <Badge bg={product.status === "active" ? "success" : "secondary"}>
                                                    {product.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button variant="link" className="text-primary p-0">
                                                    <Edit2 size={16} />
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

            <Modal show={showSyncModal} onHide={() => setShowSyncModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Sync with Inventory</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>This will sync Daraz products with your local inventory. Continue?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSyncModal(false)}>Cancel</Button>
                    <Button variant="primary">Sync Now</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
