import { useState } from "react";
import { Card, Table, Button, Badge, Form } from "react-bootstrap";
import { Plus, Layers } from "lucide-react";
import { GenericModal } from "../../components/common/GenericModal";

const initialBoms = [
    { id: "BOM-001", product: "Office Chair X1", version: "1.0", components: 12, status: "Active" },
    { id: "BOM-002", product: "Executive Desk", version: "2.1", components: 8, status: "Active" },
    { id: "BOM-003", product: "Monitor Stand", version: "1.0", components: 4, status: "Draft" },
];

export function BOMList() {
    const [boms, setBoms] = useState(initialBoms);
    const [showModal, setShowModal] = useState(false);
    const [newBOM, setNewBOM] = useState({
        product: "",
        version: "",
        components: ""
    });

    const handleCreateBOM = () => {
        const bom = {
            id: `BOM-${String(boms.length + 1).padStart(3, '0')}`,
            product: newBOM.product,
            version: newBOM.version,
            components: parseInt(newBOM.components) || 0,
            status: "Draft"
        };

        setBoms([...boms, bom]);
        setShowModal(false);
        setNewBOM({ product: "", version: "", components: "" });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">Bill of Materials</h1>
                <Button variant="primary" className="d-flex align-items-center" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="me-2" />
                    Create BOM
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0 ps-4">BOM ID</th>
                                <th className="border-0">Product Name</th>
                                <th className="border-0">Version</th>
                                <th className="border-0">Components</th>
                                <th className="border-0 pe-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {boms.map((bom) => (
                                <tr key={bom.id}>
                                    <td className="ps-4 fw-medium">{bom.id}</td>
                                    <td>{bom.product}</td>
                                    <td>
                                        <Badge bg="light" text="dark" className="border">v{bom.version}</Badge>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <Layers size={14} className="me-2 text-muted" />
                                            {bom.components} items
                                        </div>
                                    </td>
                                    <td className="pe-4">
                                        <Badge bg={bom.status === 'Active' ? 'success' : 'secondary'}>
                                            {bom.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <GenericModal
                show={showModal}
                onHide={() => setShowModal(false)}
                title="Create Bill of Materials"
                onConfirm={handleCreateBOM}
                confirmText="Create BOM"
            >
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Product Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. Office Chair"
                            value={newBOM.product}
                            onChange={(e) => setNewBOM({ ...newBOM, product: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Version</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. 1.0"
                            value={newBOM.version}
                            onChange={(e) => setNewBOM({ ...newBOM, version: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Number of Components</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="e.g. 10"
                            value={newBOM.components}
                            onChange={(e) => setNewBOM({ ...newBOM, components: e.target.value })}
                        />
                    </Form.Group>
                </Form>
            </GenericModal>
        </div>
    );
}
