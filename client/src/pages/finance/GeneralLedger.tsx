import { useState, useEffect } from "react";
import { Card, Table, Badge, Form, InputGroup, Button, Modal, Row, Col } from "react-bootstrap";
import { Search, Plus } from "lucide-react";
import { getJournalEntries, createJournalEntry, getAccounts, type JournalEntry, type JournalEntryCreate, type Account } from "../../lib/api";

export function GeneralLedger() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newEntry, setNewEntry] = useState<JournalEntryCreate>({
        date: new Date().toISOString().split('T')[0],
        description: "",
        reference: "",
        status: "DRAFT",
        lines: []
    });
    const [newLine, setNewLine] = useState({ account_id: 0, debit: 0, credit: 0, description: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [entriesData, accountsData] = await Promise.all([
                getJournalEntries(),
                getAccounts()
            ]);
            setEntries(entriesData);
            setAccounts(accountsData);
        } catch (error) {
            console.error("Failed to load data", error);
        }
    };

    const loadEntries = async () => {
        try {
            const data = await getJournalEntries();
            setEntries(data);
        } catch (error) {
            console.error("Failed to load journal entries", error);
        }
    };

    const handleCreate = async () => {
        try {
            await createJournalEntry(newEntry);
            setShowModal(false);
            loadEntries();
            setNewEntry({
                date: new Date().toISOString().split('T')[0],
                description: "",
                reference: "",
                status: "DRAFT",
                lines: []
            });
            setNewLine({ account_id: 0, debit: 0, credit: 0, description: "" });
        } catch (error) {
            console.error("Failed to create journal entry", error);
        }
    };

    const addLine = () => {
        if (newLine.account_id === 0) return;
        setNewEntry({ ...newEntry, lines: [...newEntry.lines, { ...newLine, account_id: Number(newLine.account_id) }] });
        setNewLine({ account_id: 0, debit: 0, credit: 0, description: "" });
    };

    const getAccountName = (id: number) => {
        return accounts.find(a => a.id === id)?.name || id;
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2">General Ledger</h1>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="me-2" />
                    New Journal Entry
                </Button>
            </div>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search transactions..."
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
                                <th className="border-0 ps-4">ID</th>
                                <th className="border-0">Date</th>
                                <th className="border-0">Description</th>
                                <th className="border-0">Reference</th>
                                <th className="border-0">Status</th>
                                <th className="border-0 text-end pe-4">Total Debit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry.id}>
                                    <td className="ps-4 fw-medium">{entry.id}</td>
                                    <td className="text-muted">{new Date(entry.date).toLocaleDateString()}</td>
                                    <td>{entry.description}</td>
                                    <td>{entry.reference}</td>
                                    <td>
                                        <Badge bg={entry.status === "POSTED" ? "success" : "secondary"}>
                                            {entry.status}
                                        </Badge>
                                    </td>
                                    <td className="text-end pe-4">
                                        {entry.lines.reduce((sum, line) => sum + line.debit, 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>New Journal Entry</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="mb-3">
                            <Col>
                                <Form.Label>Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={newEntry.date}
                                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                                />
                            </Col>
                            <Col>
                                <Form.Label>Reference</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newEntry.reference}
                                    onChange={(e) => setNewEntry({ ...newEntry, reference: e.target.value })}
                                />
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                type="text"
                                value={newEntry.description}
                                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                            />
                        </Form.Group>

                        <h6 className="mt-4 mb-3">Lines</h6>
                        <Table size="sm" bordered>
                            <thead>
                                <tr>
                                    <th>Account</th>
                                    <th>Description</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newEntry.lines.map((line, idx) => (
                                    <tr key={idx}>
                                        <td>{getAccountName(line.account_id)}</td>
                                        <td>{line.description}</td>
                                        <td>{line.debit}</td>
                                        <td>{line.credit}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td>
                                        <Form.Select
                                            value={newLine.account_id}
                                            onChange={(e) => setNewLine({ ...newLine, account_id: Number(e.target.value) })}
                                        >
                                            <option value={0}>Select Account</option>
                                            {accounts.map(a => (
                                                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                            ))}
                                        </Form.Select>
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="text"
                                            placeholder="Desc"
                                            value={newLine.description}
                                            onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            value={newLine.debit}
                                            onChange={(e) => setNewLine({ ...newLine, debit: Number(e.target.value) })}
                                        />
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            value={newLine.credit}
                                            onChange={(e) => setNewLine({ ...newLine, credit: Number(e.target.value) })}
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                        <Button variant="outline-primary" size="sm" onClick={addLine}>Add Line</Button>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreate}>Save Entry</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
