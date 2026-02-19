import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TouchableOpacity,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { getPOSOrders, type POSOrder } from '../../lib/api';

export function SalesHistoryScreen() {
    const [orders, setOrders] = useState<POSOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expanded, setExpanded] = useState<number | null>(null);

    const fetch = async () => {
        try {
            const data = await getPOSOrders();
            setOrders(Array.isArray(data) ? data.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ) : []);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const getStatusColor = (s: string) => {
        switch (s.toUpperCase()) {
            case 'COMPLETED': return Colors.success;
            case 'PENDING': return Colors.warning;
            case 'CANCELLED': return Colors.danger;
            default: return Colors.textMuted;
        }
    };

    const renderOrder = ({ item }: { item: POSOrder }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => setExpanded(expanded === item.id ? null : item.id)}
            activeOpacity={0.8}
        >
            <View style={styles.row}>
                <View>
                    <Text style={styles.orderNo}>#{item.order_number}</Text>
                    <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amount}>${item.total_amount.toFixed(2)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                </View>
            </View>
            {item.customer_name && (
                <Text style={styles.customer}>👤 {item.customer_name}</Text>
            )}
            {item.payment_method && (
                <Text style={styles.payMethod}>💳 {item.payment_method}</Text>
            )}
            {expanded === item.id && item.items?.length > 0 && (
                <View style={styles.expandedItems}>
                    <Text style={styles.itemsTitle}>Order Items:</Text>
                    {item.items.map((i, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemName}>{i.product_name || `Product #${i.product_id}`}</Text>
                            <Text style={styles.itemQty}>x{i.quantity}</Text>
                            <Text style={styles.itemTotal}>${i.total_price.toFixed(2)}</Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

    return (
        <View style={styles.container}>
            <Text style={styles.subtitle}>{orders.length} orders total</Text>
            <FlatList
                data={orders}
                keyExtractor={i => i.id.toString()}
                renderItem={renderOrder}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={Colors.primary} />}
                ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No orders found</Text></View>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    subtitle: { color: Colors.textMuted, fontSize: 12, margin: 16, marginBottom: 8 },
    list: { padding: 16, paddingTop: 0 },
    card: {
        backgroundColor: Colors.card, borderRadius: 16, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderNo: { color: Colors.text, fontSize: 16, fontWeight: '700' },
    date: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
    amount: { color: Colors.primary, fontSize: 18, fontWeight: '800' },
    statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
    statusText: { fontSize: 11, fontWeight: '700' },
    customer: { color: Colors.textSecondary, fontSize: 13, marginTop: 8 },
    payMethod: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
    expandedItems: { marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
    itemsTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    itemName: { flex: 1, color: Colors.text, fontSize: 13 },
    itemQty: { color: Colors.textMuted, fontSize: 13, width: 30, textAlign: 'center' },
    itemTotal: { color: Colors.success, fontSize: 13, fontWeight: '600', width: 70, textAlign: 'right' },
    emptyText: { color: Colors.textSecondary, fontSize: 16 },
});
