import { useState, useEffect } from "react";
import { Card, Table, Button, Form, InputGroup, Alert, Spinner } from "react-bootstrap";
import { Search, Plus, Mail, Phone, Edit2, Trash2 } from "lucide-react";
import { GenericModal } from "../../components/common/GenericModal";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, type Supplier } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export function SupplierList() {
    const { checkPermission } = useAuth();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (err: any) {
            setError("Failed to fetch suppliers"); // We ignore permissions error here relying on sidebar
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                contact_person: supplier.contact_person || "",
                email: supplier.email || "",
                phone: supplier.phone || "",
                address: supplier.address || ""
            });
        } else {
            setEditingSupplier(null);
            setFormData({ name: "", contact_person: "", email: "", phone: "", address: "" });
        }
        setShowModal(true);
        setError("");
    };

    const handleSaveSupplier = async () => {
        try {
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, formData);
            } else {
                await createSupplier(formData);
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to save supplier");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this supplier?")) return;
        try {
            await deleteSupplier(id);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to delete supplier");
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">Supplier Management</h1>
                {checkPermission('suppliers', 'create') && (
                    <Button variant="primary" className="d-flex align-items-center" onClick={() => handleShowModal()}>
                        <Plus size={18} className="me-2" />
                        Add Supplier
                    </Button>
                )}
            </div>

            {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search suppliers..."
                            className="border-start-0 shadow-none"
                        />
                    </InputGroup>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 ps-4">Company Name</th>
                                    <th className="border-0">Contact Person</th>
                                    <th className="border-0">Email</th>
                                    <th className="border-0">Phone</th>
                                    <th className="border-0 pe-4 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map((supplier) => (
                                    <tr key={supplier.id}>
                                        <td className="ps-4 fw-medium">{supplier.name}</td>
                                        <td>{supplier.contact_person || "-"}</td>
                                        <td>
                                            {supplier.email && (
                                                <div className="d-flex align-items-center text-muted">
                                                    <Mail size={14} className="me-2" /> {supplier.email}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {supplier.phone && (
                                                <div className="d-flex align-items-center text-muted">
                                                    <Phone size={14} className="me-2" /> {supplier.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="pe-4 text-end">
                                            {checkPermission('suppliers', 'update') && (
                                                <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(supplier)}>
                                                    <Edit2 size={14} />
                                                </Button>
                                            )}
                                            {checkPermission('suppliers', 'delete') && (
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(supplier.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {suppliers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4 text-muted">No suppliers found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <GenericModal
                show={showModal}
                onHide={() => setShowModal(false)}
                title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                onConfirm={handleSaveSupplier}
            >
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Company Name *</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. TechSupplies Inc."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Contact Person</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. John Smith"
                            value={formData.contact_person}
                            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="e.g. john@techsupplies.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                            type="tel"
                            placeholder="e.g. +1 (555) 123-4567"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </Form.Group>
                </Form>
            </GenericModal>
        </div>
    );
}
