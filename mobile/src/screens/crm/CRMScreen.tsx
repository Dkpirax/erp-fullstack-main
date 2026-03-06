import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TextInput, TouchableOpacity,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { getCustomers, type Customer } from '../../lib/api';

export function CRMScreen() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filtered, setFiltered] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetch = async () => {
        try {
            const data = await getCustomers();
            setCustomers(data);
            setFiltered(data);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetch(); }, []);
    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(customers.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.phone?.includes(q)
        ));
    }, [search, customers]);

    const getStatusColor = (s?: string) => {
        switch (s?.toLowerCase()) {
            case 'active': return Colors.success;
            case 'inactive': return Colors.danger;
            case 'lead': return Colors.warning;
            default: return Colors.info;
        }
    };

    const renderItem = ({ item }: { item: Customer }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.company && <Text style={styles.company}>{item.company}</Text>}
                </View>
                {item.status && (
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                )}
            </View>
            <View style={styles.details}>
                {item.email && <Text style={styles.detail}>📧 {item.email}</Text>}
                {item.phone && <Text style={styles.detail}>📞 {item.phone}</Text>}
            </View>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search customers..."
                    placeholderTextColor={Colors.textMuted}
                />
            </View>
            <Text style={styles.count}>{filtered.length} customers</Text>
            <FlatList
                data={filtered}
                keyExtractor={i => i.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingTop: 0 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={Colors.primary} />}
                ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No customers found</Text></View>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        margin: 16, backgroundColor: Colors.card,
        borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 12 },
    count: { color: Colors.textMuted, fontSize: 12, marginLeft: 16, marginBottom: 8 },
    card: {
        backgroundColor: Colors.card, borderRadius: 16, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { color: Colors.white, fontSize: 18, fontWeight: '800' },
    name: { color: Colors.text, fontSize: 15, fontWeight: '700' },
    company: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 11, fontWeight: '700' },
    details: { gap: 4 },
    detail: { color: Colors.textSecondary, fontSize: 13 },
    emptyText: { color: Colors.textSecondary, fontSize: 16 },
});
