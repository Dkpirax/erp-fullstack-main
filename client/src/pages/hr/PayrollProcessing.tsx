import { useState } from "react";
import { Card, Table, Badge, Button, Form } from "react-bootstrap";
import { DollarSign, CheckCircle, Clock } from "lucide-react";
import { GenericModal } from "../../components/common/GenericModal";

const initialPayrolls = [
    { id: "PAY-2023-10", period: "October 2023", employees: 48, total: "$142,500.00", status: "Pending", date: "Oct 31, 2023" },
    { id: "PAY-2023-09", period: "September 2023", employees: 47, total: "$140,200.00", status: "Processed", date: "Sep 30, 2023" },
    { id: "PAY-2023-08", period: "August 2023", employees: 45, total: "$135,800.00", status: "Processed", date: "Aug 31, 2023" },
];

export function PayrollProcessing() {
    const [payrolls, setPayrolls] = useState(initialPayrolls);
    const [showModal, setShowModal] = useState(false);
    const [newPayroll, setNewPayroll] = useState({
        period: "",
        employees: 48,
        total: "",
        date: new Date().toISOString().split('T')[0]
    });

    const handleRunPayroll = () => {
        const payroll = {
            ...newPayroll,
            id: `PAY-${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
            status: "Pending",
            total: `$${newPayroll.total}`
        };
        setPayrolls([payroll, ...payrolls]);
        setShowModal(false);
        setNewPayroll({ period: "", employees: 48, total: "", date: new Date().toISOString().split('T')[0] });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">Payroll Processing</h1>
                <Button variant="primary" className="d-flex align-items-center" onClick={() => setShowModal(true)}>
                    <DollarSign size={18} className="me-2" />
                    Run Payroll
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0 ps-4">Payroll ID</th>
                                <th className="border-0">Period</th>
                                <th className="border-0">Employees</th>
                                <th className="border-0">Total Amount</th>
                                <th className="border-0">Payment Date</th>
                                <th className="border-0 pe-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrolls.map((payroll) => (
                                <tr key={payroll.id}>
                                    <td className="ps-4 fw-medium">{payroll.id}</td>
                                    <td>{payroll.period}</td>
                                    <td>{payroll.employees}</td>
                                    <td className="fw-bold">{payroll.total}</td>
                                    <td className="text-muted">{payroll.date}</td>
                                    <td className="pe-4">
                                        <Badge bg={payroll.status === 'Processed' ? 'success' : 'warning'} className="d-flex align-items-center w-auto d-inline-flex">
                                            {payroll.status === 'Processed' ? <CheckCircle size={12} className="me-1" /> : <Clock size={12} className="me-1" />}
                                            {payroll.status}
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
                title="Run New Payroll"
                onConfirm={handleRunPayroll}
                confirmText="Process Payroll"
            >
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Pay Period</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. November 2023"
                            value={newPayroll.period}
                            onChange={(e) => setNewPayroll({ ...newPayroll, period: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Total Employees</Form.Label>
                        <Form.Control
                            type="number"
                            value={newPayroll.employees}
                            onChange={(e) => setNewPayroll({ ...newPayroll, employees: parseInt(e.target.value) })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Total Amount</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="e.g. 150000"
                            value={newPayroll.total}
                            onChange={(e) => setNewPayroll({ ...newPayroll, total: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Payment Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={newPayroll.date}
                            onChange={(e) => setNewPayroll({ ...newPayroll, date: e.target.value })}
                        />
                    </Form.Group>
                </Form>
            </GenericModal>
        </div>
    );
}
