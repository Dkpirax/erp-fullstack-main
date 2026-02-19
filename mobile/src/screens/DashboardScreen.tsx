import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors } from '../theme/colors';
import { getPOSOrders, getProducts, getUsers } from '../lib/api';


interface StatCard {
    label: string;
    value: string;
    icon: string;
    color: string;
    bg: string;
}

export function DashboardScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ revenue: 0, ordersToday: 0, products: 0, users: 0 });

    const fetchStats = async () => {
        try {
            const [orders, products, users] = await Promise.all([
                getPOSOrders(), getProducts(), getUsers(),
            ]);
            const validOrders = Array.isArray(orders) ? orders : [];
            const revenue = validOrders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + o.total_amount, 0);
            const today = new Date().toDateString();
            const ordersToday = validOrders.filter(o => new Date(o.created_at).toDateString() === today).length;
            setStats({ revenue, ordersToday, products: products.length, users: users.length });
        } catch (e) {
            console.error('Dashboard error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    const statCards: StatCard[] = [
        { label: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: '💰', color: Colors.primary, bg: '#1a1a3e' },
        { label: 'Orders Today', value: stats.ordersToday.toString(), icon: '🛒', color: Colors.success, bg: '#0f2a1e' },
        { label: 'Products', value: stats.products.toString(), icon: '📦', color: Colors.warning, bg: '#2a1f0a' },
        { label: 'Users', value: stats.users.toString(), icon: '👥', color: Colors.info, bg: '#0a1f2a' },
    ];

    const quickLinks = [
        { label: 'POS', icon: '🏪', screen: 'POS' },
        { label: 'Finance', icon: '💳', screen: 'Finance' },
        { label: 'Inventory', icon: '📦', screen: 'SupplyChain' },
        { label: 'CRM', icon: '🤝', screen: 'CRM' },
        { label: 'HR', icon: '👨‍💼', screen: 'HR' },
        { label: 'Reports', icon: '📊', screen: 'Reports' },
    ];

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading Dashboard...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor={Colors.primary} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerGreeting}>Good morning 👋</Text>
                    <Text style={styles.headerTitle}>Dashboard Overview</Text>
                </View>
                <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            </View>

            {/* Stat Cards */}
            <View style={styles.statsGrid}>
                {statCards.map((s) => (
                    <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.color + '40' }]}>
                        <Text style={styles.statIcon}>{s.icon}</Text>
                        <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* Quick Access */}
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickGrid}>
                {quickLinks.map((link) => (
                    <TouchableOpacity key={link.label} style={styles.quickCard}>
                        <Text style={styles.quickIcon}>{link.icon}</Text>
                        <Text style={styles.quickLabel}>{link.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Recent Activity */}
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <View style={styles.activityCard}>
                <Text style={styles.activityHint}>Pull down to refresh data  ↑</Text>
                <View style={styles.activityRow}>
                    <Text style={styles.activityStat}>{stats.ordersToday}</Text>
                    <Text style={styles.activityLabel}>orders processed today</Text>
                </View>
                <View style={styles.activityRow}>
                    <Text style={[styles.activityStat, { color: Colors.success }]}>
                        ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.activityLabel}>total revenue (all time)</Text>
                </View>
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    loadingText: { color: Colors.textSecondary, marginTop: 12, fontSize: 14 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, paddingTop: 10,
    },
    headerGreeting: { color: Colors.textSecondary, fontSize: 14 },
    headerTitle: { color: Colors.text, fontSize: 22, fontWeight: '800', marginTop: 2 },
    liveBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: Colors.success + '20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
    liveText: { color: Colors.success, fontSize: 11, fontWeight: '700' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
    statCard: {
        width: '47%', borderRadius: 16, padding: 16, borderWidth: 1,
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    statIcon: { fontSize: 28, marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    statLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
    sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', margin: 20, marginBottom: 12 },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
    quickCard: {
        width: '30%', backgroundColor: Colors.card, borderRadius: 16, padding: 16,
        alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder,
    },
    quickIcon: { fontSize: 28, marginBottom: 8 },
    quickLabel: { color: Colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    activityCard: {
        margin: 16, backgroundColor: Colors.card, borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    activityHint: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 16 },
    activityRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
    activityStat: { color: Colors.primary, fontSize: 24, fontWeight: '800' },
    activityLabel: { color: Colors.textSecondary, fontSize: 14 },
});
