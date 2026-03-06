import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TextInput, Alert, Image, TouchableOpacity
} from 'react-native';
import { Colors } from '../../theme/colors';
import { getProducts, API_BASE_URL, type Product } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';

const n = (v: any) => parseFloat(v) || 0;

export function InventoryScreen() {
    const { socket } = useSocket();
    const [products, setProducts] = useState<Product[]>([]);
    const [filtered, setFiltered] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
            setFiltered(data);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load products');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Socket.IO Real-time Sync
    useEffect(() => {
        if (!socket) return;

        const onUpdate = () => {
            console.log('Mobile Inventory: 🔄 Received products:updated event');
            fetchProducts();
        };

        socket.on('products:updated', onUpdate);
        return () => {
            socket.off('products:updated', onUpdate);
        };
    }, [socket]);

    // Local Search Filter
    useEffect(() => {
        const q = search.toLowerCase();
        if (!q) {
            setFiltered(products);
            return;
        }
        setFiltered(products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.sku && p.sku.toLowerCase().includes(q))
        ));
    }, [search, products]);

    const getStockColor = (qty: number) => {
        if (qty === 0) return Colors.danger;
        if (qty < 10) return Colors.warning;
        return Colors.success;
    };

    const renderItem = ({ item }: { item: Product }) => {
        const imageUrl = item.image
            ? (item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}`)
            : null;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={styles.productImage} />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Text style={{ fontSize: 20 }}>📦</Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.productName}>{item.name}</Text>
                            <View style={styles.skuBadge}>
                                <Text style={styles.skuText}>{item.sku}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.stockBadge, { backgroundColor: getStockColor(item.quantity_in_stock) + '20' }]}>
                        <View style={[styles.stockDot, { backgroundColor: getStockColor(item.quantity_in_stock) }]} />
                        <Text style={[styles.stockText, { color: getStockColor(item.quantity_in_stock) }]}>
                            {item.quantity_in_stock}
                        </Text>
                    </View>
                </View>

                {item.description ? <Text style={styles.description} numberOfLines={2}>{item.description}</Text> : null}

                <View style={styles.priceRow}>
                    <View>
                        <Text style={styles.priceLabel}>Sell Price</Text>
                        <Text style={styles.price}>${n(item.price).toFixed(2)}</Text>
                    </View>
                    <View>
                        <Text style={styles.priceLabel}>Cost</Text>
                        <Text style={[styles.price, { color: Colors.warning }]}>${n(item.cost_price).toFixed(2)}</Text>
                    </View>
                    <View>
                        <Text style={styles.priceLabel}>Margin</Text>
                        <Text style={[styles.price, { color: Colors.success }]}>
                            {n(item.price) > 0 ? (((n(item.price) - n(item.cost_price)) / n(item.price)) * 100).toFixed(0) + '%' : '-'}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading && !refreshing) {
        return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search products or SKU..."
                    placeholderTextColor={Colors.textMuted}
                />
                {search ? <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: Colors.textMuted }}>✕</Text></TouchableOpacity> : null}
            </View>

            <Text style={styles.count}>{filtered.length} products found</Text>

            <FlatList
                data={filtered}
                keyExtractor={i => i.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingTop: 0 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchProducts(); }}
                        tintColor={Colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No products found</Text>
                        <Text style={{ color: Colors.textMuted, marginTop: 8 }}>Add products from the web dashboard</Text>
                    </View>
                }
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
        borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.cardBorder,
        height: 50,
    },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
    count: { color: Colors.textMuted, fontSize: 12, marginLeft: 16, marginBottom: 8 },
    card: {
        backgroundColor: Colors.card, borderRadius: 16, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: Colors.cardBorder,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    productImage: { width: 48, height: 48, borderRadius: 8, backgroundColor: Colors.background },
    placeholderImage: { width: 48, height: 48, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
    skuBadge: { backgroundColor: Colors.background, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' },
    skuText: { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },
    stockBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
    stockDot: { width: 6, height: 6, borderRadius: 3 },
    stockText: { fontSize: 12, fontWeight: '700' },
    productName: { color: Colors.text, fontSize: 16, fontWeight: '700', maxWidth: 180 },
    description: { color: Colors.textSecondary, fontSize: 13, marginBottom: 12, lineHeight: 18 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
    priceLabel: { color: Colors.textMuted, fontSize: 11, marginBottom: 2 },
    price: { color: Colors.text, fontSize: 15, fontWeight: '700' },
    emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
});
