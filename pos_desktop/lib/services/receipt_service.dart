import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart' show BuildContext;
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

  /// Generates a PDF receipt using PDF widgets.
  static Future<Uint8List> generateReceipt(OrderModel order) async {
    final pdf = pw.Document();
    final dateStr = DateFormat('dd/MM/yyyy').format(order.date);
    final timeStr = DateFormat('HH:mm').format(order.date);
    final currencyFormat = NumberFormat('#,##0.00');

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.roll80.copyWith(
          marginTop: 5 * PdfPageFormat.mm,
          marginBottom: 5 * PdfPageFormat.mm,
          marginLeft:PdfPageFormat.mm,
          marginRight: 10 * PdfPageFormat.mm,
        ),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              // Header
              pw.Text('Ahu Mens', 
                  style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 4),
              pw.Text('427 A/1 Main Street, Maruthamunai', 
                  style: const pw.TextStyle(fontSize: 10)),
              pw.Text('072 464 4200', 
                  style: const pw.TextStyle(fontSize: 10)),
              pw.Text('$dateStr $timeStr', 
                  style: const pw.TextStyle(fontSize: 10)),
              pw.Text('Bill No #${order.id}', 
                  style: const pw.TextStyle(fontSize: 10)),
              pw.SizedBox(height: 10),

              // Table Header
              pw.Divider(thickness: 1, color: PdfColors.black),
              pw.Padding(
                padding: const pw.EdgeInsets.symmetric(vertical: 2),
                child: pw.Row(
                  children: [
                    pw.Expanded(flex: 3, child: pw.Text('Product', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9))),
                    pw.Expanded(flex: 1, child: pw.Text('Dis%', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9))),
                    pw.Expanded(flex: 2, child: pw.Text('Disc Amount', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9))),
                    pw.Expanded(flex: 2, child: pw.Text('Amount', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9))),
                  ],
                ),
              ),
              pw.Divider(thickness: 1, color: PdfColors.black),

              // Items
              pw.SizedBox(height: 5),
              ...order.items.map((item) {
                return pw.Padding(
                  padding: const pw.EdgeInsets.only(bottom: 8),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Row(
                        children: [
                          pw.Expanded(flex: 3, child: pw.Text(item.product.name, style: const pw.TextStyle(fontSize: 10))),
                          pw.Expanded(flex: 1, child: pw.Text('${item.itemDiscountPercent.toInt()}%', textAlign: pw.TextAlign.center, style: const pw.TextStyle(fontSize: 10))),
                          pw.Expanded(flex: 2, child: pw.Text(currencyFormat.format(item.discountAmount), textAlign: pw.TextAlign.right, style: const pw.TextStyle(fontSize: 10))),
                          pw.Expanded(flex: 2, child: pw.Text(currencyFormat.format(item.totalPrice), textAlign: pw.TextAlign.right, style: const pw.TextStyle(fontSize: 10))),
                        ],
                      ),
                      pw.Text('${item.quantity} x ${currencyFormat.format(item.product.price)}', 
                          style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700)),
                    ],
                  ),
                );
              }).toList(),

              pw.SizedBox(height: 2),
              pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),
              pw.SizedBox(height: 6),

              // Summary
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Subtotal', style: const pw.TextStyle(fontSize: 11)),
                  pw.Text('LKR ${currencyFormat.format(order.subtotal)}', style: const pw.TextStyle(fontSize: 11)),
                ],
              ),
              pw.SizedBox(height: 2),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Total Discount', style: const pw.TextStyle(fontSize: 11)),
                  pw.Text('LKR ${currencyFormat.format(order.discount)}', style: const pw.TextStyle(fontSize: 11)),
                ],
              ),
              pw.SizedBox(height: 6),
              pw.Divider(thickness: 1, color: PdfColors.black),
              pw.SizedBox(height: 4),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Total', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                  pw.Text('LKR ${currencyFormat.format(order.total)}', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                ],
              ),
              pw.SizedBox(height: 4),
              pw.Divider(thickness: 1, color: PdfColors.black),
              pw.SizedBox(height: 6),

              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Payment:', style: const pw.TextStyle(fontSize: 11)),
                  pw.Text(order.paymentMethod, style: const pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
                ],
              ),

              pw.SizedBox(height: 15),
              pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),
              pw.SizedBox(height: 10),

              // Footer
              pw.Text('Thankyou for your purchase', 
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
              pw.SizedBox(height: 2),
              pw.Text('Returns within 4 days with receipt', 
                  style: pw.TextStyle(fontStyle: pw.FontStyle.italic, fontSize: 10)),
              pw.SizedBox(height: 2),
              pw.Text('Please Come again', 
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
              
              pw.SizedBox(height: 10),
              pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),
              pw.SizedBox(height: 6),
              pw.Text('© ElaraPOS by Eriline', style: const pw.TextStyle(fontSize: 9)),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }


  static Future<void> showPrintPreview(dynamic context, OrderModel order) async {
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async {
        return await generateReceipt(order);
      },
      name: 'Receipt_${order.id}',
    );
  }

  /// Prints [order] by showing the system print dialog.
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
      return 'Print error: $e';
    }
  }
}
