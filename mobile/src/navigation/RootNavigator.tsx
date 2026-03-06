import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { InventoryScreen } from '../screens/supply_chain/InventoryScreen';
import { POSScreen } from '../screens/pos/POSScreen';
import { SalesHistoryScreen } from '../screens/pos/SalesHistoryScreen';
import { CRMScreen } from '../screens/crm/CRMScreen';
import { FinanceScreen } from '../screens/finance/FinanceScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { UserManagementScreen } from '../screens/admin/UserManagementScreen';
import { SupplierScreen } from '../screens/supply_chain/SupplierScreen';
import { ReportsScreen } from '../screens/ReportsScreen';

// ─── Shared header options ────────────────────────────
const screenOpts = {
    headerStyle: { backgroundColor: Colors.surface as string },
    headerTintColor: Colors.text,
    headerTitleStyle: { color: Colors.text },
};

// ─── More Menu Screen ─────────────────────────────────
function MoreMenuScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();

    const menuItems = [
        { label: 'Inventory', icon: '📦', screen: 'Inventory', desc: 'View and manage stock levels' },
        { label: 'Finance', icon: '💳', screen: 'Finance', desc: 'Chart of accounts & balances' },
        { label: 'Customers (CRM)', icon: '🤝', screen: 'CRM', desc: 'Manage customer relationships' },
        { label: 'Sales History', icon: '📋', screen: 'SalesHistory', desc: 'View all POS transactions' },
        { label: 'Suppliers', icon: '🚚', screen: 'Suppliers', desc: 'Manage your supply chain' },
        { label: 'Reports', icon: '📊', screen: 'Reports', desc: 'Analytics and business reports' },
        ...(user?.is_superuser || user?.role === 'admin'
            ? [{ label: 'User Management', icon: '👥', screen: 'UserManagement', desc: 'Manage system users & roles' }]
            : []),

    ];

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: Colors.background }}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
            <Text style={moreStyles.sectionLabel}>MODULES</Text>
            {menuItems.map(item => (
                <TouchableOpacity
                    key={item.label}
                    style={moreStyles.item}
                    onPress={() => navigation.navigate(item.screen)}
                    activeOpacity={0.75}
                >
                    <View style={moreStyles.iconBox}>
                        <Text style={moreStyles.icon}>{item.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={moreStyles.label}>{item.label}</Text>
                        <Text style={moreStyles.desc}>{item.desc}</Text>
                    </View>
                    <Text style={moreStyles.arrow}>›</Text>
                </TouchableOpacity>
            ))}

            <Text style={[moreStyles.sectionLabel, { marginTop: 24 }]}>SYSTEM INFO</Text>
            <View style={moreStyles.infoCard}>
                <View style={moreStyles.infoRow}>
                    <Text style={moreStyles.infoLabel}>Version</Text>
                    <Text style={moreStyles.infoValue}>1.0.0</Text>
                </View>
                <View style={[moreStyles.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={moreStyles.infoLabel}>Platform</Text>
                    <Text style={moreStyles.infoValue}>React Native (Expo)</Text>
                </View>
            </View>
        </ScrollView>
    );
}

// ─── POS Stack ────────────────────────────────────────
const POSStack = createNativeStackNavigator();
function POSNavigator() {
    return (
        <POSStack.Navigator screenOptions={screenOpts}>
            <POSStack.Screen name="POSMain" component={POSScreen} options={{ title: '🏪 Point of Sale' }} />
            <POSStack.Screen name="SalesHistory" component={SalesHistoryScreen} options={{ title: '📋 Sales History' }} />
        </POSStack.Navigator>
    );
}

// ─── More Stack ───────────────────────────────────────
const MoreStack = createNativeStackNavigator();
function MoreNavigator() {
    return (
        <MoreStack.Navigator screenOptions={screenOpts}>
            <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: '📱 More' }} />
            <MoreStack.Screen name="Inventory" component={InventoryScreen} options={{ title: '📦 Inventory' }} />
            <MoreStack.Screen name="Finance" component={FinanceScreen} options={{ title: '💳 Finance' }} />
            <MoreStack.Screen name="CRM" component={CRMScreen} options={{ title: '🤝 Customers' }} />
            <MoreStack.Screen name="SalesHistory" component={SalesHistoryScreen} options={{ title: '📋 Sales History' }} />
            <MoreStack.Screen name="Suppliers" component={SupplierScreen} options={{ title: '🚚 Suppliers' }} />
            <MoreStack.Screen name="Reports" component={ReportsScreen} options={{ title: '📊 Reports' }} />
            <MoreStack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: '👥 User Management' }} />
        </MoreStack.Navigator>
    );
}

// ─── Tab Icon ─────────────────────────────────────────
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
    return (
        <View style={{ alignItems: 'center', paddingTop: 2 }}>
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
        </View>
    );
}

// ─── Main Bottom Tabs ─────────────────────────────────
const Tab = createBottomTabNavigator();
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                ...screenOpts,
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    paddingBottom: 8,
                    paddingTop: 4,
                    height: 66,
                },
                tabBarActiveTintColor: Colors.primaryLight,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
                tabBarIcon: ({ focused }) => {
                    const icons: Record<string, string> = {
                        Dashboard: '🏠',
                        POS: '🏪',
                        More: '⋯',
                        Messages: '💬',
                        Profile: '👤',
                    };
                    return <TabIcon emoji={icons[route.name] || '●'} focused={focused} />;
                },
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ headerTitle: '📊 ERP Dashboard', title: 'Home' }}
            />
            <Tab.Screen
                name="POS"
                component={POSNavigator}
                options={{ headerShown: false, title: 'POS' }}
            />
            <Tab.Screen
                name="More"
                component={MoreNavigator}
                options={{ headerShown: false, title: 'More' }}
            />
            <Tab.Screen
                name="Messages"
                component={ChatScreen}
                options={{ headerTitle: '💬 Messages', title: 'Chat' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ headerTitle: '👤 My Profile', title: 'Profile' }}
            />
        </Tab.Navigator>
    );
}

// ─── Root Navigator ───────────────────────────────────
const RootStack = createNativeStackNavigator();
export function RootNavigator() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <View style={loadingStyles.container}>
                <View style={loadingStyles.logoCircle}>
                    <Text style={loadingStyles.logoText}>ERP</Text>
                </View>
                <Text style={loadingStyles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                <RootStack.Screen name="Login" component={LoginScreen} />
            ) : (
                <RootStack.Screen name="Main" component={MainTabs} />
            )}
        </RootStack.Navigator>
    );
}

// ─── Styles ───────────────────────────────────────────
const moreStyles = StyleSheet.create({
    sectionLabel: {
        color: Colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: Colors.primary + '18',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: { fontSize: 24 },
    label: { color: Colors.text, fontSize: 15, fontWeight: '700' },
    desc: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
    arrow: { color: Colors.textMuted, fontSize: 26, fontWeight: '300' },
    infoCard: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    infoLabel: { color: Colors.textSecondary, fontSize: 13 },
    infoValue: { color: Colors.text, fontSize: 13, fontWeight: '600' },
});

const loadingStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: Colors.primary,
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    logoText: { color: Colors.white, fontSize: 26, fontWeight: '900' },
    loadingText: { color: Colors.textSecondary, fontSize: 15 },
});
