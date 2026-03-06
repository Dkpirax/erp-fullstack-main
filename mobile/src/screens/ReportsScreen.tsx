import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Colors } from '../theme/colors';
import { getPOSOrders, getProducts, getCustomers, type POSOrder } from '../lib/api';


interface ReportStat {
    label: string;
    value: string;
    icon: string;
    color: string;
}

export function ReportsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        totalRevenue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        avgOrderValue: 0,
        todayRevenue: 0,
        todayOrders: 0,
        recentOrders: [] as POSOrder[],
    });

    const fetchReports = async () => {
        try {
            const [orders, products, customers] = await Promise.all([
                getPOSOrders(), getProducts(), getCustomers(),
            ]);
            const validOrders = Array.isArray(orders) ? orders : [];
            const completed = validOrders.filter(o => o.status === 'COMPLETED');
            const pending = validOrders.filter(o => o.status === 'PENDING');
            const cancelled = validOrders.filter(o => o.status === 'CANCELLED');
            const totalRevenue = completed.reduce((s, o) => s + o.total_amount, 0);
            const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;
            const today = new Date().toDateString();
            const todayOrders = validOrders.filter(o => new Date(o.created_at).toDateString() === today);
            const todayRevenue = todayOrders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + o.total_amount, 0);

            setData({
                totalRevenue, completedOrders: completed.length,
                pendingOrders: pending.length, cancelledOrders: cancelled.length,
                totalProducts: products.length, totalCustomers: customers.length,
                avgOrderValue, todayRevenue,
                todayOrders: todayOrders.length,
                recentOrders: validOrders.slice(0, 10),
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchReports(); }, []);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

    const f = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const todayStats: ReportStat[] = [
        { label: "Today's Revenue", value: f(data.todayRevenue), icon: '💰', color: Colors.success },
        { label: "Today's Orders", value: data.todayOrders.toString(), icon: '📦', color: Colors.info },
    ];

    const allTimeStats: ReportStat[] = [
        { label: 'Total Revenue', value: f(data.totalRevenue), icon: '💵', color: Colors.primary },
        { label: 'Completed Orders', value: data.completedOrders.toString(), icon: '✅', color: Colors.success },
        { label: 'Pending Orders', value: data.pendingOrders.toString(), icon: '⏳', color: Colors.warning },
        { label: 'Cancelled Orders', value: data.cancelledOrders.toString(), icon: '❌', color: Colors.danger },
        { label: 'Avg. Order Value', value: f(data.avgOrderValue), icon: '📊', color: Colors.secondary },
        { label: 'Total Products', value: data.totalProducts.toString(), icon: '📦', color: Colors.info },
        { label: 'Total Customers', value: data.totalCustomers.toString(), icon: '👥', color: Colors.primaryLight },
    ];

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} tintColor={Colors.primary} />}
        >
            {/* Today */}
            <Text style={styles.sectionTitle}>📅 Today's Summary</Text>
            <View style={styles.gridTwo}>
                {todayStats.map(s => (
                    <View key={s.label} style={[styles.statCard, { borderColor: s.color + '40' }]}>
                        <Text style={styles.statIcon}>{s.icon}</Text>
                        <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* All Time */}
            <Text style={styles.sectionTitle}>📈 All-Time Statistics</Text>
            <View style={styles.gridTwo}>
                {allTimeStats.map(s => (
                    <View key={s.label} style={[styles.statCard, { borderColor: s.color + '30' }]}>
                        <Text style={styles.statIcon}>{s.icon}</Text>
                        <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* Recent Orders */}
            <Text style={styles.sectionTitle}>🕒 Recent Orders</Text>
            <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHead, { flex: 2 }]}>Order #</Text>
                    <Text style={[styles.tableHead, { flex: 2 }]}>Date</Text>
                    <Text style={[styles.tableHead, { flex: 1 }]}>Status</Text>
                    <Text style={[styles.tableHead, { flex: 1.5, textAlign: 'right' }]}>Amount</Text>
                </View>
                {data.recentOrders.map((o, i) => {
                    const statusColor = o.status === 'COMPLETED' ? Colors.success : o.status === 'PENDING' ? Colors.warning : Colors.danger;
                    return (
                        <View key={o.id} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                            <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>#{o.order_number}</Text>
                            <Text style={[styles.tableCell, { flex: 2, fontSize: 11 }]} numberOfLines={1}>
                                {new Date(o.created_at).toLocaleDateString()}
                            </Text>
                            <Text style={[styles.tableCell, { flex: 1, color: statusColor, fontSize: 10, fontWeight: '700' }]}>
                                {o.status}
                            </Text>
                            <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', color: Colors.primary, fontWeight: '700' }]}>
                                ${o.total_amount.toFixed(0)}
                            </Text>
                        </View>
                    );
                })}
                {data.recentOrders.length === 0 && (
                    <View style={styles.center}><Text style={styles.emptyText}>No orders found</Text></View>
                )}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: '700', margin: 16, marginBottom: 10 },
    gridTwo: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
    statCard: {
        width: '47%',
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        marginLeft: 4,
    },
    statIcon: { fontSize: 26, marginBottom: 10 },
    statValue: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
    statLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '500' },
    tableCard: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tableHead: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
    tableRowAlt: { backgroundColor: Colors.surface + '80' },
    tableCell: { color: Colors.text, fontSize: 12 },
    emptyText: { color: Colors.textSecondary, fontSize: 14, padding: 20 },
});
