import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, TextInput, Modal, Alert, ScrollView,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { getProducts, type Product } from '../../lib/api';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext'; // Socket Import

const n = (v: any) => parseFloat(v) || 0;

interface CartItem { product: Product; quantity: number }

type PaymentMethod = 'CASH' | 'CARD' | 'CHECK';
type CheckType = 'PERSONAL' | 'BUSINESS' | 'CASHIERS' | 'TRAVELERS';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; color: string }[] = [
    { id: 'CASH', label: 'Cash', icon: '💵', color: '#22C55E' },
    { id: 'CARD', label: 'Card', icon: '💳', color: '#6366F1' },
    { id: 'CHECK', label: 'Check', icon: '📝', color: '#F59E0B' },
];

const CHECK_TYPES: CheckType[] = ['PERSONAL', 'BUSINESS', 'CASHIERS', 'TRAVELERS'];

// Custom Date Input Component
const DateInput = ({ value, onChange }: { value: string, onChange: (t: string) => void }) => {
    const handleChange = (text: string) => {
        // Only allow numbers and dashes (though we add dashes automatically)
        const cleaned = text.replace(/[^0-9]/g, '');
        let formatted = cleaned;
        if (cleaned.length > 4) formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
        if (cleaned.length > 6) formatted = formatted.slice(0, 7) + '-' + cleaned.slice(6);
        if (cleaned.length > 8) formatted = formatted.slice(0, 10);
        onChange(formatted);
    };

    return (
        <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
                style={{
                    flex: 1, backgroundColor: Colors.surface, borderRadius: 10, padding: 12,
                    color: Colors.text, borderWidth: 1, borderColor: Colors.border
                }}
                value={value}
                onChangeText={handleChange}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={10}
            />
            <TouchableOpacity
                onPress={() => onChange(new Date().toISOString().split('T')[0])}
                style={{
                    justifyContent: 'center', paddingHorizontal: 12,
                    backgroundColor: Colors.surface, borderRadius: 10,
                    borderWidth: 1, borderColor: Colors.border
                }}
            >
                <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>TODAY</Text>
            </TouchableOpacity>
        </View>
    );
};

export function POSScreen() {
    const { socket } = useSocket();
    const [products, setProducts] = useState<Product[]>([]);
    const [filtered, setFiltered] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [cartVisible, setCartVisible] = useState(false);
    const [checkoutVisible, setCheckoutVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [processing, setProcessing] = useState(false);

    // Check Payment State
    const [checkNumber, setCheckNumber] = useState('');
    const [checkDate, setCheckDate] = useState('');
    const [checkType, setCheckType] = useState<CheckType>('PERSONAL');
    const [checkFrom, setCheckFrom] = useState('');
    const [bankName, setBankName] = useState('');
    const [depositDate, setDepositDate] = useState('');

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
            setFiltered(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    // Socket Listener
    useEffect(() => {
        if (!socket) return;
        const onUpdate = () => {
            console.log('Mobile POS: 🔄 Received products:updated event');
            fetchProducts();
        };
        socket.on('products:updated', onUpdate);
        return () => { socket.off('products:updated', onUpdate); };
    }, [socket]);


    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(products.filter(p =>
            p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
        ));
    }, [search, products]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQty = (productId: number, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.product.id !== productId) return i;
            const newQ = i.quantity + delta;
            if (newQ <= 0) return null as any;
            return { ...i, quantity: newQ };
        }).filter(Boolean));
    };

    const cartTotal = cart.reduce((s, i) => s + n(i.product.price) * i.quantity, 0);
    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

    // ─── Place Order ────────────────────────────────────
    const placeOrder = async () => {
        if (cart.length === 0) return;

        // Validation for Check
        if (paymentMethod === 'CHECK') {
            if (!checkNumber || !checkDate || !checkFrom || !depositDate) {
                Alert.alert('Missing Fields', 'Please fill in all required check details.');
                return;
            }
            // Basic date format validation
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(checkDate) || !dateRegex.test(depositDate)) {
                Alert.alert('Invalid Date', 'Please match YYYY-MM-DD format.');
                return;
            }
        }

        setProcessing(true);
        try {
            const orderPayload = {
                total_amount: cartTotal,
                status: 'COMPLETED',
                source: 'POS',
                payments: [{
                    method: paymentMethod,
                    amount: cartTotal,
                    ...(paymentMethod === 'CHECK' && {
                        check_number: checkNumber,
                        check_date: checkDate,
                        check_type: checkType,
                        check_from: checkFrom,
                        bank_name: bankName,
                        deposit_date: depositDate
                    })
                }],
                items: cart.map(i => ({
                    product_id: i.product.id,
                    quantity: i.quantity,
                    unit_price: n(i.product.price),
                    total_price: n(i.product.price) * i.quantity,
                })),
            };

            await api.post('/pos/orders', orderPayload);
            setCart([]);
            setCheckoutVisible(false);
            setCartVisible(false);
            setPaymentMethod('CASH');
            // Reset check fields
            setCheckNumber(''); setCheckDate(''); setCheckFrom(''); setBankName(''); setDepositDate('');

            Alert.alert('✅ Order Placed!', `Payment: ${paymentMethod}\nTotal: $${cartTotal.toFixed(2)}`);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.detail || 'Failed to place order.');
        } finally {
            setProcessing(false);
        }
    };

    // ─── Render Check Form ──────────────────────────────
    const renderCheckForm = () => (
        <View style={styles.checkForm}>
            <Text style={styles.formTitle}>Check Details</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Check Number *</Text>
                <TextInput style={styles.input} value={checkNumber} onChangeText={setCheckNumber} placeholder="e.g. 1001" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Check Date *</Text>
                    <DateInput value={checkDate} onChange={setCheckDate} />
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Deposit Date *</Text>
                    <DateInput value={depositDate} onChange={setDepositDate} />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeSelector}>
                    {CHECK_TYPES.map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.typeBtn, checkType === t && styles.typeBtnActive]}
                            onPress={() => setCheckType(t)}
                        >
                            <Text style={[styles.typeBtnText, checkType === t && styles.typeBtnTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Payer Name (From) *</Text>
                <TextInput style={styles.input} value={checkFrom} onChangeText={setCheckFrom} placeholder="Name on check" placeholderTextColor={Colors.textMuted} />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Bank Name</Text>
                <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="Optional" placeholderTextColor={Colors.textMuted} />
            </View>
        </View>
    );

    // ─── Product Card ───────────────────────────────────
    const renderProduct = ({ item }: { item: Product }) => {
        const inCart = cart.find(i => i.product.id === item.id);
        const outOfStock = item.quantity_in_stock === 0;
        return (
            <TouchableOpacity
                style={[styles.productCard, outOfStock && styles.productCardDisabled]}
                onPress={() => !outOfStock && addToCart(item)}
                activeOpacity={outOfStock ? 1 : 0.8}
            >
                <View style={styles.productIconBox}>
                    <Text style={styles.productEmoji}>{outOfStock ? '❌' : '📦'}</Text>
                </View>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productSku}>{item.sku}</Text>
                {outOfStock && <Text style={styles.outOfStock}>Out of stock</Text>}
                <View style={styles.productBottom}>
                    <Text style={styles.productPrice}>${n(item.price).toFixed(2)}</Text>
                    {!outOfStock && (
                        inCart ? (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{inCart.quantity}</Text>
                            </View>
                        ) : (
                            <View style={styles.addBtn}>
                                <Text style={styles.addBtnText}>+</Text>
                            </View>
                        )
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

    return (
        <View style={styles.container}>
            {/* Search */}
            <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search products..."
                    placeholderTextColor={Colors.textMuted}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Text style={{ color: Colors.textMuted, fontSize: 16, paddingHorizontal: 8 }}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Products Grid */}
            <FlatList
                data={filtered}
                keyExtractor={i => i.id.toString()}
                numColumns={2}
                columnWrapperStyle={{ gap: 12 }}
                contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12 }}
                renderItem={renderProduct}
                ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No products found</Text></View>}
            />

            {/* Cart FAB */}
            {cartCount > 0 && (
                <TouchableOpacity style={styles.cartFab} onPress={() => setCartVisible(true)}>
                    <Text style={styles.cartFabIcon}>🛒</Text>
                    <Text style={styles.cartFabText}>{cartCount} item{cartCount > 1 ? 's' : ''} · ${cartTotal.toFixed(2)}</Text>
                    <View style={styles.cartFabBadge}><Text style={styles.cartFabBadgeText}>{cartCount}</Text></View>
                </TouchableOpacity>
            )}

            {/* ── Cart Modal ──────────────────────────── */}
            <Modal visible={cartVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>🛒 Your Cart</Text>
                        <TouchableOpacity onPress={() => setCartVisible(false)}>
                            <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={cart}
                        keyExtractor={i => i.product.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.cartItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cartItemName}>{item.product.name}</Text>
                                    <Text style={styles.cartItemPrice}>${n(item.product.price).toFixed(2)} each</Text>
                                </View>
                                <View style={styles.qtyControl}>
                                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.product.id, -1)}>
                                        <Text style={styles.qtyBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.qty}>{item.quantity}</Text>
                                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.product.id, 1)}>
                                        <Text style={styles.qtyBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.cartItemTotal}>${(n(item.product.price) * item.quantity).toFixed(2)}</Text>
                            </View>
                        )}
                        contentContainerStyle={{ padding: 16 }}
                    />
                    <View style={styles.cartFooter}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal ({cartCount} items)</Text>
                            <Text style={styles.totalValue}>${cartTotal.toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.checkoutBtn}
                            onPress={() => { setCartVisible(false); setTimeout(() => setCheckoutVisible(true), 400); }}
                        >
                            <Text style={styles.checkoutBtnText}>Proceed to Payment →</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Payment Modal ───────────────────────── */}
            <Modal visible={checkoutVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => { setCheckoutVisible(false); setCartVisible(true); }}>
                            <Text style={styles.backBtn}>‹ Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>💳 Payment</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {/* Order Summary */}
                        <View style={styles.amountDueCard}>
                            <Text style={styles.amountDueLabel}>Amount Due</Text>
                            <Text style={styles.amountDueValue}>${cartTotal.toFixed(2)}</Text>
                        </View>

                        {/* Payment Method */}
                        <Text style={styles.sectionLabel}>SELECT PAYMENT METHOD</Text>
                        <View style={styles.paymentGrid}>
                            {PAYMENT_METHODS.map(pm => {
                                const selected = paymentMethod === pm.id;
                                return (
                                    <TouchableOpacity
                                        key={pm.id}
                                        style={[
                                            styles.paymentCard,
                                            selected && { borderColor: pm.color, backgroundColor: pm.color + '18' },
                                        ]}
                                        onPress={() => setPaymentMethod(pm.id)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.paymentIcon}>{pm.icon}</Text>
                                        <Text style={[styles.paymentLabel, selected && { color: pm.color }]}>
                                            {pm.label}
                                        </Text>
                                        {selected && (
                                            <View style={[styles.checkmark, { backgroundColor: pm.color }]}>
                                                <Text style={styles.checkmarkText}>✓</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* CHECK FORM */}
                        {paymentMethod === 'CHECK' && renderCheckForm()}

                        {/* Confirm Button */}
                        <TouchableOpacity
                            style={[styles.confirmBtn, processing && { opacity: 0.7 }]}
                            onPress={placeOrder}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.confirmBtnText}>✅ Confirm & Place Order</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
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
    productCard: {
        flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    productCardDisabled: { opacity: 0.5 },
    productIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    productEmoji: { fontSize: 24 },
    productName: { color: Colors.text, fontSize: 13, fontWeight: '700', marginBottom: 4, minHeight: 34 },
    productSku: { color: Colors.textMuted, fontSize: 10, marginBottom: 6 },
    outOfStock: { color: Colors.danger, fontSize: 10, fontWeight: '700', marginBottom: 4 },
    productBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productPrice: { color: Colors.primary, fontSize: 15, fontWeight: '800' },
    cartBadge: { backgroundColor: Colors.success, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    cartBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
    addBtn: { backgroundColor: Colors.primary, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    addBtnText: { color: Colors.white, fontSize: 18, fontWeight: '700', lineHeight: 22 },
    cartFab: {
        position: 'absolute', bottom: 24, left: 16, right: 16,
        backgroundColor: Colors.primary, borderRadius: 20, padding: 18,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        shadowColor: Colors.primary, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
    },
    cartFabIcon: { fontSize: 20 },
    cartFabText: { color: Colors.white, fontSize: 15, fontWeight: '700', flex: 1 },
    cartFabBadge: { backgroundColor: Colors.white + '30', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    cartFabBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
    emptyText: { color: Colors.textSecondary, fontSize: 16 },
    // Modals
    modal: { flex: 1, backgroundColor: Colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
    modalTitle: { color: Colors.text, fontSize: 20, fontWeight: '800' },
    modalClose: { color: Colors.textSecondary, fontSize: 22, padding: 4 },
    backBtn: { color: Colors.primary, fontSize: 17, fontWeight: '600' },
    // Cart items
    cartItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    cartItemName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
    cartItemPrice: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyBtn: { backgroundColor: Colors.surface, width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    qtyBtnText: { color: Colors.text, fontSize: 16, fontWeight: '700' },
    qty: { color: Colors.text, fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center' },
    cartItemTotal: { color: Colors.primary, fontSize: 15, fontWeight: '700', minWidth: 60, textAlign: 'right' },
    cartFooter: { padding: 20, borderTopWidth: 1, borderTopColor: Colors.border },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    totalLabel: { color: Colors.textSecondary, fontSize: 15 },
    totalValue: { color: Colors.text, fontSize: 22, fontWeight: '800' },
    checkoutBtn: { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, alignItems: 'center', shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    checkoutBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
    // Payment UI
    amountDueCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
    amountDueLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8 },
    amountDueValue: { color: Colors.text, fontSize: 40, fontWeight: '900', marginBottom: 8 },
    sectionLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
    paymentGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    paymentCard: {
        flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 16,
        alignItems: 'center', borderWidth: 2, borderColor: Colors.cardBorder,
    },
    paymentIcon: { fontSize: 28, marginBottom: 8 },
    paymentLabel: { color: Colors.text, fontSize: 13, fontWeight: '700' },
    checkmark: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    checkmarkText: { color: Colors.white, fontSize: 11, fontWeight: '900' },
    confirmBtn: { backgroundColor: Colors.success, borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: Colors.success, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, marginBottom: 40 },
    confirmBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
    // Check Form
    checkForm: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.cardBorder },
    formTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 16 },
    inputGroup: { marginBottom: 16 },
    label: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
    row: { flexDirection: 'row' },
    typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    typeBtnActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
    typeBtnText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
    typeBtnTextActive: { color: Colors.primary },
    input: { backgroundColor: Colors.surface, borderRadius: 10, padding: 12, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
});
