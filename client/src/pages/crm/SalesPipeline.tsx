import { useState } from "react";
import { Card, Badge, Button, Form } from "react-bootstrap";
import { Plus, MoreHorizontal, DollarSign } from "lucide-react";
import { GenericModal } from "../../components/common/GenericModal";

const initialStages = [
    {
        id: "new", name: "New Lead", color: "info", items: [
            { id: 1, title: "Website Inquiry", value: "$5,000", company: "TechStart Inc" },
            { id: 2, title: "Referral", value: "$12,000", company: "Design Co" }
        ]
    },
    {
        id: "qualified", name: "Qualified", color: "primary", items: [
            { id: 3, title: "Enterprise Plan", value: "$50,000", company: "Big Corp" }
        ]
    },
    {
        id: "proposal", name: "Proposal", color: "warning", items: [
            { id: 4, title: "Consulting Project", value: "$25,000", company: "Consultancy LLC" }
        ]
    },
    {
        id: "won", name: "Closed Won", color: "success", items: [
            { id: 5, title: "Annual Subscription", value: "$10,000", company: "Small Biz" }
        ]
    }
];

export function SalesPipeline() {
    const [stages, setStages] = useState(initialStages);
    const [showModal, setShowModal] = useState(false);
    const [newDeal, setNewDeal] = useState({
        title: "",
        value: "",
        company: "",
        stageId: "new"
    });

    const handleAddDeal = () => {
        const deal = {
            id: Date.now(),
            title: newDeal.title,
            value: newDeal.value.startsWith("$") ? newDeal.value : `$${newDeal.value}`,
            company: newDeal.company
        };

        setStages(stages.map(stage => {
            if (stage.id === newDeal.stageId) {
                return { ...stage, items: [...stage.items, deal] };
            }
            return stage;
        }));

        setShowModal(false);
        setNewDeal({ title: "", value: "", company: "", stageId: "new" });
    };

    return (
        <div className="h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">Sales Pipeline</h1>
                <Button variant="primary" className="d-flex align-items-center" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="me-2" />
                    Add Deal
                </Button>
            </div>

            <div className="flex-grow-1 overflow-auto">
                <div className="d-flex gap-4 pb-4" style={{ minWidth: '1000px' }}>
                    {stages.map((stage) => (
                        <div key={stage.id} style={{ width: '300px', minWidth: '300px' }}>
                            <div className={`d-flex justify-content-between align-items-center mb-3 p-2 rounded bg-${stage.color}-subtle`}>
                                <span className={`fw-bold text-${stage.color}`}>{stage.name}</span>
                                <Badge bg={stage.color} pill>{stage.items.length}</Badge>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {stage.items.map((item) => (
                                    <Card key={item.id} className="border-0 shadow-sm cursor-pointer hover-shadow transition">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="mb-0">{item.title}</h6>
                                                <Button variant="link" className="p-0 text-muted">
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </div>
                                            <div className="text-muted small mb-3">{item.company}</div>
                                            <div className="d-flex align-items-center fw-bold text-success">
                                                <DollarSign size={14} className="me-1" />
                                                {item.value}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                                <Button variant="light" className="w-100 text-muted border-dashed" onClick={() => {
                                    setNewDeal({ ...newDeal, stageId: stage.id });
                                    setShowModal(true);
                                }}>
                                    <Plus size={16} className="me-2" /> Add Item
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <GenericModal
                show={showModal}
                onHide={() => setShowModal(false)}
                title="Add New Deal"
                onConfirm={handleAddDeal}
                confirmText="Add Deal"
            >
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Deal Title</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. Enterprise License"
                            value={newDeal.title}
                            onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Company</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. Acme Corp"
                            value={newDeal.company}
                            onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Value</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. 5000"
                            value={newDeal.value}
                            onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Stage</Form.Label>
                        <Form.Select
                            value={newDeal.stageId}
                            onChange={(e) => setNewDeal({ ...newDeal, stageId: e.target.value })}
                        >
                            {stages.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Form>
            </GenericModal>
        </div>
    );
}
