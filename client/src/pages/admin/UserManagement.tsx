import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge, Spinner } from 'react-bootstrap';
import { UserPlus, Edit2, Trash2, Shield, User as UserIcon } from 'lucide-react';
import {
    getUsers, createUser, updateUser, deleteUser, getBranches,
    type User, type UserCreate, type Branch
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export function UserManagement() {
    const { user: currentUser, checkPermission } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'pos_user',
        branch_id: 0,
        is_superuser: false,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersData, branchesData] = await Promise.all([
                getUsers(),
                getBranches()
            ]);
            setUsers(usersData);
            setBranches(branchesData);
        } catch (err: any) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                email: user.email,
                password: '',
                full_name: user.full_name || '',
                role: user.role || 'pos_user',
                branch_id: user.branch_id || 0,
                is_superuser: user.is_superuser,
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                email: '',
                password: '',
                full_name: '',
                role: 'pos_user',
                branch_id: 0,
                is_superuser: false,
            });
        }
        setShowModal(true);
        setError('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate Branch
        if (formData.role !== 'admin' && (!formData.branch_id || formData.branch_id === 0)) {
            setError('Branch is required for non-admin users');
            return;
        }

        try {
            if (editingUser) {
                // Update existing user
                const updateData: any = {
                    username: formData.username,
                    email: formData.email,
                    full_name: formData.full_name,
                    role: formData.role,
                    branch_id: formData.branch_id || null,
                    is_superuser: formData.role === 'admin' ? true : formData.is_superuser,
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await updateUser(editingUser.id, updateData);
            } else {
                // Create new user
                const newUser: UserCreate = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                    role: formData.role,
                    branch_id: formData.branch_id || null,
                    is_superuser: formData.role === 'admin' ? true : formData.is_superuser,
                };
                await createUser(newUser);
            }
            await fetchData();
            handleCloseModal();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save user');
        }
    };

    const handleDelete = async (userId: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            await deleteUser(userId);
            await fetchData();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete user');
        }
    };

    if (!checkPermission('users', 'read')) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    You don't have permission to access this page.
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>User Management</h2>
                {checkPermission('users', 'create') && (
                    <Button variant="primary" onClick={() => handleShowModal()}>
                        <UserPlus size={18} className="me-2" />
                        Add User
                    </Button>
                )}
            </div>

            {error && !showModal && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Card>
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Full Name</th>
                                    <th>Role</th>
                                    <th>Branch</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                {user.is_superuser ? (
                                                    <Shield size={16} className="text-danger me-2" />
                                                ) : (
                                                    <UserIcon size={16} className="text-muted me-2" />
                                                )}
                                                {user.username}
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>{user.full_name || '-'}</td>
                                        <td>
                                            <Badge bg="info" text="dark" className="text-uppercase">{user.role}</Badge>
                                        </td>
                                        <td>
                                            {user.Branch ? user.Branch.name : <em className="text-muted">-</em>}
                                        </td>
                                        <td>
                                            {user.is_active ? (
                                                <Badge bg="success">Active</Badge>
                                            ) : (
                                                <Badge bg="secondary">Inactive</Badge>
                                            )}
                                        </td>
                                        <td>
                                            {checkPermission('users', 'update') && (
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleShowModal(user)}
                                                >
                                                    <Edit2 size={14} />
                                                </Button>
                                            )}
                                            {checkPermission('users', 'delete') && (
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(user.id)}
                                                    disabled={user.id === currentUser?.id}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Create/Edit User Modal */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingUser ? 'Edit User' : 'Create New User'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && (
                            <Alert variant="danger" className="mb-3">
                                {error}
                            </Alert>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Username *</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Email *</Form.Label>
                            <Form.Control
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Password {editingUser ? '(leave blank to keep current)' : '*'}
                            </Form.Label>
                            <Form.Control
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Role *</Form.Label>
                            <Form.Select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="pos_user">POS User</option>
                                <option value="sales">Sales</option>
                                <option value="accountant">Accountant</option>
                                <option value="hr">HR</option>
                                <option value="inventory">Inventory</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </Form.Select>
                        </Form.Group>

                        {formData.role !== 'admin' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Branch *</Form.Label>
                                <Form.Select
                                    value={formData.branch_id}
                                    onChange={(e) => setFormData({ ...formData, branch_id: Number(e.target.value) })}
                                    required={formData.role !== 'admin'}
                                >
                                    <option value={0}>Select Branch</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </Form.Select>
                                {branches.length === 0 && (
                                    <Form.Text className="text-danger">
                                        No branches found. Please create a branch in Organization Settings first.
                                    </Form.Text>
                                )}
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Super Admin Access"
                                checked={formData.is_superuser}
                                onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                                disabled={formData.role === 'admin'} // Admin implies superuser usually, but let's keep it separate or auto-check
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingUser ? 'Update User' : 'Create User'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}
