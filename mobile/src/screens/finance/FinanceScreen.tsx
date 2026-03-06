import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { getAccounts, type Account } from '../../lib/api';

export function FinanceScreen() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetch = async () => {
        try {
            const data = await getAccounts();
            setAccounts(data);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const totalAssets = accounts.filter(a => a.type === 'ASSET').reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = accounts.filter(a => a.type === 'LIABILITY').reduce((s, a) => s + a.balance, 0);
    const totalEquity = accounts.filter(a => a.type === 'EQUITY').reduce((s, a) => s + a.balance, 0);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'ASSET': return Colors.success;
            case 'LIABILITY': return Colors.danger;
            case 'EQUITY': return Colors.primary;
            case 'REVENUE': return Colors.info;
            case 'EXPENSE': return Colors.warning;
            default: return Colors.textMuted;
        }
    };

    const renderAccount = ({ item }: { item: Account }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                    <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>{item.type}</Text>
                </View>
                <Text style={[styles.balance, { color: item.balance >= 0 ? Colors.success : Colors.danger }]}>
                    ${Math.abs(item.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.code}>Code: {item.code}</Text>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

    return (
        <View style={styles.container}>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { borderColor: Colors.success + '40' }]}>
                    <Text style={styles.summaryLabel}>Assets</Text>
                    <Text style={[styles.summaryValue, { color: Colors.success }]}>${totalAssets.toLocaleString()}</Text>
                </View>
                <View style={[styles.summaryCard, { borderColor: Colors.danger + '40' }]}>
                    <Text style={styles.summaryLabel}>Liabilities</Text>
                    <Text style={[styles.summaryValue, { color: Colors.danger }]}>${totalLiabilities.toLocaleString()}</Text>
                </View>
                <View style={[styles.summaryCard, { borderColor: Colors.primary + '40' }]}>
                    <Text style={styles.summaryLabel}>Equity</Text>
                    <Text style={[styles.summaryValue, { color: Colors.primary }]}>${totalEquity.toLocaleString()}</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Chart of Accounts</Text>
            <FlatList
                data={accounts}
                keyExtractor={i => i.id.toString()}
                renderItem={renderAccount}
                contentContainerStyle={{ padding: 16, paddingTop: 0 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={Colors.primary} />}
                ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No accounts found</Text></View>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    summaryRow: { flexDirection: 'row', padding: 16, gap: 10 },
    summaryCard: {
        flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 12,
        borderWidth: 1, alignItems: 'center',
    },
    summaryLabel: { color: Colors.textSecondary, fontSize: 10, marginBottom: 6, fontWeight: '600' },
    summaryValue: { fontSize: 14, fontWeight: '800' },
    sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginLeft: 16, marginBottom: 8 },
    card: {
        backgroundColor: Colors.card, borderRadius: 14, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    typeText: { fontSize: 11, fontWeight: '700' },
    balance: { fontSize: 16, fontWeight: '800' },
    name: { color: Colors.text, fontSize: 14, fontWeight: '600' },
    code: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
    emptyText: { color: Colors.textSecondary, fontSize: 16 },
});
