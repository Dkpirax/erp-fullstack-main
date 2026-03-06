import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Save, Shield } from 'lucide-react';
import { getPermissions, savePermission, type RolePermission } from '../../lib/api';

const ROLES = ['admin', 'manager', 'sales', 'accountant', 'hr', 'inventory', 'pos_user'];
const RESOURCES = [
    { key: 'users', label: 'User Management' },
    { key: 'organization', label: 'Organization Settings' },
    { key: 'suppliers', label: 'Supplier Management' },
    { key: 'inventory', label: 'Inventory Management' },
    { key: 'pos', label: 'Point of Sale' },
    { key: 'sales_history', label: 'Sales History' },
    { key: 'reports', label: 'Reports' },
    { key: 'finance', label: 'Finance' },
    { key: 'crm', label: 'CRM' },
    { key: 'hr', label: 'HR Management' },
    { key: 'manufacturing', label: 'Manufacturing' }
];

export function PrivilegeManagement() {
    const [selectedRole, setSelectedRole] = useState<string>('manager');
    const [permissions, setPermissions] = useState<RolePermission[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const data = await getPermissions();
            setPermissions(data);
        } catch (err: any) {
            setError('Failed to fetch permissions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPermission = (resource: string) => {
        return permissions.find(p => p.role === selectedRole && p.resource === resource) || {
            role: selectedRole,
            resource: resource,
            can_create: false,
            can_read: false,
            can_update: false,
            can_delete: false
        };
    };

    const handleToggle = (resource: string, action: 'can_create' | 'can_read' | 'can_update' | 'can_delete') => {
        const currentPerm = getPermission(resource);
        const updatedPerm = { ...currentPerm, [action]: !currentPerm[action] };

        // Optimistic update
        const otherPerms = permissions.filter(p => !(p.role === selectedRole && p.resource === resource));
        setPermissions([...otherPerms, updatedPerm]);
    };

    const handleSave = async (resource: string) => {
        const perm = getPermission(resource);
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await savePermission(perm);
            setSuccess(`Permissions saved for ${resource}`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(`Failed to save permissions for ${resource}`);
        } finally {
            setSaving(false);
        }
    };

    // Bulk save for the current role
    const handleSaveAll = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            // We need to save essentially everything displayed, including those not yet in `permissions` array (defaults)
            // But for simplicity, let's just save the ones we have in state or generate default ones to save
            const promises = RESOURCES.map(res => savePermission(getPermission(res.key)));
            await Promise.all(promises);

            setSuccess(`All permissions saved for role: ${selectedRole}`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError("Failed to save all permissions");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1"><Shield className="me-2" />Privilege Management</h2>
                    <p className="text-muted">Manage access control for different user roles.</p>
                </div>
                <div>
                    <Button variant="success" onClick={handleSaveAll} disabled={saving}>
                        <Save size={18} className="me-2" />
                        {saving ? 'Saving...' : `Save All for ${selectedRole.toUpperCase()}`}
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <Card className="shadow-sm">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex align-items-center">
                        <label className="me-3 fw-bold">Select Role:</label>
                        <Form.Select
                            style={{ width: '200px' }}
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            {ROLES.map(role => (
                                <option key={role} value={role}>{role.toUpperCase().replace('_', ' ')}</option>
                            ))}
                        </Form.Select>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4">Resource / Page</th>
                                    <th className="text-center">Create</th>
                                    <th className="text-center">Read / View</th>
                                    <th className="text-center">Update / Edit</th>
                                    <th className="text-center">Delete</th>
                                    <th className="text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {RESOURCES.map((resource) => {
                                    const perm = getPermission(resource.key);
                                    return (
                                        <tr key={resource.key}>
                                            <td className="ps-4 fw-medium">{resource.label}</td>
                                            <td className="text-center">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={perm.can_create}
                                                    onChange={() => handleToggle(resource.key, 'can_create')}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={perm.can_read}
                                                    onChange={() => handleToggle(resource.key, 'can_read')}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={perm.can_update}
                                                    onChange={() => handleToggle(resource.key, 'can_update')}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={perm.can_delete}
                                                    onChange={() => handleToggle(resource.key, 'can_delete')}
                                                />
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button size="sm" variant="outline-primary" onClick={() => handleSave(resource.key)}>
                                                    Save
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}
