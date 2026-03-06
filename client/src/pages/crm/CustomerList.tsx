import { useState } from "react";
import { Card, Table, Button, Form, InputGroup } from "react-bootstrap";
import { Search, Plus, Mail, Phone, MapPin, Edit2 } from "lucide-react";
import { GenericModal } from "../../components/common/GenericModal";
import { useCustomers, type Customer } from "../../hooks/useCustomers";

export function CustomerList() {
    const { customers, loading, addCustomer, updateCustomer } = useCustomers();
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
    const [customerForm, setCustomerForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        company: ""
    });

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    const handleOpenAdd = () => {
        setEditingCustomerId(null);
        setCustomerForm({ name: "", email: "", phone: "", address: "", company: "" });
        setShowModal(true);
    };

    const handleOpenEdit = (customer: Customer) => {
        setEditingCustomerId(customer.id);
        setCustomerForm({
            name: customer.name,
            email: customer.email || "",
            phone: customer.phone || "",
            address: customer.address || "",
            company: customer.company || ""
        });
        setShowModal(true);
    };

    const handleConfirm = async () => {
        try {
            if (editingCustomerId) {
                await updateCustomer(editingCustomerId, customerForm);
            } else {
                await addCustomer(customerForm);
            }
            setShowModal(false);
            setCustomerForm({ name: "", email: "", phone: "", address: "", company: "" });
            setEditingCustomerId(null);
        } catch (error) {
            console.error("Failed to save customer", error);
            alert("Failed to save customer");
        }
    };

    if (loading) return <div>Loading customers...</div>;

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">Customer Management</h1>
                <Button variant="primary" className="d-flex align-items-center" onClick={handleOpenAdd}>
                    <Plus size={18} className="me-2" />
                    Add Customer
                </Button>
            </div>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search customers..."
                            className="border-start-0 shadow-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0 ps-4">Name</th>
                                <th className="border-0">Company</th>
                                <th className="border-0">Contact Info</th>
                                <th className="border-0">Address</th>
                                <th className="border-0">Points</th>
                                <th className="border-0 text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer: Customer) => (
                                <tr key={customer.id}>
                                    <td className="ps-4 fw-medium">{customer.name}</td>
                                    <td>{customer.company || "-"}</td>
                                    <td>
                                        <div className="d-flex flex-column small text-muted">
                                            {customer.email && (
                                                <div className="d-flex align-items-center mb-1">
                                                    <Mail size={12} className="me-2" /> {customer.email}
                                                </div>
                                            )}
                                            {customer.phone && (
                                                <div className="d-flex align-items-center">
                                                    <Phone size={12} className="me-2" /> {customer.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center text-muted">
                                            <MapPin size={14} className="me-2" /> {customer.address || "-"}
                                        </div>
                                    </td>
                                    <td>{customer.points || 0}</td>
                                    <td className="text-end pe-4">
                                        <Button
                                            variant="light"
                                            size="sm"
                                            onClick={() => handleOpenEdit(customer)}
                                            className="text-primary"
                                        >
                                            <Edit2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-muted">
                                        No customers found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <GenericModal
                show={showModal}
                onHide={() => setShowModal(false)}
                title={editingCustomerId ? "Edit Customer" : "Add New Customer"}
                onConfirm={handleConfirm}
                confirmText={editingCustomerId ? "Save Changes" : "Add Customer"}
            >
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. John Doe"
                            value={customerForm.name}
                            onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Company</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. Acme Corp"
                            value={customerForm.company}
                            onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="e.g. john@acme.com"
                            value={customerForm.email}
                            onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                            type="tel"
                            placeholder="e.g. +1 (555) 123-4567"
                            value={customerForm.phone}
                            onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. New York, USA"
                            value={customerForm.address}
                            onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                        />
                    </Form.Group>
                </Form>
            </GenericModal>
        </div>
    );
}
