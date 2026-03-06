import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TextInput,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { getSuppliers, type Supplier } from '../../lib/api';

export function SupplierScreen() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [filtered, setFiltered] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetch = async () => {
        try {
            const data = await getSuppliers();
            setSuppliers(data);
            setFiltered(data);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetch(); }, []);
    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(suppliers.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q) ||
            s.contact_person?.toLowerCase().includes(q)
        ));
    }, [search, suppliers]);

    const renderItem = ({ item }: { item: Supplier }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.contact_person && <Text style={styles.contact}>👤 {item.contact_person}</Text>}
                </View>
            </View>
            <View style={styles.details}>
                {item.email && <Text style={styles.detail}>📧 {item.email}</Text>}
                {item.phone && <Text style={styles.detail}>📞 {item.phone}</Text>}
                {item.address && <Text style={styles.detail}>📍 {item.address}</Text>}
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
                    placeholder="Search suppliers..."
                    placeholderTextColor={Colors.textMuted}
                />
            </View>
            <Text style={styles.count}>{filtered.length} suppliers</Text>
            <FlatList
                data={filtered}
                keyExtractor={i => i.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingTop: 0 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={Colors.primary} />}
                ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No suppliers found</Text></View>}
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
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.secondary + '30',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: Colors.secondary + '50',
    },
    avatarText: { color: Colors.secondary, fontSize: 18, fontWeight: '800' },
    name: { color: Colors.text, fontSize: 15, fontWeight: '700' },
    contact: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
    details: { gap: 6, paddingLeft: 56 },
    detail: { color: Colors.textSecondary, fontSize: 13 },
    emptyText: { color: Colors.textSecondary, fontSize: 16 },
});
