import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../providers/pos_provider.dart';
import '../models/product.dart';
import '../widgets/sidebar.dart';
import '../widgets/app_keyboard.dart';

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
    final List<Product> labelsToPrint = [];
    _printQuantities.forEach((id, qty) {
      try {
        final product = allProducts.firstWhere((p) => p.id == id);
        for (int i = 0; i < qty; i++) {
          labelsToPrint.add(product);
        }
      } catch (e) {
        // Product not found, ignore
      }
    });

    final doc = pw.Document();

    // Standard A4 Layout with multiple sticker labels per page (e.g. 5 columns, 10 rows approx)
    const labelWidth = 100.0;
    const labelHeight = 60.0;

    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(20),
        build: (pw.Context context) {
          return [
            pw.Wrap(
              spacing: 12,
              runSpacing: 12,
              children: labelsToPrint.map((prod) {
                // Ensure there is a SKU or ID for the barcode
                final barcodeData = (prod.sku.isNotEmpty) ? prod.sku : prod.id;
                
                return pw.Container(
                  width: labelWidth,
                  height: labelHeight,
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.grey300),
                  ),
                  padding: const pw.EdgeInsets.all(4),
                  child: pw.Column(
                    mainAxisAlignment: pw.MainAxisAlignment.center,
                    children: [
                      // Product Name (truncated to fit)
                      pw.Text(
                        prod.name,
                        style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
                        maxLines: 1,
                        overflow: pw.TextOverflow.clip,
                      ),
                      pw.SizedBox(height: 2),
                      
                      // Barcode Graphic
                      pw.Expanded(
                        child: pw.BarcodeWidget(
                          barcode: pw.Barcode.code128(),
                          data: barcodeData,
                          drawText: false,
                        ),
                      ),
                      
                      pw.SizedBox(height: 2),
                      
                      // Row formatting for Data vs Price
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          if (prod.size != null && prod.size!.isNotEmpty && prod.size != 'null')
                            pw.Text(
                              prod.size!,
                              style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold),
                            )
                          else
                            pw.SizedBox(),
                          pw.Text(
                            'LKR ${prod.price.toStringAsFixed(2)}',
                            style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold),
                          ),
                        ],
                      )
                    ],
                  ),
                );
              }).toList(),
            )
          ];
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => doc.save(),
      name: 'Batch_Barcodes_${DateTime.now().toIso8601String()}.pdf',
    );
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
                                        'SKU: ${p.sku.isEmpty ? 'N/A' : p.sku} | Size: ${p.size ?? "N/A"} | Category: ${p.category} | Stock: ${p.stockCount}',
                                        style: const TextStyle(color: Colors.white70),
                                      ),
                                      trailing: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
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
