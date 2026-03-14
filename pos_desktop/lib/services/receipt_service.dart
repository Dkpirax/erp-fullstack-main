import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/services.dart' show rootBundle;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
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
  static Future<Uint8List> generateReceiptPdf(OrderModel order) async {
    final pdf = pw.Document();

    // Attempt to load logo
    pw.MemoryImage? logoImage;
    try {
      final logoData = await rootBundle.load('assets/image/ahu_logo.png');
      logoImage = pw.MemoryImage(logoData.buffer.asUint8List());
    } catch (_) {}

    final now = order.date;
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}  '
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.roll80,
        build: (pw.Context context) {
          return pw.Padding(
            padding: const pw.EdgeInsets.all(10),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                if (logoImage != null) ...[
                  pw.Center(child: pw.Image(logoImage, width: 60, height: 60)),
                  pw.SizedBox(height: 10),
                ],
                pw.Text('*** RECEIPT ***', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14)),
                pw.SizedBox(height: 4),
                pw.Text('Ahu Mens', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12)),
                pw.Text('427A/1 Main Street, Maruthamunai, Srilanka', style: const pw.TextStyle(fontSize: 8)),
                pw.Text('ElaraPOS - Retail Management', style: const pw.TextStyle(fontSize: 10)),
                pw.Text(dateStr, style: const pw.TextStyle(fontSize: 10)),
                pw.Text('Order #${order.id}', style: const pw.TextStyle(fontSize: 10)),
                pw.Divider(thickness: 1, borderStyle: pw.BorderStyle.dashed),
                pw.SizedBox(height: 8),

                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Expanded(child: pw.Text('ITEM', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10))),
                    pw.Text('QTY', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                    pw.SizedBox(width: 10),
                    pw.Text('PRICE', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                  ],
                ),
                pw.Divider(thickness: 0.5),

                ...order.items.map((item) {
                  final hasItemDiscount = item.hasDiscount;
                  return pw.Padding(
                    padding: const pw.EdgeInsets.symmetric(vertical: 2),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Expanded(
                              child: pw.Column(
                                crossAxisAlignment: pw.CrossAxisAlignment.start,
                                children: [
                                  pw.Text(item.product.name, style: const pw.TextStyle(fontSize: 10)),
                                  if ((item.product.size != null && item.product.size != 'null' && item.product.size!.isNotEmpty) ||
                                      (item.product.sizeNumeric != null && item.product.sizeNumeric != 'null' && item.product.sizeNumeric!.isNotEmpty))
                                    pw.Text('Size: ${item.product.size ?? ""} ${item.product.sizeNumeric ?? ""}'.trim(), style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700)),
                                ],
                              ),
                            ),
                            pw.Text('x${item.quantity}', style: const pw.TextStyle(fontSize: 10)),
                            pw.SizedBox(width: 10),
                            // Price column: show original struck-through + discounted if discount active
                            pw.Column(
                              crossAxisAlignment: pw.CrossAxisAlignment.end,
                              children: [
                                if (hasItemDiscount)
                                  pw.Text(
                                    'LKR ${item.originalTotalPrice.toStringAsFixed(2)}',
                                    style: pw.TextStyle(
                                      fontSize: 8,
                                      color: PdfColors.grey600,
                                      decoration: pw.TextDecoration.lineThrough,
                                    ),
                                  ),
                                pw.Text(
                                  'LKR ${item.totalPrice.toStringAsFixed(2)}',
                                  style: pw.TextStyle(
                                    fontSize: 10,
                                    color: hasItemDiscount ? PdfColors.green700 : PdfColors.black,
                                    fontWeight: hasItemDiscount ? pw.FontWeight.bold : pw.FontWeight.normal,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        // Discount sub-line
                        if (hasItemDiscount)
                          pw.Padding(
                            padding: const pw.EdgeInsets.only(left: 8, top: 1),
                            child: pw.Text(
                              '\u21b3 ${item.itemDiscountPercent.toInt()}% item discount  (-LKR ${item.discountAmount.toStringAsFixed(2)})',
                              style: const pw.TextStyle(fontSize: 8, color: PdfColors.green700),
                            ),
                          ),
                      ],
                    ),
                  );
                }).toList(),

                pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),
                pw.SizedBox(height: 8),

                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Sub Total:', style: const pw.TextStyle(fontSize: 10)),
                    pw.Text('LKR ${order.subtotal.toStringAsFixed(2)}', style: const pw.TextStyle(fontSize: 10)),
                  ],
                ),
                // Per-item discount summary line
                if (order.items.any((i) => i.hasDiscount))
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('Item Discounts:', style: const pw.TextStyle(fontSize: 10, color: PdfColors.green700)),
                      pw.Text(
                        '-LKR ${order.items.fold(0.0, (s, i) => s + i.discountAmount).toStringAsFixed(2)}',
                        style: const pw.TextStyle(fontSize: 10, color: PdfColors.green700),
                      ),
                    ],
                  ),
                // Promo / cart-level discount line
                if (order.discount > 0)
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('Promo Discount:', style: const pw.TextStyle(fontSize: 10)),
                      pw.Text('-LKR ${order.discount.toStringAsFixed(2)}', style: const pw.TextStyle(fontSize: 10)),
                    ],
                  ),
                pw.Divider(thickness: 1),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('TOTAL:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12)),
                    pw.Text('LKR ${order.total.toStringAsFixed(2)}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12)),
                  ],
                ),
                pw.Divider(thickness: 1),
                pw.SizedBox(height: 4),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Payment:', style: const pw.TextStyle(fontSize: 10)),
                    pw.Text(order.paymentMethod, style: const pw.TextStyle(fontSize: 10)),
                  ],
                ),

                pw.SizedBox(height: 20),
                pw.Divider(thickness: 1, borderStyle: pw.BorderStyle.dashed),
                pw.Text('Thank you for your purchase!', style: const pw.TextStyle(fontSize: 10)),
                pw.Text('Returns within 4 days with receipt', style: const pw.TextStyle(fontSize: 8, fontStyle: pw.FontStyle.italic)),
                pw.Text('Please come again', style: const pw.TextStyle(fontSize: 10)),
                pw.Divider(thickness: 1, borderStyle: pw.BorderStyle.dashed),
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
      onLayout: (PdfPageFormat format) async => await generateReceiptPdf(order),
      name: 'Receipt_${order.id}',
    );
  }

  /// Prints [order] directly to the printer named [printerName].
  /// If [printerName] is null/empty, it tries to auto-detect a receipt printer.
  /// Returns `null` on success, or an error string on failure.
  static Future<String?> printReceipt(OrderModel order, String? printerName) async {
    if (kIsWeb) return 'Printing is not supported in the browser version.';

    try {
      final pdfBytes = await generateReceiptPdf(order);
      Printer? printer;

      if (printerName != null && printerName.isNotEmpty) {
        final printers = await Printing.listPrinters();
        printer = printers.firstWhere(
          (p) => p.name == printerName,
          orElse: () => printers.first,
        );
      } else {
        // Auto-detect receipt printer
        printer = await findPrinter(['Receipt', 'POS-80', 'POS-58', 'Xprinter', 'EPSON']);
      }

      if (printer == null) return 'No printer found';

      final result = await Printing.directPrintPdf(
        printer: printer,
        onLayout: (PdfPageFormat format) async => pdfBytes,
        name: 'Receipt_${order.id}',
      );

      return result ? null : 'Print failed';
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
        printer = await findPrinter(['Barcode', 'Label', 'Xprinter', 'Zebra', 'Gprinter', 'TSC']);
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