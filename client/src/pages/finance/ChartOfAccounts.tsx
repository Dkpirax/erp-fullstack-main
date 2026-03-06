import { useState } from "react";
import { Card, Table, Badge, Button, Form } from "react-bootstrap";
import { Plus } from "lucide-react";
import { GenericModal } from "../../components/common/GenericModal";

const initialAccounts = [
    { code: "1000", name: "Cash", type: "Asset", balance: "$50,000.00" },
    { code: "1100", name: "Accounts Receivable", type: "Asset", balance: "$12,500.00" },
    { code: "2000", name: "Accounts Payable", type: "Liability", balance: "$8,200.00" },
    { code: "3000", name: "Owner's Equity", type: "Equity", balance: "$40,000.00" },
    { code: "4000", name: "Sales Revenue", type: "Revenue", balance: "$150,000.00" },
    { code: "5000", name: "Rent Expense", type: "Expense", balance: "$12,000.00" },
];

export function ChartOfAccounts() {
    const [accounts, setAccounts] = useState(initialAccounts);
    const [showModal, setShowModal] = useState(false);
    const [newAccount, setNewAccount] = useState({
        code: "",
        name: "",
        type: "Asset",
        balance: "$0.00"
    });

    const handleAddAccount = () => {
        setAccounts([...accounts, newAccount]);
        setShowModal(false);
        setNewAccount({ code: "", name: "", type: "Asset", balance: "$0.00" });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">Chart of Accounts</h1>
                <Button variant="primary" className="d-flex align-items-center" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="me-2" />
                    Add Account
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0 ps-4">Code</th>
                                <th className="border-0">Account Name</th>
                                <th className="border-0">Type</th>
                                <th className="border-0 pe-4 text-end">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((account) => (
                                <tr key={account.code}>
                                    <td className="ps-4 fw-medium">{account.code}</td>
                                    <td>{account.name}</td>
                                    <td>
                                        <Badge bg="secondary" className="fw-normal">
                                            {account.type}
                                        </Badge>
                                    </td>
                                    <td className="pe-4 text-end fw-bold">{account.balance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <GenericModal
                show={showModal}
                onHide={() => setShowModal(false)}
                title="Add New Account"
                onConfirm={handleAddAccount}
            >
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Account Code</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. 1001"
                            value={newAccount.code}
                            onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Account Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. Petty Cash"
                            value={newAccount.name}
                            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Type</Form.Label>
                        <Form.Select
                            value={newAccount.type}
                            onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                        >
                            <option value="Asset">Asset</option>
                            <option value="Liability">Liability</option>
                            <option value="Equity">Equity</option>
                            <option value="Revenue">Revenue</option>
                            <option value="Expense">Expense</option>
                        </Form.Select>
                    </Form.Group>
                </Form>
            </GenericModal>
        </div>
    );
}
