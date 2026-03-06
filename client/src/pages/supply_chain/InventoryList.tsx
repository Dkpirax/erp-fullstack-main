import { useState } from "react";
import { Table, Button, Badge, Form, InputGroup, Spinner, Alert, Modal } from "react-bootstrap";
import { Plus, Search, Edit2, Trash2, RefreshCw, PackageOpen } from "lucide-react";
import { useProducts, type Product } from "../../hooks/useProducts";
import { useAuth } from "../../context/AuthContext";

type FormState = Omit<Product, 'id' | 'stock' | 'status' | 'image'>;

const EMPTY_FORM: FormState = {
    name: "",
    sku: "",
    description: "",
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    low_stock_threshold: 10,
    image_url: "",
    category: "General",
    barcode: "",
    supplier_id: undefined,
};

export function InventoryList() {
    const { checkPermission } = useAuth();
    const { products, addProduct, updateProduct, deleteProduct, refreshProducts, loading, error } = useProducts();

    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const f = (field: keyof FormState, value: any) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData(EMPTY_FORM);
        setSaveError("");
        setShowModal(true);
    };

    const handleOpenEdit = (product: Product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            sku: product.sku,
            description: product.description || "",
            price: product.price,
            cost_price: product.cost_price || 0,
            stock_quantity: product.stock_quantity,
            low_stock_threshold: product.low_stock_threshold || 10,
            image_url: product.image_url || "",
            category: product.category || "General",
            barcode: product.barcode || "",
            supplier_id: product.supplier_id,
        });
        setSaveError("");
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.sku.trim()) {
            setSaveError("Product name and SKU are required.");
            return;
        }
        setSaving(true);
        setSaveError("");
        try {
            if (editingId) {
                await updateProduct(editingId, formData);
            } else {
                await addProduct(formData);
            }
            setShowModal(false);
        } catch (err: any) {
            setSaveError(err.message || "Failed to save product.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteProduct(id);
            setDeleteConfirmId(null);
        } catch (err: any) {
            alert(err.message || "Failed to delete product.");
        }
    };

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (p.barcode?.includes(searchTerm) ?? false)
    );

    const statusBadge = (s: string) => {
        const map: Record<string, string> = { "In Stock": "success", "Low Stock": "warning", "Out of Stock": "danger" };
        return <Badge bg={map[s] || "secondary"}>{s}</Badge>;
    };

    return (
        <div className="p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-0">📦 Inventory</h2>
                    <small className="text-muted">{products.length} products total</small>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={refreshProducts} disabled={loading} title="Refresh">
                        <RefreshCw size={16} className={loading ? "spin" : ""} />
                    </Button>
                    {checkPermission('inventory', 'create') && (
                        <Button variant="primary" onClick={handleOpenAdd}>
                            <Plus size={18} className="me-1" /> Add Product
                        </Button>
                    )}
                </div>
            </div>

            {error && <Alert variant="danger" dismissible>{error}</Alert>}

            {/* Search */}
            <InputGroup className="mb-3">
                <InputGroup.Text><Search size={16} /></InputGroup.Text>
                <Form.Control
                    placeholder="Search by name, SKU or barcode..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <Button variant="outline-secondary" onClick={() => setSearchTerm("")}>✕</Button>
                )}
            </InputGroup>

            {/* Table */}
            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <PackageOpen size={48} className="mb-2 opacity-25" />
                    <p>{searchTerm ? "No products match your search." : "No products yet. Click 'Add Product' to create one."}</p>
                </div>
            ) : (
                <div className="bg-white rounded shadow-sm">
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>SKU</th>
                                <th>Category</th>
                                <th>Stock</th>
                                <th>Price</th>
                                <th>Cost</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(product => (
                                <tr key={product.id}>
                                    <td>
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name}
                                                style={{ width: 40, height: 40, objectFit: 'cover' }} className="rounded" />
                                        ) : (
                                            <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted"
                                                style={{ width: 40, height: 40, fontSize: 20 }}>📦</div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="fw-semibold">{product.name}</div>
                                        {product.description && <small className="text-muted">{product.description.substring(0, 40)}…</small>}
                                    </td>
                                    <td><code className="text-muted small">{product.sku}</code></td>
                                    <td><Badge bg="light" text="dark" className="border">{product.category || '—'}</Badge></td>
                                    <td>
                                        <span className={product.stock_quantity === 0 ? 'text-danger fw-bold' : product.stock_quantity <= (product.low_stock_threshold || 10) ? 'text-warning fw-bold' : ''}>
                                            {product.stock_quantity}
                                        </span>
                                    </td>
                                    <td className="fw-semibold">${Number(product.price).toFixed(2)}</td>
                                    <td className="text-muted">${Number(product.cost_price || 0).toFixed(2)}</td>
                                    <td>{statusBadge(product.status)}</td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            {checkPermission('inventory', 'update') && (
                                                <Button variant="outline-primary" size="sm" onClick={() => handleOpenEdit(product)} title="Edit">
                                                    <Edit2 size={14} />
                                                </Button>
                                            )}
                                            {checkPermission('inventory', 'delete') && (
                                                <Button variant="outline-danger" size="sm" onClick={() => setDeleteConfirmId(product.id)} title="Delete">
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* ── Add / Edit Modal ─────────────────────── */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? "✏️ Edit Product" : "➕ Add New Product"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {saveError && <Alert variant="danger">{saveError}</Alert>}
                    <Form>
                        <Form.Group className="mb-3" controlId="formProductName">
                            <Form.Label>Product Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control value={formData.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Wireless Mouse" />
                        </Form.Group>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <Form.Label htmlFor="formSku">SKU <span className="text-danger">*</span></Form.Label>
                                <Form.Control id="formSku" value={formData.sku} onChange={e => f('sku', e.target.value)} placeholder="e.g. MOUSE-001" />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Barcode</Form.Label>
                                <Form.Control value={formData.barcode || ""} onChange={e => f('barcode', e.target.value)} placeholder="Scan or type barcode" />
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={2} value={formData.description || ""} onChange={e => f('description', e.target.value)} placeholder="Optional product description" />
                        </Form.Group>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <Form.Label>Category</Form.Label>
                                <Form.Control value={formData.category || ""} onChange={e => f('category', e.target.value)} placeholder="e.g. Electronics" />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Image URL</Form.Label>
                                <Form.Control value={formData.image_url || ""} onChange={e => f('image_url', e.target.value)} placeholder="https://..." />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <Form.Label htmlFor="formPrice">Selling Price ($)</Form.Label>
                                <Form.Control id="formPrice" type="number" min="0" step="0.01" value={formData.price}
                                    onChange={e => f('price', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label htmlFor="formCostPrice">Cost Price ($)</Form.Label>
                                <Form.Control id="formCostPrice" type="number" min="0" step="0.01" value={formData.cost_price || 0}
                                    onChange={e => f('cost_price', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <Form.Label htmlFor="formStockQuantity">Stock Quantity</Form.Label>
                                <Form.Control id="formStockQuantity" type="number" min="0" value={formData.stock_quantity}
                                    onChange={e => f('stock_quantity', parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Low Stock Threshold</Form.Label>
                                <Form.Control type="number" min="0" value={formData.low_stock_threshold || 10}
                                    onChange={e => f('low_stock_threshold', parseInt(e.target.value) || 10)} />
                                <Form.Text className="text-muted">Warn when stock falls below this</Form.Text>
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? <><Spinner size="sm" animation="border" className="me-1" /> Saving…</> : (editingId ? "Save Changes" : "Add Product")}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Delete Confirm Modal ─────────────────── */}
            <Modal show={deleteConfirmId !== null} onHide={() => setDeleteConfirmId(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Product</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete this product? This action <strong>cannot be undone</strong>.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                    <Button variant="danger" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                        <Trash2 size={16} className="me-1" /> Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
