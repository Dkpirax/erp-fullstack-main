import 'product.dart';

class CartItem {
  final Product product;
  int quantity;
  String? notes;

  /// Per-item discount percentage (0–100). Set via the cart UI dropdown.
  double itemDiscountPercent = 0;

  CartItem({
    required this.product,
    this.quantity = 1,
    this.notes,
    this.itemDiscountPercent = 0,
  });

  /// Unit price after applying the item-level discount.
  double get unitPrice => product.price * (1 - itemDiscountPercent / 100);

  /// Total line price (unitPrice × qty) — factors in the item discount.
  double get totalPrice => unitPrice * quantity;

  /// Total line price with NO discount (for strikethrough display).
  double get originalTotalPrice => product.price * quantity;

  /// How much the customer saves on this line due to the item discount.
  double get discountAmount => originalTotalPrice - totalPrice;

  /// Convenience bool — true when an item-level discount is active.
  bool get hasDiscount => itemDiscountPercent > 0;
}
