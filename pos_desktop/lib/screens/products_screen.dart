import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../models/product.dart';
import '../widgets/sidebar.dart';
import '../widgets/app_keyboard.dart';
import 'package:file_picker/file_picker.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({Key? key}) : super(key: key);

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  TextEditingController? _activeController;
  final Set<String> _selectedProductIds = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final provider = Provider.of<PosProvider>(context, listen: false);
      provider.fetchProducts();
      provider.onNewProductTrigger = () {
        if (mounted) _showProductDialog(context);
      };
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      try {
        final provider = Provider.of<PosProvider>(context, listen: false);
        provider.onNewProductTrigger = null;
      } catch (e) {}
    });
    super.dispose();
  }


  void _confirmDeleteProduct(BuildContext context, PosProvider provider, Product p) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF2A2A3C),
        title: const Text('Delete Product'),
        content: Text('Are you sure you want to delete "${p.name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await provider.deleteProduct(p.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Product deleted' : 'Failed to delete product: ${provider.productError ?? 'Unknown error'}'),
                    backgroundColor: success ? Colors.green : Colors.red,
                  )
                );
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<PosProvider>(context);

    // Products list might be filtered by category in the main screen, 
    // but here in settings/management, we want all products.
    final products = provider.products;

    return Scaffold(
      backgroundColor: const Color(0xFF1E1E2C),
      body: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                const Sidebar(activePage: 'Products'),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Products', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                            if (provider.isAdmin)
                              Row(
                                children: [
                                  if (_selectedProductIds.isNotEmpty) ...[
                                    ElevatedButton.icon(
                                      onPressed: () {
                                        showDialog(
                                          context: context,
                                          builder: (ctx) => AlertDialog(
                                            backgroundColor: const Color(0xFF2A2A3C),
                                            title: const Text('Delete Selected'),
                                            content: Text('Delete ${_selectedProductIds.length} products?'),
                                            actions: [
                                              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                              TextButton(
                                                onPressed: () async {
                                                  Navigator.pop(ctx);
                                                  int successCount = 0;
                                                  int failCount = 0;
                                                  for (final id in _selectedProductIds) {
                                                    final success = await provider.deleteProduct(id);
                                                    if (success) successCount++;
                                                    else failCount++;
                                                  }
                                                  if (mounted) {
                                                    setState(() => _selectedProductIds.clear());
                                                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                                      content: Text(failCount == 0 
                                                        ? 'Selected products deleted' 
                                                        : 'Deleted $successCount. Failed $failCount. ${provider.productError ?? ''}'), 
                                                      backgroundColor: failCount == 0 ? Colors.green : Colors.orange
                                                    ));
                                                  }
                                                },
                                                child: const Text('Delete', style: TextStyle(color: Colors.red)),
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                      icon: const Icon(Icons.delete),
                                      label: Text('Delete (${_selectedProductIds.length})'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.red,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                  ElevatedButton.icon(
                                    onPressed: () => _showProductDialog(context),
                                    icon: const Icon(Icons.add),
                                    label: const Text('New Product'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0882C8),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  ),
                                ],
                              ),
                          ],
                        ),
                        const SizedBox(height: 32),
                        Expanded(
                          child: provider.isLoading 
                            ? const Center(child: CircularProgressIndicator())
                            : products.isEmpty
                              ? const Center(child: Text('No products found', style: TextStyle(color: Colors.grey)))
                              : GridView.builder(
                                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 3,
                                    childAspectRatio: 3,
                                    crossAxisSpacing: 16,
                                    mainAxisSpacing: 16,
                                  ),
                                  itemCount: products.length,
                                  itemBuilder: (context, index) {
                                    final p = products[index];
                                    final isSelected = _selectedProductIds.contains(p.id);
                                    return Card(
                                      color: isSelected ? const Color(0xFF0882C8).withOpacity(0.15) : const Color(0xFF2A2A3C),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        side: isSelected ? const BorderSide(color: Color(0xFF0882C8), width: 1.5) : BorderSide.none,
                                      ),
                                      child: ListTile(
                                        leading: Checkbox(
                                          value: isSelected,
                                          activeColor: const Color(0xFF0882C8),
                                          onChanged: (val) {
                                            setState(() {
                                              if (val == true) {
                                                _selectedProductIds.add(p.id);
                                              } else {
                                                _selectedProductIds.remove(p.id);
                                              }
                                            });
                                          },
                                        ),
                                        title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                        subtitle: Text('${p.category} | Size: ${p.size ?? ""} ${p.sizeNumeric ?? ""} | LKR ${p.price.toStringAsFixed(2)} | Stock: ${p.stockCount}'),
                                        trailing: provider.isAdmin 
                                          ? Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                IconButton(
                                                  icon: const Icon(Icons.edit, color: Color(0xFF0882C8)),
                                                  onPressed: () => _showProductDialog(context, product: p),
                                                ),
                                                IconButton(
                                                  icon: const Icon(Icons.delete_outline, color: Colors.grey),
                                                  onPressed: () => _confirmDeleteProduct(context, provider, p),
                                                ),
                                              ],
                                            )
                                          : const Icon(Icons.inventory_2, color: Colors.grey),
                                      ),
                                    );
                                  },
                                ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (provider.useOnScreenKeyboard && _activeController != null)
            AppKeyboard(
              controller: _activeController!,
              onClosed: () => setState(() => _activeController = null),
            ),
        ],
      ),
    );
  }

  void _showProductDialog(BuildContext context, {Product? product}) {
    final isEditing = product != null;
    final provider = Provider.of<PosProvider>(context, listen: false);
    
    final nameCtrl = TextEditingController(text: product?.name ?? '');
    final priceCtrl = TextEditingController(text: product != null ? product.price.toString() : '');
    final buyingPriceCtrl = TextEditingController(text: product != null ? product.costPrice.toString() : '');
    final descCtrl = TextEditingController(text: product?.description ?? '');
    final stockCtrl = TextEditingController(text: product != null ? product.stockCount.toString() : '');
    String? selectedSize = product?.size;
    final sizeNumericCtrl = TextEditingController(text: product?.sizeNumeric ?? '');
    final newCategoryCtrl = TextEditingController();
    final newSupplierCtrl = TextEditingController();

    final selectableCategories = provider.categories.where((c) => c != 'All').toList();
    if (selectableCategories.isEmpty) selectableCategories.add('Uncategorized');

    final selectableSuppliers = provider.suppliers;
    String? selectedSupplierId = product?.supplierId;
    if (selectedSupplierId != null && !selectableSuppliers.any((s) => s.id == selectedSupplierId)) {
      selectedSupplierId = null;
    }
    bool isNewSupplier = false;

    String selectedCategory = product?.category ?? selectableCategories.first;
    if (!selectableCategories.contains(selectedCategory) && selectedCategory != 'Uncategorized') {
      selectedCategory = 'New Category...';
      newCategoryCtrl.text = product?.category ?? '';
    }
    
    bool isNewCategory = selectedCategory == 'New Category...';
    String imageUrl = product?.imageUrl ?? '';
    bool isUploadingImage = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlgState) => AlertDialog(
          backgroundColor: const Color(0xFF2A2A3C),
          title: Text(isEditing ? 'Edit Product' : 'Add New Product'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // --- Image Picker ---
                GestureDetector(
                  onTap: isUploadingImage ? null : () async {
                    FilePickerResult? result = await FilePicker.platform.pickFiles(type: FileType.image, withData: true);
                    if (result != null && result.files.single.bytes != null) {
                      setDlgState(() => isUploadingImage = true);
                      final url = await provider.uploadProductImageBytes(
                        result.files.single.bytes!,
                        result.files.single.name,
                      );
                      setDlgState(() {
                        isUploadingImage = false;
                        if (url != null) {
                           imageUrl = url;
                        }
                      });
                    }
                  },
                  child: Container(
                    height: 100,
                    width: 100,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E1E2C),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade800),
                    ),
                    child: isUploadingImage 
                        ? const Center(child: CircularProgressIndicator())
                        : imageUrl.isNotEmpty
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  imageUrl.startsWith('http') ? imageUrl : '${provider.baseDomain}$imageUrl',
                                  fit: BoxFit.cover,
                                  errorBuilder: (c,e,s) => const Icon(Icons.broken_image, color: Colors.grey)),
                              )
                            : const Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.add_a_photo, color: Colors.grey),
                                  SizedBox(height: 4),
                                  Text('Add Image', style: TextStyle(color: Colors.grey, fontSize: 10)),
                                ],
                              ),
                  ),
                ),
                const SizedBox(height: 16),
                
                _dialogField('Product Name', nameCtrl),
                const SizedBox(height: 12),

                // --- Category Dropdown ---
                DropdownButtonFormField<String>(
                  value: selectableCategories.contains(selectedCategory) ? selectedCategory : 'New Category...',
                  dropdownColor: const Color(0xFF1E1E2C),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: const Color(0xFF1E1E2C),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: [
                    ...selectableCategories.map((c) => DropdownMenuItem(value: c, child: Text(c))),
                    if (!selectableCategories.contains('Uncategorized'))
                      const DropdownMenuItem(value: 'Uncategorized', child: Text('Uncategorized')),
                    const DropdownMenuItem(value: 'New Category...', child: Text('New Category...', style: TextStyle(color: Color(0xFF0882C8)))),
                  ],
                  onChanged: (val) {
                    if (val != null) {
                      setDlgState(() {
                        selectedCategory = val;
                        isNewCategory = val == 'New Category...';
                      });
                    }
                  },
                ),
                if (isNewCategory) ...[
                  const SizedBox(height: 8),
                  _dialogField('Enter New Category Name', newCategoryCtrl),
                ],

                const SizedBox(height: 12),

                // --- Supplier Dropdown ---
                DropdownButtonFormField<String?>(
                  value: selectableSuppliers.any((s) => s.id == selectedSupplierId) ? selectedSupplierId : (isNewSupplier ? 'NEW_SUPPLIER' : null),
                  dropdownColor: const Color(0xFF1E1E2C),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Select Supplier',
                    filled: true,
                    fillColor: const Color(0xFF1E1E2C),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('None')),
                    ...selectableSuppliers.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))),
                    const DropdownMenuItem(value: 'NEW_SUPPLIER', child: Text('Add New Supplier...', style: TextStyle(color: Color(0xFF0882C8)))),
                  ],
                  onChanged: (val) {
                    setDlgState(() {
                      selectedSupplierId = val;
                      isNewSupplier = val == 'NEW_SUPPLIER';
                    });
                  },
                ),
                if (isNewSupplier) ...[
                  const SizedBox(height: 8),
                  _dialogField('Enter New Supplier Name', newSupplierCtrl),
                ],

                const SizedBox(height: 12),
                _dialogField('Price (LKR)', priceCtrl, isNumber: true),
                const SizedBox(height: 12),
                _dialogField('Buying Price (LKR)', buyingPriceCtrl, isNumber: true),
                const SizedBox(height: 12),

                // --- Size Dropdown ---
                DropdownButtonFormField<String?>(
                  value: selectedSize,
                  dropdownColor: const Color(0xFF1E1E2C),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Select Size (Optional)',
                    filled: true,
                    fillColor: const Color(0xFF1E1E2C),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('No Size')),
                    ...['XS','S','M','L','XL','XXL','3XL','4XL','5XL'].map((s) => DropdownMenuItem(value: s, child: Text(s))),
                  ],
                  onChanged: (val) {
                    setDlgState(() => selectedSize = val);
                  },
                ),
                const SizedBox(height: 12),
                _dialogField('Numeric Size (e.g. 32, 40)', sizeNumericCtrl, isNumber: true),
                const SizedBox(height: 12),

                _dialogField('Initial Stock', stockCtrl, isNumber: true),
                const SizedBox(height: 12),
                _dialogField('Description', descCtrl),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final valPrice = double.tryParse(priceCtrl.text.trim()) ?? 0;
                final valStock = int.tryParse(stockCtrl.text.trim()) ?? 0;
                final valName = nameCtrl.text.trim();
                final finalCategory = isNewCategory ? newCategoryCtrl.text.trim() : selectedCategory;
                
                if (valName.isEmpty) {
                   ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Name is required'), backgroundColor: Colors.orange)
                   );
                   return;
                }

                final sku = isEditing ? null : 'SKU-${DateTime.now().millisecondsSinceEpoch}';

                String? finalSupplierId = selectedSupplierId;
                if (isNewSupplier && newSupplierCtrl.text.trim().isNotEmpty) {
                  final newName = newSupplierCtrl.text.trim();
                  final success = await provider.createSupplier({'name': newName});
                  if (success) {
                    // Refresh suppliers to get the newly created one's ID
                    final suppliers = await provider.fetchSuppliers();
                    try {
                      final newSupplier = suppliers.firstWhere((s) => s.name == newName);
                      finalSupplierId = newSupplier.id;
                    } catch (e) {
                      finalSupplierId = null;
                    }
                  } else {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Failed to create new supplier'), backgroundColor: Colors.red)
                      );
                    }
                    return;
                  }
                } else if (isNewSupplier) {
                  finalSupplierId = null;
                }

                final data = {
                  'name': valName,
                  'description': descCtrl.text.trim(),
                  'price': valPrice,
                  'cost_price': double.tryParse(buyingPriceCtrl.text.trim()) ?? 0,
                  'size': selectedSize,
                  'size_numeric': sizeNumericCtrl.text.trim(),
                  'category': finalCategory.isEmpty ? 'Uncategorized' : finalCategory,
                  'stock_quantity': valStock,
                  'image_url': imageUrl,
                };
                if (finalSupplierId != null && finalSupplierId != 'NEW_SUPPLIER') {
                  data['supplier_id'] = int.tryParse(finalSupplierId) ?? finalSupplierId;
                }
                
                if (!isEditing) {
                  data['sku'] = sku!;
                }

                bool success;
                if (isEditing) {
                  success = await provider.updateProduct(product.id, data);
                } else {
                  success = await provider.createProduct(data);
                }

                if (success) {
                  Navigator.pop(ctx);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(isEditing ? 'Product updated' : 'Product added'))
                    );
                  }
                } else {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Failed to save product.'), backgroundColor: Colors.red)
                    );
                  }
                }
              },
              child: const Text('Save'),
            )
          ],
        ),
      ),
    );
  }

  Widget _dialogField(String hint, TextEditingController ctrl, {bool isNumber = false}) {
    final provider = Provider.of<PosProvider>(context, listen: false);
    return TextField(
      controller: ctrl,
      readOnly: provider.useOnScreenKeyboard,
      keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
      onTap: () {
        if (provider.useOnScreenKeyboard) {
          setState(() => _activeController = ctrl);
        }
      },
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: const Color(0xFF1E1E2C),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
