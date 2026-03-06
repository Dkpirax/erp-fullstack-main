import 'cart_item.dart';
import 'product.dart';

class OrderModel {
  final String id;
  final List<CartItem> items;
  final double subtotal;
  final double discount;
  final double tax;
  final double total;
  final String paymentMethod;
  final DateTime date;

  OrderModel({
    required this.id,
    required this.items,
    required this.subtotal,
    required this.discount,
    required this.tax,
    required this.total,
    required this.paymentMethod,
    required this.date,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    var list = json['items'] as List? ?? [];
    List<CartItem> cartItems = list.map((i) {
      final item = Map<String, dynamic>.from(i as Map);

      // The backend returns a flat item with product_name, not a nested product object.
      // Fall back to a nested product map if present (e.g. from local mock data).
      final productName = item['product_name']?.toString()
          ?? item['name']?.toString()
          ?? (item['product'] is Map ? item['product']['name']?.toString() : null)
          ?? 'Unknown Product';

      final productId   = (item['product_id'] ?? item['id'] ?? 0).toString();
      final unitPrice   = double.tryParse(item['unit_price']?.toString() ?? '0') ?? 0.0;
      final totalPrice  = double.tryParse(item['total_price']?.toString() ?? '0') ?? 0.0;
      final quantity    = int.tryParse(item['quantity']?.toString() ?? '1') ?? 1;

      return CartItem(
        product: Product(
          id: productId,
          name: productName,
          description: '',
          price: unitPrice,
          category: '',
          imageUrl: '',
          sku: '',
          size: () {
            final s = item['size']?.toString() ?? (item['product'] is Map ? item['product']['size']?.toString() : null);
            return (s == 'null' || s == null) ? null : s;
          }(),
        ),
        quantity: quantity,
      );
    }).toList();


    return OrderModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      items: cartItems,
      subtotal: double.tryParse(json['subtotal_amount']?.toString() ?? json['subtotal']?.toString() ?? json['total_amount']?.toString() ?? '0') ?? 0.0,
      discount: double.tryParse(json['discount_amount']?.toString() ?? json['discount']?.toString() ?? '0') ?? 0.0,
      tax: double.tryParse(json['tax']?.toString() ?? '0') ?? 0.0,
      total: double.tryParse(json['total']?.toString() ?? json['total_amount']?.toString() ?? '0') ?? 0.0,
      paymentMethod: (json['payment_method'] ?? (json['payments'] != null && json['payments'].isNotEmpty ? json['payments'][0]['method'] : 'CASH')).toString(),
      date: DateTime.tryParse(json['created_at']?.toString() ?? json['date']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
