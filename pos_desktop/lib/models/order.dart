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
      // Handle the case where the API returns product details inside items
      final productJson = i['product'] ?? i;
      return CartItem(
        product: Product.fromJson(productJson),
        quantity: i['quantity'] ?? 1,
      );
    }).toList();

    return OrderModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      items: cartItems,
      subtotal: double.tryParse(json['subtotal']?.toString() ?? json['total_amount']?.toString() ?? '0') ?? 0.0,
      discount: double.tryParse(json['discount']?.toString() ?? '0') ?? 0.0,
      tax: double.tryParse(json['tax']?.toString() ?? '0') ?? 0.0,
      total: double.tryParse(json['total']?.toString() ?? json['total_amount']?.toString() ?? '0') ?? 0.0,
      paymentMethod: (json['payment_method'] ?? (json['payments'] != null && json['payments'].isNotEmpty ? json['payments'][0]['method'] : 'CASH')).toString(),
      date: DateTime.tryParse(json['created_at']?.toString() ?? json['date']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
