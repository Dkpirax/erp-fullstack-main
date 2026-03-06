class Promo {
  final String id;
  final String code;
  final String type; // 'percentage' or 'fixed'
  final double value;
  final double minPurchase;
  final String? expiryDate;
  final int? usageLimit;
  final bool isActive;

  Promo({
    required this.id,
    required this.code,
    required this.type,
    required this.value,
    this.minPurchase = 0,
    this.expiryDate,
    this.usageLimit,
    this.isActive = true,
  });

  factory Promo.fromJson(Map<String, dynamic> json) {
    return Promo(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      type: json['type']?.toString() ?? 'percentage',
      value: double.tryParse(json['value']?.toString() ?? '0') ?? 0.0,
      minPurchase: double.tryParse(json['min_purchase']?.toString() ?? json['minPurchase']?.toString() ?? '0') ?? 0.0,
      expiryDate: json['expiry_date']?.toString() ?? json['expiryDate']?.toString(),
      usageLimit: int.tryParse(json['usage_limit']?.toString() ?? json['usageLimit']?.toString() ?? '') ?? json['usageLimit'] as int?,
      isActive: json['is_active'] ?? json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'code': code,
    'type': type,
    'value': value,
    'min_purchase': minPurchase,
    if (expiryDate != null) 'expiry_date': expiryDate,
    if (usageLimit != null) 'usage_limit': usageLimit,
    'is_active': isActive,
  };

  double calculateDiscount(double subtotal) {
    if (!isActive) return 0;
    if (subtotal < minPurchase) return 0;
    if (type == 'percentage') {
      return subtotal * (value / 100);
    }
    return value; // fixed
  }

  String get displayLabel =>
      type == 'percentage' ? '${value.toStringAsFixed(0)}% OFF' : 'LKR ${value.toStringAsFixed(2)} OFF';
}
