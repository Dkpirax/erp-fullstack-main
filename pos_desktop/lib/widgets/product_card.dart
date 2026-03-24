import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../providers/pos_provider.dart';

class ProductCard extends StatelessWidget {
  final Product product;

  const ProductCard({Key? key, required this.product}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Provider.of<PosProvider>(context, listen: false).addToCart(product);
      },
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF2A2A3C),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image area
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  child: product.imageUrl.isNotEmpty
                      ? Image.network(
                          product.imageUrl.startsWith('http') 
                              ? product.imageUrl 
                              : '${Provider.of<PosProvider>(context, listen: false).baseDomain}${product.imageUrl}',
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              _buildImagePlaceholder(),
                        )
                      : _buildImagePlaceholder(),
                ),
              ),
            ),
            // Content area
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  if ((product.size != null && product.size!.isNotEmpty && product.size != 'null') || 
                      (product.sizeNumeric != null && product.sizeNumeric!.isNotEmpty && product.sizeNumeric != 'null'))
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0882C8).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Size: ${product.size ?? ""} ${product.sizeNumeric ?? ""}'.trim(),
                        style: const TextStyle(color: Color(0xFF0882C8), fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    product.description,
                    style: TextStyle(color: Colors.grey[400], fontSize: 11),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'LKR ${product.price.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Color(0xFF0882C8),
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            'Buy: LKR ${product.costPrice.toStringAsFixed(2)}',
                            style: TextStyle(color: Colors.grey[500], fontSize: 10),
                          ),
                        ],
                      ),
                      Consumer<PosProvider>(
                        builder: (context, provider, child) {
                          final info = provider.getProductStockInfo(product.id);
                          final dynamicStock = info['stock'] ?? 0;
                          return Text(
                            '$dynamicStock items',
                            style: TextStyle(
                              color: dynamicStock <= 5 ? Colors.red : Colors.grey,
                              fontSize: 12,
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      color: Colors.grey[800],
      child: const Center(
        child: Icon(Icons.shopping_bag, size: 48, color: Colors.grey),
      ),
    );
  }
}
