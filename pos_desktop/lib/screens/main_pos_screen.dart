import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../widgets/sidebar.dart';
import '../widgets/product_card.dart';
import '../widgets/cart_panel.dart';

class MainPosScreen extends StatelessWidget {
  const MainPosScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          // Left Sidebar
          const Sidebar(),

          // Main Content Area
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(context),
                  const SizedBox(height: 32),
                  _buildCategories(context),
                  const SizedBox(height: 24),
                  Expanded(
                    child: _buildProductGrid(context),
                  ),
                ],
              ),
            ),
          ),

          // Right Cart Panel
          const CartPanel(),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Pakecho Restaurant',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              'Augustus 21, 2022', // Ideally formatted current date
              style: TextStyle(color: Colors.grey[400], fontSize: 16),
            ),
          ],
        ),
        Container(
          width: 300,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: const Color(0xFF2A2A3C),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const TextField(
            decoration: InputDecoration(
              icon: Icon(Icons.search, color: Colors.grey),
              hintText: 'Search menu here...',
              hintStyle: TextStyle(color: Colors.grey),
              border: InputBorder.none,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCategories(BuildContext context) {
    final provider = Provider.of<PosProvider>(context);
    final categories = ['Burger', 'Noodles', 'Drinks', 'Desserts'];

    return Row(
      children: categories.map((cat) {
        final isSelected = provider.selectedCategory == cat;
        return Padding(
          padding: const EdgeInsets.only(right: 16.0),
          child: InkWell(
            onTap: () => provider.setCategory(cat),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF2A2A3C) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                border: isSelected ? Border.all(color: const Color(0xFFFF6B6B)) : null,
              ),
              child: Row(
                children: [
                  // Placeholder for icons if needed
                  // Icon(Icons.fastfood, color: Colors.white, size: 20),
                  // SizedBox(width: 8),
                  Text(
                    cat,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildProductGrid(BuildContext context) {
    final provider = Provider.of<PosProvider>(context);

    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (provider.filteredProducts.isEmpty) {
      return const Center(child: Text('No products found in this category.'));
    }

    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 0.8,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: provider.filteredProducts.length,
      itemBuilder: (context, index) {
        final product = provider.filteredProducts[index];
        return ProductCard(product: product);
      },
    );
  }
}
