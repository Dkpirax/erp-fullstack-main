import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../widgets/sidebar.dart';
import '../widgets/product_card.dart';
import '../widgets/cart_panel.dart';
import '../utils/fullscreen.dart';

class MainPosScreen extends StatefulWidget {
  const MainPosScreen({Key? key}) : super(key: key);

  @override
  State<MainPosScreen> createState() => _MainPosScreenState();
}

class _MainPosScreenState extends State<MainPosScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  final FocusNode _focusNode = FocusNode();
  final FocusNode _searchFocusNode = FocusNode();
  String _barcodeBuffer = '';
  DateTime? _lastKeyPress;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      FocusScope.of(context).requestFocus(_focusNode);

      final provider = Provider.of<PosProvider>(context, listen: false);
      provider.onSearchTrigger = () {
        if (mounted) FocusScope.of(context).requestFocus(_searchFocusNode);
      };
      provider.onRefreshTrigger = () {
        if (mounted) provider.fetchProducts();
      };
      provider.onFullscreenTrigger = () {
        if (mounted) toggleFullScreen();
      };
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    _searchFocusNode.dispose();
    
    try {
      final provider = Provider.of<PosProvider>(context, listen: false);
      provider.onSearchTrigger = null;
      provider.onRefreshTrigger = null;
      provider.onFullscreenTrigger = null;
    } catch (_) {}
    
    super.dispose();
  }

  void _handleKeyEvent(RawKeyEvent event) {
    if (event is RawKeyDownEvent) {
      final now = DateTime.now();
      
      if (_lastKeyPress != null) {
        final delta = now.difference(_lastKeyPress!).inMilliseconds;
        // If an operator is typing manually, they are slower than 50ms per character
        if (delta > 100) {
          _barcodeBuffer = '';
        }
      }
      _lastKeyPress = now;

      if (event.logicalKey == LogicalKeyboardKey.enter) {
        if (_barcodeBuffer.isNotEmpty) {
          // Barcode scan finished! Add product
          Provider.of<PosProvider>(context, listen: false).addProductByBarcode(_barcodeBuffer.trim());
          
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Scanned barcode'), duration: Duration(milliseconds: 500)),
          );
          
          _barcodeBuffer = '';
        }
      } else {
        // Collect characters
        final char = event.character;
        if (char != null && char.isNotEmpty) {
          _barcodeBuffer += char;
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return RawKeyboardListener(
      focusNode: _focusNode,
      autofocus: true,
      onKey: _handleKeyEvent,
      child: Scaffold(
        body: Row(
        children: [
          const Sidebar(),
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
                  Expanded(child: _buildProductGrid(context)),
                ],
              ),
            ),
          ),
          const CartPanel(),
        ],
      ),
    ));
  }

  Widget _buildHeader(BuildContext context) {
    final now = DateTime.now();
    final dateStr = '${now.day} ${_monthName(now.month)} ${now.year}';
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ahu mens',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              dateStr,
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
          child: TextField(
            controller: _searchController,
            focusNode: _searchFocusNode,
            onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
            decoration: const InputDecoration(
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

  String _monthName(int month) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[month - 1];
  }

  Widget _buildCategories(BuildContext context) {
    final provider = Provider.of<PosProvider>(context);
    final categories = provider.categories; // ← dynamic from backend

    if (categories.isEmpty) {
      return const SizedBox.shrink();
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: categories.map((cat) {
          final isSelected = provider.selectedCategory == cat;
          return Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () => provider.setCategory(cat),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF2A2A3C) : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF0882C8) : Colors.transparent,
                    width: 1.5,
                  ),
                ),
                child: Text(
                  cat,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.grey[400],
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildProductGrid(BuildContext context) {
    final provider = Provider.of<PosProvider>(context);

    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF0882C8)));
    }

    // Show server error
    if (provider.productError != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 72, color: Colors.red),
            const SizedBox(height: 16),
            const Text('Cannot connect to server',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(
              provider.productError!,
              style: TextStyle(color: Colors.grey[400], fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              'Make sure the backend is running:\n  node server.js  (in erp-fullstack folder)',
              style: TextStyle(color: Colors.orange[300], fontSize: 12),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => provider.fetchProducts(),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0882C8),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      );
    }

    // Apply search filter on top of category filter
    final products = _searchQuery.isEmpty
        ? provider.filteredProducts
        : provider.filteredProducts
            .where((p) => p.name.toLowerCase().contains(_searchQuery))
            .toList();

    if (products.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey[600]),
            const SizedBox(height: 16),
            Text(
              'No products found.',
              style: TextStyle(color: Colors.grey[500], fontSize: 16),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 5,
        childAspectRatio: 0.8,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: products.length,
      itemBuilder: (context, index) {
        return ProductCard(product: products[index]);
      },
    );
  }
}
