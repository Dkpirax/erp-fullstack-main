import { useState, useEffect } from "react";
import { Card, Table, Badge, Form, InputGroup, Button, Modal, Row, Col } from "react-bootstrap";
import { Search, Plus } from "lucide-react";
import { getAPInvoices, createAPInvoice, getSuppliers, type APInvoice, type APInvoiceCreate, type Supplier } from "../../lib/api";

export function AccountsPayable() {
    const [invoices, setInvoices] = useState<APInvoice[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newInvoice, setNewInvoice] = useState<APInvoiceCreate>({
        invoice_number: "",
        supplier_id: 0,
        date: new Date().toISOString().split('T')[0],
        due_date: "",
        total_amount: 0,
        status: "DRAFT"
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [invoicesData, suppliersData] = await Promise.all([
                getAPInvoices(),
                getSuppliers()
            ]);
            setInvoices(invoicesData);
            setSuppliers(suppliersData);
        } catch (error) {
            console.error("Failed to load data", error);
        }
    };

    const loadInvoices = async () => {
        try {
            const data = await getAPInvoices();
            setInvoices(data);
        } catch (error) {
            console.error("Failed to load AP invoices", error);
        }
    };

    const handleCreate = async () => {
        try {
            const payload = {
                ...newInvoice,
                due_date: newInvoice.due_date || undefined
            };
            await createAPInvoice(payload);
            setShowModal(false);
            loadInvoices();
            setNewInvoice({
                invoice_number: "",
                supplier_id: 0,
                date: new Date().toISOString().split('T')[0],
                due_date: "",
                total_amount: 0,
                status: "DRAFT"
            });
        } catch (error) {
            console.error("Failed to create AP invoice", error);
        }
    };

    const getSupplierName = (id: number) => {
        return suppliers.find(s => s.id === id)?.name || id;
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2">Accounts Payable</h1>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="me-2" />
                    New Invoice
                </Button>
            </div>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search invoices..."
                            className="border-start-0 shadow-none"
                        />
                    </InputGroup>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0 ps-4">Invoice #</th>
                                <th className="border-0">Supplier</th>
                                <th className="border-0">Date</th>
                                <th className="border-0">Due Date</th>
                                <th className="border-0">Status</th>
                                <th className="border-0 text-end pe-4">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={inv.id}>
                                    <td className="ps-4 fw-medium">{inv.invoice_number}</td>
                                    <td>{getSupplierName(inv.supplier_id)}</td>
                                    <td className="text-muted">{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="text-muted">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
                                    <td>
                                        <Badge bg={inv.status === "PAID" ? "success" : "warning"}>
                                            {inv.status}
                                        </Badge>
                                    </td>
                                    <td className="text-end pe-4">{inv.total_amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>New Supplier Invoice</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Invoice Number</Form.Label>
                            <Form.Control
                                type="text"
                                value={newInvoice.invoice_number}
                                onChange={(e) => setNewInvoice({ ...newInvoice, invoice_number: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Supplier</Form.Label>
                            <Form.Select
                                value={newInvoice.supplier_id}
                                onChange={(e) => setNewInvoice({ ...newInvoice, supplier_id: Number(e.target.value) })}
                            >
                                <option value={0}>Select Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Row className="mb-3">
                            <Col>
                                <Form.Label>Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={newInvoice.date}
                                    onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                                />
                            </Col>
                            <Col>
                                <Form.Label>Due Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={newInvoice.due_date}
                                    onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                                />
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Total Amount</Form.Label>
                            <Form.Control
                                type="number"
                                value={newInvoice.total_amount}
                                onChange={(e) => setNewInvoice({ ...newInvoice, total_amount: Number(e.target.value) })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreate}>Save Invoice</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
