import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TextInput,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { getUsers, type User } from '../../lib/api';

export function UserManagementScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [filtered, setFiltered] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetch = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
            setFiltered(data);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetch(); }, []);
    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(users.filter(u =>
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.full_name?.toLowerCase().includes(q)
        ));
    }, [search, users]);

    const getRoleColor = (role?: string) => {
        switch (role) {
            case 'admin': return Colors.danger;
            case 'manager': return Colors.warning;
            case 'sales': return Colors.success;
            case 'hr': return Colors.secondary;
            default: return Colors.info;
        }
    };

    const renderUser = ({ item }: { item: User }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(item.full_name || item.username).charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.full_name || item.username}</Text>
                    <Text style={styles.username}>@{item.username}</Text>
                </View>
                <View style={styles.badges}>
                    {item.role && (
                        <View style={[styles.badge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
                            <Text style={[styles.badgeText, { color: getRoleColor(item.role) }]}>{item.role}</Text>
                        </View>
                    )}
                    <View style={[styles.badge, { backgroundColor: item.is_active ? Colors.success + '20' : Colors.danger + '20' }]}>
                        <Text style={[styles.badgeText, { color: item.is_active ? Colors.success : Colors.danger }]}>
                            {item.is_active ? 'Active' : 'Inactive'}
                        </Text>
                    </View>
                </View>
            </View>
            <Text style={styles.email}>📧 {item.email}</Text>
            {item.is_superuser && (
                <Text style={styles.superuser}>⭐ Super Admin</Text>
            )}
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
                    placeholder="Search users..."
                    placeholderTextColor={Colors.textMuted}
                />
            </View>
            <Text style={styles.count}>{filtered.length} users</Text>
            <FlatList
                data={filtered}
                keyExtractor={i => i.id.toString()}
                renderItem={renderUser}
                contentContainerStyle={{ padding: 16, paddingTop: 0 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={Colors.primary} />}
                ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No users found</Text></View>}
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
        backgroundColor: Colors.card, borderRadius: 14, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: Colors.white, fontSize: 18, fontWeight: '800' },
    name: { color: Colors.text, fontSize: 15, fontWeight: '700' },
    username: { color: Colors.textMuted, fontSize: 12 },
    badges: { gap: 4, alignItems: 'flex-end' },
    badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    email: { color: Colors.textSecondary, fontSize: 12 },
    superuser: { color: Colors.warning, fontSize: 12, marginTop: 4, fontWeight: '600' },
    emptyText: { color: Colors.textSecondary, fontSize: 16 },
});
