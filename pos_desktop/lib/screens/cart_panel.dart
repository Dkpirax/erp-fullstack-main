import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../services/receipt_service.dart';
import '../models/order.dart';

class CartPanel extends StatefulWidget {
  const CartPanel({Key? key}) : super(key: key);

  @override
  State<CartPanel> createState() => _CartPanelState();
}

class _CartPanelState extends State<CartPanel> {
  final _promoController = TextEditingController();
  String? _promoError;
  bool _applying = false;

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  Future<void> _applyPromo(PosProvider provider) async {
    final code = _promoController.text;
    setState(() {
      _applying = true;
      _promoError = null;
    });

    final error = provider.applyPromoByCode(code);
    setState(() {
      _applying = false;
      _promoError = error;
    });

    if (error == null) {
      _promoController.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Promo "${code.trim().toUpperCase()}" applied!'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  Future<void> _showPaymentDialog(BuildContext context, PosProvider provider) async {
    String? selectedMethod = await showDialog<String>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF2A2A3C),
          title: const Text('Select Payment Method', style: TextStyle(color: Colors.white)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.money, color: Colors.green),
                title: const Text('Cash', style: TextStyle(color: Colors.white)),
                onTap: () => Navigator.pop(context, 'CASH'),
              ),
              ListTile(
                leading: const Icon(Icons.credit_card, color: Colors.blue),
                title: const Text('Card', style: TextStyle(color: Colors.white)),
                onTap: () => Navigator.pop(context, 'CARD'),
              ),
            ],
          ),
        );
      },
    );

    if (selectedMethod != null) {
      // Create a temporary OrderModel for the preview
      final tempOrder = OrderModel(
        id: 'TBD', // Order ID will be assigned by server
        items: List.from(provider.cart),
        subtotal: provider.subtotal,
        discount: provider.discount,
        tax: 0,
        total: provider.total,
        paymentMethod: selectedMethod,
        date: DateTime.now(),
      );

      final success = await provider.checkout(selectedMethod);
      if (mounted) {
        setState(() => _promoError = null);
        
        if (success) {
          final finalOrder = provider.orderHistory.isNotEmpty 
              ? provider.orderHistory.first 
              : tempOrder;

          // Show the window's print selection pop up to print
          await ReceiptService.showPrintPreview(context, finalOrder);

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text('✅ Order placed successfully ($selectedMethod)!'),
              backgroundColor: Colors.green,
            ));
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('❌ Failed to place order.'),
            backgroundColor: Colors.red,
          ));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<PosProvider>(context);

    return Container(
      width: 350,
      color: const Color(0xFF2A2A3C),
      child: Column(
        children: [
          const SizedBox(height: 32),
          // ── Header ──────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Order',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${provider.cart.length} item${provider.cart.length == 1 ? '' : 's'}',
                      style: TextStyle(color: Colors.grey[400]),
                    ),
                  ],
                ),
                if (provider.cart.isNotEmpty)
                  GestureDetector(
                    onTap: () {
                      provider.clearCart();
                      provider.removePromo();
                      setState(() => _promoError = null);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.delete_outline, size: 14, color: Colors.red),
                          SizedBox(width: 6),
                          Text('Clear', style: TextStyle(color: Colors.red, fontSize: 12)),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Cart Items ───────────────────────────────────────────
          Expanded(
            child: provider.cart.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shopping_cart_outlined, size: 56, color: Colors.grey[700]),
                        const SizedBox(height: 12),
                        Text('Cart is empty', style: TextStyle(color: Colors.grey[600])),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    itemCount: provider.cart.length,
                    itemBuilder: (context, index) {
                      final item = provider.cart[index];
                      final stockInfo = provider.getProductStockInfo(item.product.id);
                      final isStockLow = stockInfo['stock']! < 5 && stockInfo['stock']! > 0;
                      final isOutOfStock = stockInfo['stock']! == 0;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: Row(
                          children: [
                            // Thumbnail
                            Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                color: Colors.grey[800],
                                borderRadius: BorderRadius.circular(12),
                                image: item.product.imageUrl.isNotEmpty
                                    ? DecorationImage(
                                        image: NetworkImage(item.product.imageUrl),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: item.product.imageUrl.isEmpty
                                  ? const Icon(Icons.shopping_bag, color: Colors.grey)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            // Name & qty
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.product.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'x ${item.quantity}',
                                    style: TextStyle(color: Colors.grey[400], fontSize: 12),
                                  ),
                                  if (isOutOfStock)
                                    const Text(
                                      'Out of Stock',
                                      style: TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.bold),
                                    )
                                  else if (isStockLow)
                                    Text(
                                      'Low Stock (${stockInfo['stock']})',
                                      style: const TextStyle(color: Colors.orange, fontSize: 10, fontWeight: FontWeight.bold),
                                    )
                                  else
                                    Text(
                                      'Stock: ${stockInfo['stock']}',
                                      style: TextStyle(color: Colors.green[400], fontSize: 10),
                                    ),
                                ],
                              ),
                            ),
                            // Price & Controls
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  'LKR ${item.totalPrice.toStringAsFixed(2)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    _qtyBtn(
                                      Icons.remove,
                                      () => provider.updateQuantity(item.product, item.quantity - 1),
                                    ),
                                    const SizedBox(width: 12),
                                    _qtyBtn(
                                      Icons.add,
                                      () {
                                        if (item.quantity < item.product.stockCount) {
                                          provider.updateQuantity(item.product, item.quantity + 1);
                                        }
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          // ── Summary + Promo ──────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Color(0xFF2A2A3C),
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [
                BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -5)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Promo Code Entry ──────────────────────────────
                if (provider.selectedPromo == null) ...[
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _promoController,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          textCapitalization: TextCapitalization.characters,
                          decoration: InputDecoration(
                            hintText: 'Enter promo code…',
                            hintStyle: TextStyle(color: Colors.grey[600], fontSize: 13),
                            prefixIcon: const Icon(Icons.local_offer_outlined,
                                color: Colors.grey, size: 18),
                            filled: true,
                            fillColor: const Color(0xFF1E1E2C),
                            contentPadding: const EdgeInsets.symmetric(
                                vertical: 12, horizontal: 12),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide.none,
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide(
                                color: _promoError != null
                                    ? Colors.red
                                    : const Color(0xFF0882C8),
                              ),
                            ),
                          ),
                          onSubmitted: (_) => _applyPromo(provider),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 46,
                        child: ElevatedButton(
                          onPressed: _applying ? null : () => _applyPromo(provider),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0882C8),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            elevation: 0,
                          ),
                          child: _applying
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2),
                                )
                              : const Text('Apply',
                                  style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                  if (_promoError != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      _promoError!,
                      style: const TextStyle(color: Colors.red, fontSize: 12),
                    ),
                  ],
                  const SizedBox(height: 16),
                ] else ...[
                  // ── Applied Promo Badge ────────────────────────
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.green.withValues(alpha: 0.4)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.green, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '"${provider.selectedPromo!.code}" — ${provider.selectedPromo!.displayLabel}',
                            style: const TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => provider.removePromo(),
                          child: const Icon(Icons.close, color: Colors.red, size: 16),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── Subtotal ─────────────────────────────────────
                _summaryRow('Sub Total', 'LKR ${provider.subtotal.toStringAsFixed(2)}'),

                // ── Discount ─────────────────────────────────────
                if (provider.selectedPromo != null) ...[
                  const SizedBox(height: 10),
                  _summaryRow(
                    'Discount (${provider.selectedPromo!.code})',
                    '-LKR ${provider.discount.toStringAsFixed(2)}',
                    valueColor: Colors.green,
                    labelColor: Colors.green,
                  ),
                ],

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 14),
                  child: Divider(color: Colors.grey),
                ),

                // ── Total ────────────────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold)),
                    Text(
                      'LKR ${provider.total.toStringAsFixed(2)}',
                      style: const TextStyle(
                          color: Color(0xFF0882C8),
                          fontSize: 22,
                          fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // ── Checkout Button ──────────────────────────────
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: provider.cart.isEmpty || provider.isLoading
                        ? null
                        : () => _showPaymentDialog(context, provider),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0882C8),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey[800],
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                    ),
                    child: provider.isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.print),
                              SizedBox(width: 8),
                              Text('Print & Checkout',
                                  style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold)),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E2C),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Icon(icon, size: 16),
      ),
    );
  }

  Widget _summaryRow(String label, String value,
      {Color valueColor = Colors.white, Color? labelColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: labelColor ?? Colors.grey)),
        Text(value,
            style: TextStyle(fontWeight: FontWeight.bold, color: valueColor)),
      ],
    );
  }
}
