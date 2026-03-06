class Product {
  final String id;
  final String sku;
  final String name;
  final String description;
  final double price;
  final String imageUrl;
  final String category;
  final int stockCount;
  final String? supplierId;
  final String? size;
  final double costPrice;

  Product({
    required this.id,
    required this.sku,
    required this.name,
    required this.description,
    required this.price,
    required this.imageUrl,
    required this.category,
    this.stockCount = 0,
    this.supplierId,
    this.size,
    this.costPrice = 0.0,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      sku: json['sku']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      imageUrl: json['image_url']?.toString() ?? json['imageUrl']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Uncategorized',
      stockCount: int.tryParse(json['stock_quantity']?.toString() ?? json['stock_count']?.toString() ?? json['stockCount']?.toString() ?? '0') ?? 0,
      supplierId: json['supplier_id']?.toString(),
      size: (json['size'] == null || json['size'] == 'null') ? null : json['size'].toString(),
      costPrice: double.tryParse(json['cost_price']?.toString() ?? '0') ?? 0.0,
    );
  }
}
