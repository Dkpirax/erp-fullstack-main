import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart' show BuildContext;
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
        pageFormat: PdfPageFormat.roll80.copyWith(marginBottom: 5 * PdfPageFormat.mm),
        margin: pw.EdgeInsets.zero, // This removes the default gap!
        build: (pw.Context context) {
          return pw.Container(
            width: double.infinity,
            child: pw.Padding(
              padding: const pw.EdgeInsets.only(left: 1 * PdfPageFormat.mm),
              child: pw.Container(
                width: 72 * PdfPageFormat.mm,
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                  // 1. Logo
                  if (logoImage != null) ...[
                    pw.SizedBox(height: 2),
                    pw.Image(logoImage, width: 60, height: 60),
                  ],
                  
                  // 2. Store name
                  pw.SizedBox(height: 2),
                  pw.Text(
                    'Ahu Mens',
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14.7),
                  ),
                  
                  // 3. Address
                  pw.Text(
                    '427A/1 Main Street, Maruthamunai',
                    style: const pw.TextStyle(fontSize: 9.2),
                  ),
                  
                  // 4. Phone
                  pw.Text(
                    '072 464 4200',
                    style: const pw.TextStyle(fontSize: 9.2),
                  ),
                  
                  // 5. Date + Time
                  pw.Text(
                    dateStr,
                    style: const pw.TextStyle(fontSize: 9.2),
                  ),
                  
                  // 6. Bill No
                  pw.Text(
                    'Bill No # ${order.id}',
                    style: const pw.TextStyle(fontSize: 9.2),
                  ),
                  
                  // 7. Solid divider line
                  pw.SizedBox(height: 8),
                  pw.Divider(thickness: 1, color: PdfColors.black),
                  
                  // 8. Itemized List Table (Max Control for 80mm roll)
                  pw.Table(
                    columnWidths: {
                      0: const pw.FixedColumnWidth(28 * PdfPageFormat.mm),
                      1: const pw.FixedColumnWidth(10 * PdfPageFormat.mm),
                      2: const pw.FixedColumnWidth(17 * PdfPageFormat.mm),
                      3: const pw.FixedColumnWidth(17 * PdfPageFormat.mm),
                    },
                    defaultVerticalAlignment: pw.TableCellVerticalAlignment.top,
                    children: [
                      // 9. Header TableRow
                      pw.TableRow(
                        decoration: const pw.BoxDecoration(
                          border: pw.Border(bottom: pw.BorderSide(width: 0.5)),
                        ),
                        children: [
                          pw.Padding(
                            padding: const pw.EdgeInsets.symmetric(vertical: 2),
                            child: pw.Text('Product', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8.5)),
                          ),
                          pw.Padding(
                            padding: const pw.EdgeInsets.symmetric(vertical: 2),
                            child: pw.Text('Dis%', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8.5)),
                          ),
                          pw.Padding(
                            padding: const pw.EdgeInsets.symmetric(vertical: 2),
                            child: pw.Text('Dis Price', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8.5)),
                          ),
                          pw.Padding(
                            padding: const pw.EdgeInsets.only(right: 0.5 * PdfPageFormat.mm, top: 2, bottom: 2),
                            child: pw.Text('Amount', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8.5)),
                          ),
                        ],
                      ),
                      
                      // 10. Data TableRows
                      ...order.items.map((item) {
                        final discountedPrice = item.product.price * (1 - item.itemDiscountPercent / 100);
                        return pw.TableRow(
                          children: [
                            pw.Padding(
                              padding: const pw.EdgeInsets.symmetric(vertical: 2),
                              child: pw.Column(
                                crossAxisAlignment: pw.CrossAxisAlignment.start,
                                children: [
                                  pw.Text(item.product.name, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8.7)),
                                  pw.Text(
                                    '${item.quantity} X LKR ${currencyFormat.format(item.product.price)}',
                                    style: const pw.TextStyle(fontSize: 7.2, color: PdfColors.grey700),
                                  ),
                                ],
                              ),
                            ),
                            pw.Padding(
                              padding: const pw.EdgeInsets.symmetric(vertical: 2),
                              child: pw.Text(
                                item.itemDiscountPercent > 0 ? '${item.itemDiscountPercent.toInt()}%' : '-',
                                textAlign: pw.TextAlign.center, 
                                style: const pw.TextStyle(fontSize: 8.7),
                              ),
                            ),
                            pw.Padding(
                              padding: const pw.EdgeInsets.symmetric(vertical: 2),
                              child: pw.Text(
                                item.itemDiscountPercent > 0 ? currencyFormat.format(discountedPrice) : '-',
                                textAlign: pw.TextAlign.right, 
                                style: const pw.TextStyle(fontSize: 8.7),
                              ),
                            ),
                            pw.Padding(
                              padding: const pw.EdgeInsets.only(right: 0.5 * PdfPageFormat.mm, top: 2, bottom: 2),
                              child: pw.Text(
                                currencyFormat.format(item.totalPrice),
                                textAlign: pw.TextAlign.right, 
                                maxLines: 1,
                                overflow: pw.TextOverflow.clip,
                                style: const pw.TextStyle(fontSize: 8.7),
                              ),
                            ),
                          ],
                        );
                      }),
                    ],
                  ),
                  
                  // 11. Dashed divider
                  pw.SizedBox(height: 4),
                  pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),
                  
                  // 12. Sub Total
                  pw.SizedBox(height: 4),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('Sub Total :', style: const pw.TextStyle(fontSize: 8.7)),
                      pw.Text('LKR ${currencyFormat.format(order.subtotal)}', style: const pw.TextStyle(fontSize: 8.7)),
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
                          style: pw.TextStyle(fontSize: 8.7, color: PdfColors.grey700),
                        ),
                        pw.Text(
                          'LKR ${currencyFormat.format(order.discount)}',
                          style: pw.TextStyle(fontSize: 8.7, color: PdfColors.grey700),
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
                        pw.Text('TOTAL', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11.7)),
                        pw.Text('LKR ${currencyFormat.format(order.total)}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11.7)),
                      ],
                    ),
                  ),
                  
                  // 16. Solid divider
                  pw.Divider(thickness: 1, color: PdfColors.black),
                  
                  // 17. Payment
                  pw.SizedBox(height: 3),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('Payment :', style: const pw.TextStyle(fontSize: 8.7)),
                      pw.Text(order.paymentMethod, style: const pw.TextStyle(fontSize: 8.7)),
                    ],
                  ),
                  
                  // 18. Large blank space
                  pw.SizedBox(height: 25),
                  
                  // 19. Dashed divider
                  pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),
                  
                  // 20, 21, 22. Footer text
                  pw.SizedBox(height: 5),
                  pw.Text('Thank you for your purchase!', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10.7)),
                  pw.Text('Returns within 4 days with receipt', style: pw.TextStyle(fontSize: 9.7, fontStyle: pw.FontStyle.italic)),
                  pw.Text('Please come again', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9.7)),
                  
                  // 23. Dashed divider
                  pw.SizedBox(height: 5),
                  pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),
                  
                  // 24. Copyright
                  pw.SizedBox(height: 5),
                  pw.Text('© ElaraPOS - Retail Management', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700)),
                  pw.SizedBox(height: 20),
                ],
              ),
            ),
          ),
        );

        },
      ),
    );

    return pdf.save();
  }

  /// Finds a printer using smart detection for common POS/Thermal printers
  static Future<Printer?> findPrinter() async {
    if (kIsWeb) return null;
    try {
      final printers = await Printing.listPrinters();
      if (printers.isEmpty) return null;

      Printer? bestMatch;
      int bestScore = 0;

      for (final p in printers) {
        final name = p.name.toLowerCase();
        int score = 0;

        if (name.contains('xp')) score += 3;
        if (name.contains('xprinter')) score += 4;
        if (name.contains('thermal')) score += 2;
        if (name.contains('80')) score += 2;
        if (name.contains('58')) score += 2;
        if (name.contains('pos')) score += 2;
        if (name.contains('barcode')) score += 3;
        if (name.contains('usb')) score += 1;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = p;
        }
      }

      return bestMatch ?? printers.first;
    } catch (_) {
      return null;
    }
  }

  /// Shows a print preview dialog for the given [order].
  static Future<void> showPrintPreview(dynamic context, OrderModel order) async {
    await Printing.layoutPdf(
      format: PdfPageFormat.roll80,
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

  /// Prints barcode labels by showing the system print dialog.
  static Future<String?> directPrintBarcodes(BuildContext context, Uint8List pdfBytes) async {
    if (kIsWeb) return 'Printing is not supported in the browser version.';
    try {
      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdfBytes,
        name: 'Barcodes_${DateTime.now().millisecondsSinceEpoch}',
      );
      return null;
    } catch (e) {
      print("PRINT ERROR: $e");
      return 'Print error: $e';
    }
  }
}
