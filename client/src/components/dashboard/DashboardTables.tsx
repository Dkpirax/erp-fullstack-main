import { useEffect, useState } from 'react';
import { Table, Card, Badge, Spinner } from 'react-bootstrap';
import { getPOSOrders, getProducts, type POSOrder, type Product } from '../../lib/api';

export function DashboardTables() {
    const [orders, setOrders] = useState<POSOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersData, productsData] = await Promise.all([
                    getPOSOrders(),
                    getProducts()
                ]);
                setOrders(ordersData);
                setProducts(productsData);
            } catch (error) {
                console.error("Error fetching dashboard table data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="text-center p-3"><Spinner animation="border" size="sm" /></div>;
    }

    // Process Recent Orders (Sort by date desc, take top 5)
    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    // Process Low Stock Products (quantity < 20)
    const lowStockProducts = products && products
        .filter(p => p.quantity_in_stock < 20)
        .sort((a, b) => a.quantity_in_stock - b.quantity_in_stock)
        .slice(0, 5);

    return (
        <div className="row g-4 mt-2">
            {/* Recent Sales Table */}
            <div className="col-lg-6">
                <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-white border-0 py-3">
                        <h5 className="mb-0 fw-bold">Recent Sales</h5>
                    </Card.Header>
                    <Table responsive hover className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0">Order #</th>
                                <th className="border-0">Date</th>
                                <th className="border-0">Status</th>
                                <th className="border-0 text-end">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length > 0 ? (
                                recentOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="align-middle">#{order.id.toString().padStart(6, '0')}</td>
                                        <td className="align-middle">
                                            {new Date(order.created_at).toLocaleDateString()}
                                            <small className="text-muted d-block">{new Date(order.created_at).toLocaleTimeString()}</small>
                                        </td>
                                        <td className="align-middle">
                                            <Badge bg={order.status === 'COMPLETED' ? 'success' : 'warning'} className="fw-normal">
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="align-middle text-end fw-bold">
                                            ${Number(order.total_amount || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-3 text-muted">No recent sales</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            </div>

            {/* Low Stock Inventory Table */}
            <div className="col-lg-6">
                <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">Low Stock Alert</h5>
                        <Badge bg="danger" className="rounded-pill">{lowStockProducts?.length}</Badge>
                    </Card.Header>
                    <Table responsive hover className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="border-0">Product</th>
                                <th className="border-0">SKU</th>
                                <th className="border-0 text-center">Stock</th>
                                <th className="border-0 text-end">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStockProducts?.length > 0 ? (
                                lowStockProducts?.map(product => (
                                    <tr key={product.id}>
                                        <td className="align-middle fw-medium text-truncate" style={{ maxWidth: '150px' }}>
                                            {product.name}
                                        </td>
                                        <td className="align-middle small text-muted">{product.sku}</td>
                                        <td className="align-middle text-center">
                                            <Badge bg={product.quantity_in_stock === 0 ? 'danger' : 'warning'} text="dark">
                                                {product.quantity_in_stock}
                                            </Badge>
                                        </td>
                                        <td className="align-middle text-end">
                                            ${product.price ? Number(product.price || 0).toFixed(2) : '0.00'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-3 text-muted">No low stock items</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}
