import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../providers/pos_provider.dart';
import '../models/product.dart';
import '../widgets/sidebar.dart';
import '../widgets/app_keyboard.dart';
import '../services/receipt_service.dart';


class BarcodesScreen extends StatefulWidget {
  const BarcodesScreen({Key? key}) : super(key: key);

  @override
  State<BarcodesScreen> createState() => _BarcodesScreenState();
}

class _BarcodesScreenState extends State<BarcodesScreen> {
  // Map of Product ID to Quantity of barcodes to print
  final Map<String, int> _printQuantities = {};
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();
  TextEditingController? _activeController;
  // Map of Product ID to Discount percentage
  final Map<String, double> _selectedDiscounts = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<PosProvider>(context, listen: false).fetchProducts();
    });
  }

  void _incrementQuantity(String id) {
    setState(() {
      _printQuantities[id] = (_printQuantities[id] ?? 0) + 1;
    });
  }

  void _decrementQuantity(String id) {
    setState(() {
      final current = _printQuantities[id] ?? 0;
      if (current > 0) {
        _printQuantities[id] = current - 1;
        if (_printQuantities[id] == 0) {
          _printQuantities.remove(id);
        }
      }
    });
  }

  Future<void> _generatePdfAndPrint(List<Product> allProducts) async {
    if (_printQuantities.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one product to print barcodes for.'), backgroundColor: Colors.orange)
      );
      return;
    }

    // Prepare list of labels to render sequentially
    final List<Map<String, dynamic>> labelsToPrint = [];
    _printQuantities.forEach((id, qty) {
      try {
        final product = allProducts.firstWhere((p) => p.id == id);
        final discount = _selectedDiscounts[id] ?? 0.0;
        for (int i = 0; i < qty; i++) {
          labelsToPrint.add({
            'product': product,
            'discount': discount,
          });
        }
      } catch (e) {
        // Product not found, ignore
      }
    });

    final doc = pw.Document();

    final labelFormat = PdfPageFormat(
      50 * PdfPageFormat.mm,
      28 * PdfPageFormat.mm, // 25mm label + 3mm gap
    );

    for (var data in labelsToPrint) {
      final prod = data['product'] as Product;
      final discount = data['discount'] as double;

      String barcodeData = (prod.sku.isNotEmpty) ? prod.sku : prod.id;
      if (discount > 0) {
        barcodeData = '$barcodeData@${discount.toInt()}';
      }

      final discountedPrice = prod.price * (1 - (discount / 100));

      doc.addPage(
        pw.Page(
          pageFormat: labelFormat,
          margin: pw.EdgeInsets.zero,
          build: (context) {
            return pw.Container(
              height: 25 * PdfPageFormat.mm,
              padding: const pw.EdgeInsets.all(1 * PdfPageFormat.mm),
              child: pw.Column(
                mainAxisAlignment: pw.MainAxisAlignment.center,
                children: [
                  pw.Text(
                    prod.name,
                    style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold),
                    maxLines: 1,
                    overflow: pw.TextOverflow.clip,
                  ),

                  if (discount > 0) ...[
                    pw.SizedBox(height: 1),
                    pw.Text(
                      '${discount.toInt()}% OFF',
                      style: pw.TextStyle(fontSize: 7, color: PdfColors.red, fontWeight: pw.FontWeight.bold),
                    ),
                  ],

                  pw.SizedBox(height: 1),
                  pw.SizedBox(
                    height: 8 * PdfPageFormat.mm,
                    child: pw.BarcodeWidget(
                      barcode: pw.Barcode.code128(),
                      data: barcodeData,
                      width: double.infinity,
                      drawText: false,
                    ),
                  ),
                  pw.SizedBox(height: 1),

                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text(
                        '${prod.size ?? ""} ${prod.sizeNumeric ?? ""}'.trim(),
                        style: pw.TextStyle(fontSize: 7),
                      ),
                      if (discount > 0)
                        pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.end,
                          children: [
                            pw.Text(
                              'LKR ${prod.price.toStringAsFixed(0)}',
                              style: pw.TextStyle(fontSize: 5, color: PdfColors.grey, decoration: pw.TextDecoration.lineThrough),
                            ),
                            pw.Text(
                              'LKR ${discountedPrice.toStringAsFixed(0)}',
                              style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
                            ),
                          ],
                        )
                      else
                        pw.Text(
                          'LKR ${prod.price.toStringAsFixed(0)}',
                          style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
                        ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      );
    }

    // Standard A4 Layout or Roll? Usually barcode stickers are on rolls or specific sheets.
    // We use smart matching and saved preferences to print silently if possible.
    final pdfBytes = await doc.save();
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('⌛ Preparing Barcode Print...'), duration: Duration(seconds: 1)),
      );
    }

    // Call ReceiptService to handle smart printer selection / printing
    if (!mounted) return;
    final error = await ReceiptService.directPrintBarcodes(context, pdfBytes);

    if (mounted) {
      if (error == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Barcodes sent to printer successfully!'), backgroundColor: Colors.green),
        );
        setState(() => _printQuantities.clear());
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('⚠️ Print failed: $error'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<PosProvider>(context);
    final allProducts = provider.products;

    final filteredProducts = _searchQuery.isEmpty 
        ? allProducts 
        : allProducts.where((p) => p.name.toLowerCase().contains(_searchQuery) || p.sku.toLowerCase().contains(_searchQuery)).toList();

    int totalLabelsToPrint = 0;
    for (final val in _printQuantities.values) {
      totalLabelsToPrint += val;
    }

    return Scaffold(
      backgroundColor: const Color(0xFF1E1E2C),
      body: Row(
        children: [
          const Sidebar(activePage: 'Barcodes'),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // HEADER
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Batch Barcode Generator', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.print),
                        label: Text('Generate & Print PDF ($totalLabelsToPrint labels)'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0882C8),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: provider.isLoading ? null : () => _generatePdfAndPrint(allProducts),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  
                  // SEARCH BAR
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2A2A3C),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextField(
                      controller: _searchCtrl,
                      readOnly: provider.useOnScreenKeyboard,
                      onTap: () {
                        if (provider.useOnScreenKeyboard) {
                          setState(() => _activeController = _searchCtrl);
                        }
                      },
                      onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        icon: Icon(Icons.search, color: Colors.grey),
                        hintText: 'Search products by name or SKU...',
                        hintStyle: TextStyle(color: Colors.grey),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // PRODUCT LIST
                  Expanded(
                    child: provider.isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : filteredProducts.isEmpty
                            ? const Center(child: Text('No products found', style: TextStyle(color: Colors.grey)))
                            : ListView.builder(
                                itemCount: filteredProducts.length,
                                itemBuilder: (context, index) {
                                  final p = filteredProducts[index];
                                  final qty = _printQuantities[p.id] ?? 0;
                                  
                                  return Card(
                                    color: const Color(0xFF2A2A3C),
                                    margin: const EdgeInsets.only(bottom: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    child: ListTile(
                                      title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                                      subtitle: Text(
                                        'SKU: ${p.sku.isEmpty ? 'N/A' : p.sku} | Size: ${p.size ?? ""} ${p.sizeNumeric ?? ""} | Category: ${p.category} | Stock: ${p.stockCount}',
                                        style: const TextStyle(color: Colors.white70),
                                      ),
                                      trailing: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          // Discount Dropdown
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF1E1E2C),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: DropdownButton<double>(
                                              value: _selectedDiscounts[p.id] ?? 0.0,
                                              dropdownColor: const Color(0xFF2A2A3C),
                                              style: const TextStyle(color: Colors.white, fontSize: 13),
                                              underline: const SizedBox(),
                                              items: [0.0, 5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 40.0, 50.0].map((d) {
                                                return DropdownMenuItem<double>(
                                                  value: d,
                                                  child: Text(d == 0 ? 'No Dis' : '${d.toInt()}% Off'),
                                                );
                                              }).toList(),
                                              onChanged: (val) {
                                                setState(() {
                                                  if (val == 0) {
                                                    _selectedDiscounts.remove(p.id);
                                                  } else {
                                                    _selectedDiscounts[p.id] = val!;
                                                  }
                                                });
                                              },
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          IconButton(
                                            icon: const Icon(Icons.remove_circle_outline, color: Colors.grey),
                                            onPressed: () => _decrementQuantity(p.id),
                                          ),
                                          SizedBox(
                                            width: 40,
                                            child: Text(
                                              '$qty',
                                              textAlign: TextAlign.center,
                                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                                            ),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.add_circle, color: Color(0xFF0882C8)),
                                            onPressed: () => _incrementQuantity(p.id),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                  ),
                ],
              ),
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
}
