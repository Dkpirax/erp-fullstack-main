import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/services.dart' show rootBundle;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';
import '../models/order.dart';

class ReceiptService {
  /// Enumerates ALL installed printers using the printing plugin.
  static Future<List<String>> listPrinters() async {
    if (kIsWeb) return [];
    try {
      final printers = await Printing.listPrinters();
      return printers.map((p) => p.name).toList();
    } catch (_) {
      return [];
    }
  }

  /// Generates a PDF receipt from an [OrderModel].
  static Future<Uint8List> generateReceiptPdf(OrderModel order, [PdfPageFormat? printerFormat]) async {
    final pdf = pw.Document();
    final currencyFormat = NumberFormat('#,##0.00');

    // Attempt to load logo
    pw.MemoryImage? logoImage;
    try {
      final logoData = await rootBundle.load('assets/image/ahu_logo.png');
      logoImage = pw.MemoryImage(logoData.buffer.asUint8List());
    } catch (_) {}

    final dateStr = DateFormat('yyyy-MM-dd   HH:mm').format(order.date);

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat(
          printerFormat?.availableWidth ?? (80 * PdfPageFormat.mm),
          double.infinity,
          marginAll: 0, // zero margins - let the printer handle its own margins
        ),
        build: (pw.Context context) {
          return pw.Center(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                // 1. Logo
                if (logoImage != null) ...[
                  pw.SizedBox(height: 10),
                  pw.Image(logoImage, width: 60, height: 60),
                ],
                
                // 2. Store name
                pw.SizedBox(height: 10),
                pw.Text(
                  'Ahu wears',
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 16),
                ),
                
                // 3. Address
                pw.Text(
                  '427A/1 Main Street, Maruthamunai',
                  style: const pw.TextStyle(fontSize: 10),
                ),
                
                // 4. Phone
                pw.Text(
                  '072 464 4200',
                  style: const pw.TextStyle(fontSize: 10),
                ),
                
                // 5. Date + Time
                pw.Text(
                  dateStr,
                  style: const pw.TextStyle(fontSize: 10),
                ),
                
                // 6. Bill No
                pw.Text(
                  'Bill No # ${order.id}',
                  style: const pw.TextStyle(fontSize: 10),
                ),
                
                // 7. Solid divider line
                pw.SizedBox(height: 8),
                pw.Divider(thickness: 1, color: PdfColors.black),
                
                // 8. Column headers row
                pw.Row(
                  children: [
                    pw.Expanded(flex: 4, child: pw.Text('Product', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10))),
                    pw.Expanded(flex: 2, child: pw.Text('Dis%', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10))),
                    pw.Expanded(flex: 3, child: pw.Text('Dis Price', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10))),
                    pw.Expanded(flex: 3, child: pw.Text('Amount', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10))),
                  ],
                ),
                
                // 9. Thin divider
                pw.Divider(thickness: 0.5, color: PdfColors.black),
                
                // 10. For EACH item
                ...order.items.map((item) {
                  return pw.Padding(
                    padding: const pw.EdgeInsets.symmetric(vertical: 2),
                    child: pw.Column(
                      children: [
                        pw.Row(
                          children: [
                            pw.Expanded(
                              flex: 4,
                              child: pw.Text(item.product.name, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                            ),
                            pw.Expanded(
                              flex: 2,
                              child: pw.Text('${item.itemDiscountPercent.toInt()}%', textAlign: pw.TextAlign.center, style: const pw.TextStyle(fontSize: 10)),
                            ),
                            pw.Expanded(
                              flex: 3,
                              child: pw.Text('LKR ${currencyFormat.format(item.unitPrice)}', textAlign: pw.TextAlign.right, style: const pw.TextStyle(fontSize: 10)),
                            ),
                            pw.Expanded(
                              flex: 3,
                              child: pw.Text('LKR ${currencyFormat.format(item.totalPrice)}', textAlign: pw.TextAlign.right, style: const pw.TextStyle(fontSize: 10)),
                            ),
                          ],
                        ),
                        // Row 2: Quantity row
                        pw.Row(
                          children: [
                            pw.Expanded(
                              child: pw.Text(
                                '${item.quantity} X LKR ${currencyFormat.format(item.product.price)}',
                                style: pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }).toList(),
                
                // 11. Dashed divider
                pw.SizedBox(height: 4),
                pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),
                
                // 12. Sub Total
                pw.SizedBox(height: 4),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Sub Total :', style: const pw.TextStyle(fontSize: 10)),
                    pw.Text('LKR ${currencyFormat.format(order.subtotal)}', style: const pw.TextStyle(fontSize: 10)),
                  ],
                ),
                
                // 13. Cart Discount
                if (order.discount > 0) ...[
                  pw.SizedBox(height: 2),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text(
                        'Cart Discount ${(order.discount / (order.subtotal + 0.0001) * 100).toStringAsFixed(0)}%:',
                        style: pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                      ),
                      pw.Text(
                        'LKR ${currencyFormat.format(order.discount)}',
                        style: pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                      ),
                    ],
                  ),
                ],
                
                // 14. Solid divider
                pw.SizedBox(height: 4),
                pw.Divider(thickness: 1, color: PdfColors.black),
                
                // 15. TOTAL
                pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(vertical: 4),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('TOTAL', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 13)),
                      pw.Text('LKR ${currencyFormat.format(order.total)}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                ),
                
                // 16. Solid divider
                pw.Divider(thickness: 1, color: PdfColors.black),
                
                // 17. Payment
                pw.SizedBox(height: 4),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Payment :', style: const pw.TextStyle(fontSize: 10)),
                    pw.Text(order.paymentMethod, style: const pw.TextStyle(fontSize: 10)),
                  ],
                ),
                
                // 18. Large blank space
                pw.SizedBox(height: 30),
                
                // 19. Dashed divider
                pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),
                
                // 20, 21, 22. Footer text
                pw.SizedBox(height: 5),
                pw.Text('Thank you for your purchase!', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                pw.Text('Returns within 4 days with receipt', style: pw.TextStyle(fontSize: 8, fontStyle: pw.FontStyle.italic)),
                pw.Text('Please come again', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                
                // 23. Dashed divider
                pw.SizedBox(height: 5),
                pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),
                
                // 24. Copyright
                pw.SizedBox(height: 5),
                pw.Text('© ElaraPOS - Retail Management', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700)),
                pw.SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );

    return pdf.save();
  }

  /// Finds a printer by searching for keywords in its name.
  static Future<Printer?> findPrinter(List<String> keywords) async {
    if (kIsWeb) return null;
    try {
      final printers = await Printing.listPrinters();
      for (final keyword in keywords) {
        final match = printers.where((p) => p.name.toLowerCase().contains(keyword.toLowerCase()));
        if (match.isNotEmpty) return match.first;
      }
      // If no keyword match, but there are printers, return the first one as fallback
      if (printers.isNotEmpty) return printers.first;
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Shows a print preview dialog for the given [order].
  static Future<void> showPrintPreview(dynamic context, OrderModel order) async {
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => await generateReceiptPdf(order, format),
      name: 'Receipt_${order.id}',
    );
  }

  /// Prints [order] by showing the system print dialog.
  /// If [printerName] is provided, it is currently ignored as we use the system dialog.
  /// Returns `null` on success.
  static Future<String?> printReceipt(OrderModel order, String? printerName) async {
    if (kIsWeb) return 'Printing is not supported in the browser version.';
    try {
      await showPrintPreview(null, order);
      return null;
    } catch (e) {
      return 'Print error: $e';
    }
  }

  /// Prints barcode labels directly to a barcode printer.
  static Future<String?> directPrintBarcodes(Uint8List pdfBytes, {String? printerName}) async {
    if (kIsWeb) return 'Printing is not supported in the browser version.';

    try {
      Printer? printer;
      if (printerName != null && printerName.isNotEmpty) {
        final printers = await Printing.listPrinters();
        printer = printers.firstWhere((p) => p.name == printerName, orElse: () => printers.first);
      } else {
        // Auto-detect barcode printer
        printer = await findPrinter(['Xprinter', 'Barcode', 'Label', 'Zebra', 'Gprinter', 'TSC', 'XP-365B', 'XP-410', 'XP-420', 'XP-3']);
      }

      if (printer == null) return 'No barcode printer found';

      final result = await Printing.directPrintPdf(
        printer: printer,
        onLayout: (PdfPageFormat format) async => pdfBytes,
        name: 'Barcodes_${DateTime.now().millisecondsSinceEpoch}',
      );

      return result ? null : 'Print failed';
    } catch (e) {
      return 'Print error: $e';
    }
  }
}