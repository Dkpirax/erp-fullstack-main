import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, Badge, Tabs, Tab, Spinner } from 'react-bootstrap';
import { Edit2, Trash2, Plus, Phone as PhoneIcon, Mail, Upload, X, Image as ImageIcon, CheckCircle } from 'lucide-react';
import {
    getCompanies, createCompany, updateCompany, uploadCompanyLogo,
    getBranches, createBranch, updateBranch, deleteBranch,
    type Company, type Branch
} from '../../lib/api';

export function OrganizationSettings() {
    const [activeTab, setActiveTab] = useState('company');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal States
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [companyForm, setCompanyForm] = useState({
        name: '', address: '', phone: '', email: '', tax_id: '', website: '',
        bank_name: '', account_number: '', account_name: '', iban: '', swift: ''
    });

    const [showBranchModal, setShowBranchModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [branchForm, setBranchForm] = useState({
        company_id: 0, name: '', address: '', phone: '', email: '', manager_name: '', is_main: false
    });

    // ── Logo Upload State ────────────────────────────────────────────────────
    const [logoCompany, setLogoCompany] = useState<Company | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [companiesData, branchesData] = await Promise.all([
                getCompanies(),
                getBranches()
            ]);
            setCompanies(companiesData);
            setBranches(branchesData);
        } catch (err) {
            setError('Failed to fetch organization data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Company Handlers ---
    const handleCompanyModal = (company?: Company) => {
        if (company) {
            setEditingCompany(company);
            setCompanyForm({
                name: company.name,
                address: company.address || '',
                phone: company.phone || '',
                email: company.email || '',
                tax_id: company.tax_id || '',
                website: company.website || '',
                bank_name: company.bank_name || '',
                account_number: company.account_number || '',
                account_name: company.account_name || '',
                iban: company.iban || '',
                swift: company.swift || ''
            });
        } else {
            setEditingCompany(null);
            setCompanyForm({
                name: '', address: '', phone: '', email: '', tax_id: '', website: '',
                bank_name: '', account_number: '', account_name: '', iban: '', swift: ''
            });
        }
        setShowCompanyModal(true);
    };

    const handleCompanySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCompany) {
                await updateCompany(editingCompany.id, companyForm);
            } else {
                await createCompany(companyForm);
            }
            await fetchData();
            setShowCompanyModal(false);
        } catch (err) {
            setError('Failed to save company');
        }
    };

    // --- Branch Handlers ---
    const handleBranchModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setBranchForm({
                company_id: branch.company_id,
                name: branch.name,
                address: branch.address || '',
                phone: branch.phone || '',
                email: branch.email || '',
                manager_name: branch.manager_name || '',
                is_main: branch.is_main
            });
        } else {
            setEditingBranch(null);
            setBranchForm({
                company_id: companies.length > 0 ? companies[0].id : 0,
                name: '', address: '', phone: '', email: '', manager_name: '', is_main: false
            });
        }
        setShowBranchModal(true);
    };

    const handleBranchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                await updateBranch(editingBranch.id, branchForm);
            } else {
                await createBranch(branchForm);
            }
            await fetchData();
            setShowBranchModal(false);
        } catch (err) {
            setError('Failed to save branch');
        }
    };

    const handleBranchDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this branch?')) return;
        try {
            await deleteBranch(id);
            await fetchData();
        } catch (err) {
            setError('Failed to delete branch');
        }
    };

    // ── Logo Upload Handlers ─────────────────────────────────────────────────
    const openLogoUpload = (company: Company) => {
        setLogoCompany(company);
        setLogoFile(null);
        setLogoPreview(company.logo_url ? `/api/v1${company.logo_url}` : null);
        setIsDragging(false);
    };

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (PNG, JPG, SVG, etc.)');
            return;
        }
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleLogoUpload = async () => {
        if (!logoFile || !logoCompany) return;
        setUploading(true);
        setError('');
        try {
            const result = await uploadCompanyLogo(logoCompany.id, logoFile);
            // Update the company in local state immediately
            setCompanies(prev => prev.map(c =>
                c.id === logoCompany.id ? { ...c, logo_url: result.logo_url } : c
            ));
            setSuccess(`Logo uploaded successfully for ${logoCompany.name}!`);
            setLogoCompany(null);
            setLogoFile(null);
            setLogoPreview(null);
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to upload logo');
        } finally {
            setUploading(false);
        }
    };

    const logoUrl = (company: Company) =>
        company.logo_url ? `/api/v1${company.logo_url}` : null;

    return (
        <Container className="py-4">
            <h2 className="mb-4">Organization Settings</h2>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'company')} className="mb-4">
                <Tab eventKey="company" title="Company Details">
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                            <h5 className="mb-0">Companies</h5>
                            <Button size="sm" onClick={() => handleCompanyModal()}>
                                <Plus size={16} className="me-1" /> Add Company
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th style={{ width: 72 }}>Logo</th>
                                        <th>Name</th>
                                        <th>Tax ID</th>
                                        <th>Contact</th>
                                        <th>Address</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map(company => (
                                        <tr key={company.id}>
                                            <td>
                                                <div
                                                    style={{
                                                        width: 52, height: 52, borderRadius: 8,
                                                        overflow: 'hidden', border: '1px solid #dee2e6',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: '#f8f9fa', cursor: 'pointer',
                                                        position: 'relative'
                                                    }}
                                                    title="Click to upload logo"
                                                    onClick={() => openLogoUpload(company)}
                                                >
                                                    {logoUrl(company) ? (
                                                        <img
                                                            src={logoUrl(company)!}
                                                            alt="logo"
                                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div style={{ textAlign: 'center', color: '#adb5bd' }}>
                                                            <ImageIcon size={20} />
                                                            <div style={{ fontSize: 9, marginTop: 2 }}>Upload</div>
                                                        </div>
                                                    )}
                                                    {/* Hover overlay */}
                                                    <div style={{
                                                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        opacity: 0, transition: 'opacity 0.2s',
                                                        borderRadius: 8
                                                    }}
                                                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                                                    >
                                                        <Upload size={16} color="white" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="fw-bold align-middle">{company.name}</td>
                                            <td className="align-middle">{company.tax_id || '-'}</td>
                                            <td className="align-middle">
                                                <div className="small text-muted">
                                                    {company.phone && <div><PhoneIcon size={12} className="me-1" />{company.phone}</div>}
                                                    {company.email && <div><Mail size={12} className="me-1" />{company.email}</div>}
                                                </div>
                                            </td>
                                            <td className="small align-middle">{company.address}</td>
                                            <td className="align-middle">
                                                <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleCompanyModal(company)}>
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button variant="outline-secondary" size="sm" title="Upload Logo" onClick={() => openLogoUpload(company)}>
                                                    <Upload size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {companies.length === 0 && !loading && (
                                        <tr><td colSpan={6} className="text-center py-4 muted">No companies found. Add one to get started.</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="branches" title="Branches">
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                            <h5 className="mb-0">Branch Locations</h5>
                            <Button size="sm" onClick={() => handleBranchModal()} disabled={companies.length === 0}>
                                <Plus size={16} className="me-1" /> Add Branch
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Branch Name</th>
                                        <th>Company</th>
                                        <th>Manager</th>
                                        <th>Type</th>
                                        <th>Contact</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branches.map(branch => (
                                        <tr key={branch.id}>
                                            <td className="fw-bold">{branch.name}</td>
                                            <td>{branch.Company?.name}</td>
                                            <td>{branch.manager_name || '-'}</td>
                                            <td>
                                                {branch.is_main ? <Badge bg="success">Main HQ</Badge> : <Badge bg="secondary">Branch</Badge>}
                                            </td>
                                            <td className="small">
                                                {branch.phone && <div><PhoneIcon size={12} className="me-1" />{branch.phone}</div>}
                                                {branch.address && <div className="text-muted text-truncate" style={{ maxWidth: '150px' }}>{branch.address}</div>}
                                            </td>
                                            <td>
                                                <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleBranchModal(branch)}>
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => handleBranchDelete(branch.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {branches.length === 0 && !loading && (
                                        <tr><td colSpan={6} className="text-center py-4 muted">No branches found.</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* ── Company Modal ─────────────────────────────────────────────────── */}
            <Modal show={showCompanyModal} onHide={() => setShowCompanyModal(false)}>
                <Form onSubmit={handleCompanySubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingCompany ? 'Edit Company' : 'Add Company'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Company Name *</Form.Label>
                            <Form.Control required value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Tax ID</Form.Label>
                            <Form.Control value={companyForm.tax_id} onChange={e => setCompanyForm({ ...companyForm, tax_id: e.target.value })} />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Website</Form.Label>
                            <Form.Control value={companyForm.website} onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control as="textarea" rows={3} value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} />
                        </Form.Group>

                        <h6 className="mt-4 mb-3 border-bottom pb-2">Bank Details (For Invoicing)</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Bank Name</Form.Label>
                                    <Form.Control value={companyForm.bank_name} onChange={e => setCompanyForm({ ...companyForm, bank_name: e.target.value })} placeholder="e.g. Chase Bank" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Account Name</Form.Label>
                                    <Form.Control value={companyForm.account_name} onChange={e => setCompanyForm({ ...companyForm, account_name: e.target.value })} placeholder="Account Holder Name" />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Account Number</Form.Label>
                                    <Form.Control value={companyForm.account_number} onChange={e => setCompanyForm({ ...companyForm, account_number: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>IBAN / Swift</Form.Label>
                                    <Form.Control value={companyForm.iban} onChange={e => setCompanyForm({ ...companyForm, iban: e.target.value })} placeholder="IBAN or Swift Code" />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCompanyModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Save Company</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* ── Branch Modal ──────────────────────────────────────────────────── */}
            <Modal show={showBranchModal} onHide={() => setShowBranchModal(false)}>
                <Form onSubmit={handleBranchSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingBranch ? 'Edit Branch' : 'Add Branch'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Parent Company *</Form.Label>
                            <Form.Select
                                value={branchForm.company_id}
                                onChange={e => setBranchForm({ ...branchForm, company_id: parseInt(e.target.value) })}
                                required
                            >
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Branch Name *</Form.Label>
                            <Form.Control required value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                label="Is Main Headquarters?"
                                checked={branchForm.is_main}
                                onChange={e => setBranchForm({ ...branchForm, is_main: e.target.checked })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Manager Name</Form.Label>
                            <Form.Control value={branchForm.manager_name} onChange={e => setBranchForm({ ...branchForm, manager_name: e.target.value })} />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" value={branchForm.email} onChange={e => setBranchForm({ ...branchForm, email: e.target.value })} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control as="textarea" rows={3} value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowBranchModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Save Branch</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* ── Logo Upload Modal ─────────────────────────────────────────────── */}
            <Modal show={!!logoCompany} onHide={() => { setLogoCompany(null); setLogoFile(null); setLogoPreview(null); }} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Upload size={20} />
                        Upload Company Logo
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {logoCompany && (
                        <>
                            <p className="text-muted mb-3">
                                Uploading logo for <strong>{logoCompany.name}</strong>.
                                Recommended: transparent PNG or SVG, min 200×200 px, max 5 MB.
                            </p>

                            {/* Current logo preview */}
                            {logoPreview && (
                                <div className="text-center mb-3">
                                    <div style={{
                                        display: 'inline-block', padding: 8, borderRadius: 12,
                                        border: '1px solid #dee2e6', background: '#f8f9fa', position: 'relative'
                                    }}>
                                        <img
                                            src={logoPreview}
                                            alt="Preview"
                                            style={{ maxWidth: 180, maxHeight: 180, objectFit: 'contain', borderRadius: 8 }}
                                        />
                                        {logoFile && (
                                            <button
                                                style={{
                                                    position: 'absolute', top: -10, right: -10,
                                                    background: '#dc3545', border: 'none', borderRadius: '50%',
                                                    width: 24, height: 24, display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', cursor: 'pointer', color: 'white'
                                                }}
                                                onClick={() => { setLogoFile(null); setLogoPreview(logoCompany.logo_url ? `/api/v1${logoCompany.logo_url}` : null); }}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {logoFile && (
                                        <div className="mt-2 small text-success d-flex align-items-center justify-content-center gap-1">
                                            <CheckCircle size={14} /> {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Drop Zone */}
                            <div
                                style={{
                                    border: `2px dashed ${isDragging ? '#0d6efd' : '#ced4da'}`,
                                    borderRadius: 12, padding: '32px 24px', textAlign: 'center',
                                    background: isDragging ? '#f0f6ff' : '#fafafa',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={32} color={isDragging ? '#0d6efd' : '#adb5bd'} style={{ marginBottom: 8 }} />
                                <div className="fw-semibold" style={{ color: isDragging ? '#0d6efd' : '#495057' }}>
                                    {isDragging ? 'Drop it here!' : 'Drag & drop your logo here'}
                                </div>
                                <div className="text-muted small mt-1">or click to browse files</div>
                                <div className="text-muted" style={{ fontSize: 11, marginTop: 8 }}>PNG, JPG, SVG, WebP — up to 5 MB</div>
                            </div>

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                    e.target.value = '';
                                }}
                            />
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setLogoCompany(null); setLogoFile(null); setLogoPreview(null); }}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleLogoUpload}
                        disabled={!logoFile || uploading}
                    >
                        {uploading ? (
                            <><Spinner size="sm" className="me-2" />Uploading…</>
                        ) : (
                            <><Upload size={16} className="me-1" />Upload Logo</>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
