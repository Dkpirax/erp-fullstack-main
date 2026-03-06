import 'dart:io' show Process, File, Directory;
import 'package:flutter/foundation.dart' show kIsWeb;
import '../models/order.dart';

class ReceiptService {
  /// Enumerates ALL installed printers (local + network/shared) using
  /// PowerShell [Get-Printer], which is the modern Windows API that correctly
  /// returns network printers. Falls back to wmic if PowerShell fails.
  static Future<List<String>> listPrinters() async {
    if (kIsWeb) return [];
    // Primary: PowerShell Get-Printer (works on Windows 8+ / Server 2012+)
    try {
      final result = await Process.run(
        'powershell',
        [
          '-NonInteractive',
          '-Command',
          r"Get-Printer | Select-Object -ExpandProperty Name",
        ],
        runInShell: true,
      );
      if (result.exitCode == 0) {
        final printers = (result.stdout as String)
            .split('\n')
            .map((l) => l.trim())
            .where((l) => l.isNotEmpty)
            .toList();
        if (printers.isNotEmpty) return printers;
      }
    } catch (_) {}

    // Fallback: wmic (older Windows)
    try {
      final result = await Process.run(
        'wmic',
        ['printer', 'get', 'name', '/format:list'],
        runInShell: true,
      );
      return (result.stdout as String)
          .split('\n')
          .where((l) => l.trim().startsWith('Name='))
          .map((l) => l.trim().replaceFirst('Name=', '').trim())
          .where((l) => l.isNotEmpty)
          .toList();
    } catch (_) {
      return [];
    }
  }


  /// Generates a plain-text receipt from an [OrderModel].
  static String generateReceiptText(OrderModel order) {
    final now = order.date;
    final dateStr =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}  '
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    final sep  = '=' * 40;
    final dash = '-' * 40;

    final buf = StringBuffer();

    // ── Header ────────────────────────────────────
    buf.writeln(sep);
    buf.writeln(_center('*** RECEIPT ***'));
    buf.writeln(_center('Ahu wears'));
    buf.writeln(_center('ElaraPOS - Retail Management'));
    buf.writeln(_center(dateStr));
    buf.writeln(_center('Order #${order.id}'));
    buf.writeln(sep);
    buf.writeln();

    // ── Items ─────────────────────────────────────
    buf.writeln(_padRow('ITEM', 'QTY', 'PRICE'));
    buf.writeln(dash);
    for (final item in order.items) {
      final name = item.product.name.length > 20
          ? item.product.name.substring(0, 20)
          : item.product.name;
      final qty   = 'x${item.quantity}';
      final price = 'LKR ${item.totalPrice.toStringAsFixed(2)}';
      buf.writeln(_padRow(name, qty, price));
    }
    buf.writeln(dash);
    buf.writeln();

    // ── Totals ────────────────────────────────────
    buf.writeln(_alignRight('Sub Total:', 'LKR ${order.subtotal.toStringAsFixed(2)}'));
    if (order.discount > 0) {
      buf.writeln(_alignRight('Discount:', '-LKR ${order.discount.toStringAsFixed(2)}'));
    }
    buf.writeln(dash);
    buf.writeln(_alignRight('TOTAL:', 'LKR ${order.total.toStringAsFixed(2)}'));
    buf.writeln(dash);
    buf.writeln(_alignRight('Payment:', order.paymentMethod));
    buf.writeln();

    // ── Footer ────────────────────────────────────
    buf.writeln(sep);
    buf.writeln(_center('Thank you for your purchase!'));
    buf.writeln(_center('Please come again'));
    buf.writeln(sep);
    buf.writeln();
    buf.writeln(); // extra feed for cutter

    return buf.toString();
  }

  /// Prints [order] to the Windows/network printer named [printerName].
  ///
  /// Uses PowerShell `Out-Printer` which works for any printer installed in
  /// Windows (local USB, Bluetooth, or network shared printers).
  ///
  /// Returns `null` on success, or an error string on failure.
  static Future<String?> printReceipt(
      OrderModel order, String printerName) async {
    if (kIsWeb) return 'Printing is not supported in the browser version.';
    final receiptText = generateReceiptText(order);

    // Write to a temp file
    final tmpDir  = Directory.systemTemp;
    final tmpFile = File('${tmpDir.path}\\pos_receipt_${DateTime.now().millisecondsSinceEpoch}.txt');
    await tmpFile.writeAsString(receiptText);

    try {
      // PowerShell Out-Printer works for local AND network printers.
      // -Name accepts the exact printer name from wmic/print management.
      final safeFile    = tmpFile.path.replaceAll("'", "''");
      final safePrinter = printerName.replaceAll("'", "''");

      final result = await Process.run(
        'powershell',
        [
          '-NonInteractive',
          '-Command',
          "Get-Content -Raw '$safeFile' | Out-Printer -Name '$safePrinter'",
        ],
        runInShell: true,
      );

      if (result.exitCode != 0) {
        final err = (result.stderr as String).trim();
        return err.isEmpty ? 'Print failed (exit ${result.exitCode})' : err;
      }
      return null; // success
    } catch (e) {
      return 'Print error: $e';
    } finally {
      // Clean up temp file (best effort)
      try {
        await tmpFile.delete();
      } catch (_) {}
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  static String _center(String text, {int width = 40}) {
    if (text.length >= width) return text;
    final pad = (width - text.length) ~/ 2;
    return ' ' * pad + text;
  }

  static String _padRow(String left, String mid, String right,
      {int width = 40}) {
    // left ≤ 22 chars, mid ≤ 4, right fills rest
    final l = left.padRight(22).substring(0, 22);
    final m = mid.padLeft(4);
    final r = right.padLeft(width - 22 - 4);
    return '$l$m$r';
  }

  static String _alignRight(String label, String value, {int width = 40}) {
    final total = label.length + value.length;
    if (total >= width) return '$label $value';
    return label + ' ' * (width - total) + value;
  }
}
