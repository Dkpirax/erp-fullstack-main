import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export function ProfileScreen() {
    const { user, logout } = useAuth();
    const { isConnected } = useSocket();

    const getRoleBadgeColor = (role?: string) => {
        switch (role) {
            case 'admin': return Colors.danger;
            case 'manager': return Colors.warning;
            case 'sales': return Colors.success;
            default: return Colors.primary;
        }
    };

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    const infoRows = [
        { label: 'Username', value: user?.username, icon: '👤' },
        { label: 'Email', value: user?.email, icon: '📧' },
        { label: 'Full Name', value: user?.full_name || 'Not set', icon: '🪪' },
        { label: 'Role', value: user?.role || 'N/A', icon: '🔑' },
        { label: 'Account Status', value: user?.is_active ? 'Active' : 'Inactive', icon: '✅' },
        { label: 'Super User', value: user?.is_superuser ? 'Yes' : 'No', icon: '⭐' },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Avatar Section */}
            <View style={styles.hero}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.name}>{user?.full_name || user?.username}</Text>
                {user?.role && (
                    <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role) }]}>
                        <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
                    </View>
                )}
                {user?.is_superuser && (
                    <View style={styles.superuserBadge}>
                        <Text style={styles.superuserText}>⭐ Super Admin</Text>
                    </View>
                )}
            </View>

            {/* Socket Status */}
            <View style={styles.socketRow}>
                <View style={[styles.socketDot, { backgroundColor: isConnected ? Colors.success : Colors.danger }]} />
                <Text style={styles.socketText}>
                    {isConnected ? 'Real-time connected' : 'Real-time disconnected'}
                </Text>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
                {infoRows.map((row, i) => (
                    <View key={row.label} style={[styles.infoRow, i < infoRows.length - 1 && styles.infoRowBorder]}>
                        <Text style={styles.infoIcon}>{row.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>{row.label}</Text>
                            <Text style={styles.infoValue}>{row.value}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    hero: { alignItems: 'center', padding: 32, paddingBottom: 24 },
    avatar: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
        shadowColor: Colors.primary, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
        borderWidth: 3, borderColor: Colors.primaryLight,
    },
    avatarText: { color: Colors.white, fontSize: 36, fontWeight: '900' },
    name: { color: Colors.text, fontSize: 22, fontWeight: '800', marginBottom: 10 },
    roleBadge: {
        borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 8,
    },
    roleText: { color: Colors.white, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    superuserBadge: {
        backgroundColor: Colors.warning + '20', borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: Colors.warning + '40',
    },
    superuserText: { color: Colors.warning, fontSize: 12, fontWeight: '700' },
    socketRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        justifyContent: 'center', marginBottom: 20,
    },
    socketDot: { width: 10, height: 10, borderRadius: 5 },
    socketText: { color: Colors.textSecondary, fontSize: 13 },
    infoCard: {
        backgroundColor: Colors.card, borderRadius: 20, marginHorizontal: 16,
        borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden', marginBottom: 20,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    infoIcon: { fontSize: 22, width: 30, textAlign: 'center' },
    infoLabel: { color: Colors.textMuted, fontSize: 11, marginBottom: 2 },
    infoValue: { color: Colors.text, fontSize: 15, fontWeight: '600' },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: Colors.danger + '15', borderRadius: 16, marginHorizontal: 16,
        padding: 18, borderWidth: 1, borderColor: Colors.danger + '40',
    },
    logoutIcon: { fontSize: 20 },
    logoutText: { color: Colors.danger, fontSize: 16, fontWeight: '700' },
});
