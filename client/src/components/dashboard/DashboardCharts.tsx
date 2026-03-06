import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Card, Row, Col, Form } from 'react-bootstrap';
import { getPOSOrders, type POSOrder, type APInvoice } from '../../lib/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export function DashboardCharts() {
    const [timeRange, setTimeRange] = useState('30'); // days
    const [posData, setPosData] = useState<POSOrder[]>([]);
    const [apData, setApData] = useState<APInvoice[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pos] = await Promise.all([getPOSOrders()]);
                // Ensure array
                const validPos = Array.isArray(pos) ? pos : [];
                setPosData(validPos);

                // TODO: Wire up AP Invoices real data when ready
                setApData([]);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            }
        };
        fetchData();
    }, []);

    // Helper to filter by date range
    const filterDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(timeRange));
        return date >= cutoff;
    };

    // Process Revenue (POS Sales) vs Expenses (AP Invoices)
    const processFinancialData = () => {
        const revenueByDate: Record<string, number> = {};
        const expensesByDate: Record<string, number> = {};

        // Process POS Orders as Revenue
        if (Array.isArray(posData)) {
            posData.filter(i => filterDate(i.created_at) && i.status === 'COMPLETED').forEach(order => {
                const date = new Date(order.created_at).toLocaleDateString();
                revenueByDate[date] = (revenueByDate[date] || 0) + order.total_amount;
            });
        }

        // Process AP Invoices as Expenses
        if (Array.isArray(apData)) {
            apData.filter(i => filterDate(i.date)).forEach(inv => {
                const date = new Date(inv.date).toLocaleDateString();
                expensesByDate[date] = (expensesByDate[date] || 0) + inv.total_amount;
            });
        }

        const labels = Array.from(new Set([...Object.keys(revenueByDate), ...Object.keys(expensesByDate)])).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        return {
            labels,
            datasets: [
                {
                    label: 'Sales Revenue',
                    data: labels.map(date => revenueByDate[date] || 0),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Expenses',
                    data: labels.map(date => expensesByDate[date] || 0),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    tension: 0.3,
                    fill: true
                }
            ]
        };
    };

    // Process Sales by Payment Method
    const processPaymentMethods = () => {

        // Actually, let's show "Top Selling Products" if possible? 
        // No, I don't have product details easily accessible without parsing items.
        // Let's show "Order Volume" (Count of orders)

        const ordersByDate: Record<string, number> = {};
        posData.filter(i => filterDate(i.created_at)).forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString();
            ordersByDate[date] = (ordersByDate[date] || 0) + 1;
        });

        const labels = Object.keys(ordersByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        return {
            labels,
            datasets: [
                {
                    label: 'Number of Orders',
                    data: labels.map(date => ordersByDate[date]),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                }
            ]
        };
    };

    return (
        <div>
            <div className="d-flex justify-content-end mb-3">
                <Form.Select
                    style={{ width: '200px' }}
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 3 Months</option>
                    <option value="365">Last Year</option>
                </Form.Select>
            </div>

            <Row className="g-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <Card.Title>Sales vs Expenses</Card.Title>
                            <Line options={{ responsive: true, plugins: { legend: { position: 'top' as const } } }} data={processFinancialData()} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <Card.Title>Daily Order Volume</Card.Title>
                            <div className="d-flex justify-content-center h-100 align-items-center">
                                <div style={{ width: '100%', height: '300px' }}>
                                    <Bar options={{ responsive: true, maintainAspectRatio: false }} data={processPaymentMethods()} />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
