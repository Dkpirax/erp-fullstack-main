import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Tabs, Tab, Alert, Spinner } from 'react-bootstrap';
import { Download, Printer, FileText } from 'lucide-react';
import { getCustomers, getProducts } from '../lib/api';
import type { Customer, Product } from '../lib/api';

export function ReportsPage() {
    const [activeTab, setActiveTab] = useState('customers');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [customersData, productsData] = await Promise.all([
                getCustomers(),
                getProducts()
            ]);
            setCustomers(customersData);
            setProducts(productsData);
        } catch (err) {
            setError('Failed to fetch report data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = (data: any[], filename: string) => {
        if (!data || !data.length) {
            alert("No data to export");
            return;
        }

        // Extract headers
        const headers = Object.keys(data[0]);

        // Create CSV rows
        const csvRows = [
            headers.join(','), // Header row
            ...data.map(row =>
                headers.map(fieldName => {
                    const value = row[fieldName as keyof typeof row];
                    // Handle strings with commas or quotes
                    const stringValue = value === null || value === undefined ? '' : String(value);
                    const escaped = stringValue.replace(/"/g, '""');
                    return `"${escaped}"`;
                }).join(',')
            )
        ];

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
                <h2>Reports Center</h2>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={handlePrint}>
                        <Printer size={18} className="me-2" /> Print / Save PDF
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                </div>
            ) : (
                <>
                    <div className="d-print-none">
                        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'customers')} className="mb-4">
                            <Tab eventKey="customers" title="Customer Base Report">
                                {/* Content rendered below to share print layout logic if needed, but Tabs handles switching */}
                            </Tab>
                            <Tab eventKey="products" title="Product Base Report">
                            </Tab>
                        </Tabs>
                    </div>

                    {/* Report Content - Visible based on activeTab (for screen) or forced for Print if we want specific layout */}

                    {/* Customer Report */}
                    {(activeTab === 'customers') && (
                        <Card className="mb-4 border-0">
                            <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom d-print-none">
                                <h5 className="mb-0"><FileText size={18} className="me-2" />Customer Base Report</h5>
                                <Button size="sm" variant="success" onClick={() => downloadCSV(customers, 'customers_report.csv')}>
                                    <Download size={16} className="me-1" /> Export CSV
                                </Button>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="d-none d-print-block mb-4">
                                    <h3>Customer Base Report</h3>
                                    <p className="text-muted">Generated on {new Date().toLocaleDateString()}</p>
                                </div>
                                <Table responsive striped bordered hover size="sm">
                                    <thead className="table-light">
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Company</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.map(c => (
                                            <tr key={c.id}>
                                                <td>{c.id}</td>
                                                <td>{c.name}</td>
                                                <td>{c.email || '-'}</td>
                                                <td>{c.phone || '-'}</td>
                                                <td>{c.company || '-'}</td>
                                                <td>{c.status || '-'}</td>
                                            </tr>
                                        ))}
                                        {customers.length === 0 && <tr><td colSpan={6} className="text-center">No customers found</td></tr>}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Product Report */}
                    {(activeTab === 'products') && (
                        <Card className="mb-4 border-0">
                            <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom d-print-none">
                                <h5 className="mb-0"><FileText size={18} className="me-2" />Product Base Report</h5>
                                <Button size="sm" variant="success" onClick={() => downloadCSV(products, 'products_report.csv')}>
                                    <Download size={16} className="me-1" /> Export CSV
                                </Button>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="d-none d-print-block mb-4">
                                    <h3>Product Base Report</h3>
                                    <p className="text-muted">Generated on {new Date().toLocaleDateString()}</p>
                                </div>
                                <Table responsive striped bordered hover size="sm">
                                    <thead className="table-light">
                                        <tr>
                                            <th>ID</th>
                                            <th>SKU</th>
                                            <th>Name</th>
                                            <th>Price</th>
                                            <th>Cost</th>
                                            <th>Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.id}>
                                                <td>{p.id}</td>
                                                <td>{p.sku}</td>
                                                <td>{p.name}</td>
                                                <td>${p.price}</td>
                                                <td>${p.cost_price}</td>
                                                <td>{p.quantity_in_stock}</td>
                                            </tr>
                                        ))}
                                        {products.length === 0 && <tr><td colSpan={6} className="text-center">No products found</td></tr>}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    )}
                </>
            )}

            <style>
                {`
                    @media print {
                        .d-print-none { display: none !important; }
                        .d-print-block { display: block !important; }
                        /* Ensure table borders print */
                        .table-bordered th, .table-bordered td { border: 1px solid #000 !important; }
                    }
                `}
            </style>
        </Container>
    );
}
