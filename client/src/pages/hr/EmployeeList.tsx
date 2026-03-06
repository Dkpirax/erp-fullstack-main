import { useState } from "react";
import { Card, Table, Badge, Button, Form, InputGroup } from "react-bootstrap";
import { Search, Plus, Mail, Briefcase } from "lucide-react";
import { GenericModal } from "../../components/common/GenericModal";

const initialEmployees = [
    { id: 1, name: "Alice Johnson", role: "Software Engineer", department: "Engineering", email: "alice@company.com", status: "Active" },
    { id: 2, name: "Bob Smith", role: "Product Manager", department: "Product", email: "bob@company.com", status: "Active" },
    { id: 3, name: "Charlie Brown", role: "HR Specialist", department: "Human Resources", email: "charlie@company.com", status: "On Leave" },
];

export function EmployeeList() {
    const [employees, setEmployees] = useState(initialEmployees);
    const [showModal, setShowModal] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        name: "",
        role: "",
        department: "Engineering",
        email: "",
        status: "Active"
    });

    const handleAddEmployee = () => {
        const employee = {
            ...newEmployee,
            id: employees.length + 1
        };
        setEmployees([...employees, employee]);
        setShowModal(false);
        setNewEmployee({ name: "", role: "", department: "Engineering", email: "", status: "Active" });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">Employee Directory</h1>
                <Button variant="primary" className="d-flex align-items-center" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="me-2" />
                    Add Employee
                </Button>
            </div>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search employees..."
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
                                <th className="border-0 ps-4">Name</th>
                                <th className="border-0">Role</th>
                                <th className="border-0">Department</th>
                                <th className="border-0">Email</th>
                                <th className="border-0 pe-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((employee) => (
                                <tr key={employee.id}>
                                    <td className="ps-4 fw-medium">{employee.name}</td>
                                    <td>
                                        <div className="d-flex align-items-center text-muted">
                                            <Briefcase size={14} className="me-2" /> {employee.role}
                                        </div>
                                    </td>
                                    <td>{employee.department}</td>
                                    <td>
                                        <div className="d-flex align-items-center text-muted">
                                            <Mail size={14} className="me-2" /> {employee.email}
                                        </div>
                                    </td>
                                    <td className="pe-4">
                                        <Badge bg={employee.status === 'Active' ? 'success' : 'warning'}>
                                            {employee.status}
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
                title="Add New Employee"
                onConfirm={handleAddEmployee}
            >
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. John Doe"
                            value={newEmployee.name}
                            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Role</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. Software Engineer"
                            value={newEmployee.role}
                            onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Department</Form.Label>
                        <Form.Select
                            value={newEmployee.department}
                            onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                        >
                            <option value="Engineering">Engineering</option>
                            <option value="Product">Product</option>
                            <option value="Human Resources">Human Resources</option>
                            <option value="Sales">Sales</option>
                            <option value="Marketing">Marketing</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="e.g. john@company.com"
                            value={newEmployee.email}
                            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                            value={newEmployee.status}
                            onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
                        >
                            <option value="Active">Active</option>
                            <option value="On Leave">On Leave</option>
                            <option value="Terminated">Terminated</option>
                        </Form.Select>
                    </Form.Group>
                </Form>
            </GenericModal>
        </div>
    );
}
