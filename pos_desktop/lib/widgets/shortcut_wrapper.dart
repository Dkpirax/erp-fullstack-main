import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../screens/main_pos_screen.dart';
import '../screens/history_screen.dart';
import '../screens/promos_screen.dart';
import '../screens/suppliers_screen.dart';
import '../screens/products_screen.dart';
import '../screens/barcodes_screen.dart';
import '../screens/settings_screen.dart';

class ShortcutWrapper extends StatelessWidget {
  final Widget child;
  const ShortcutWrapper({Key? key, required this.child}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Focus(
      autofocus: true,
      onKey: (node, event) {
        if (event is! RawKeyDownEvent) return KeyEventResult.ignored;

        final provider = Provider.of<PosProvider>(context, listen: false);
        if (!provider.useKeyboardShortcuts || !provider.isLoggedIn) return KeyEventResult.ignored;

        bool isMatch(String? mappedVal) {
          if (mappedVal == null || mappedVal.isEmpty) return false;
          final parts = mappedVal.toUpperCase().split('+').map((e) => e.trim()).toList();
          final requiresCtrl = parts.contains('CTRL');
          final mainKeyStr = parts.last;

          if (requiresCtrl != event.isControlPressed) return false;

          final mainKey = _parseKey(mainKeyStr);
          return event.logicalKey == mainKey;
        }

        final shortcuts = provider.customShortcuts;

        if (isMatch(shortcuts['Menu'])) {
          _navigate(context, const MainPosScreen());
        } else if (isMatch(shortcuts['History'])) {
          _navigate(context, const HistoryScreen());
        } else if (isMatch(shortcuts['Promos'])) {
          _navigate(context, const PromosScreen());
        } else if (isMatch(shortcuts['Suppliers'])) {
          _navigate(context, const SuppliersScreen());
        } else if (isMatch(shortcuts['Products']) && provider.isAdmin) {
          _navigate(context, const ProductsScreen());
        } else if (isMatch(shortcuts['Barcodes']) && provider.isAdmin) {
          _navigate(context, const BarcodesScreen());
        } else if (isMatch(shortcuts['Settings'])) {
          _navigate(context, const SettingsScreen());
        } else if (isMatch(shortcuts['Checkout'])) {
          provider.triggerCheckout();
        } else if (isMatch(shortcuts['Clear Cart'])) {
          provider.clearCart();
          provider.removePromo();
        } else if (isMatch(shortcuts['Apply'])) {
          provider.triggerApply();
        } else if (isMatch(shortcuts['Search'])) {
          provider.triggerSearch();
        } else if (isMatch(shortcuts['New Product']) && provider.isAdmin) {
          provider.triggerNewProduct();
        } else if (isMatch(shortcuts['Keyboard'])) {
          provider.toggleOnScreenKeyboard();
        } else if (isMatch(shortcuts['Refresh'])) {
          provider.triggerRefresh();
        } else if (isMatch(shortcuts['Fullscreen'])) {
          provider.triggerFullscreen();
        } else {
          return KeyEventResult.ignored;
        }

        return KeyEventResult.handled;
      },
      child: child,
    );
  }

  LogicalKeyboardKey? _parseKey(String name) {
    if (name.length == 1) {
      final code = name.codeUnitAt(0);
      switch (name) {
        case '1': return LogicalKeyboardKey.digit1;
        case '2': return LogicalKeyboardKey.digit2;
        case '3': return LogicalKeyboardKey.digit3;
        case '4': return LogicalKeyboardKey.digit4;
        case '5': return LogicalKeyboardKey.digit5;
        case '6': return LogicalKeyboardKey.digit6;
        case '7': return LogicalKeyboardKey.digit7;
        case '8': return LogicalKeyboardKey.digit8;
        case '9': return LogicalKeyboardKey.digit9;
        case '0': return LogicalKeyboardKey.digit0;
        case '`': return LogicalKeyboardKey.backquote;
      }
      if (code >= 65 && code <= 90) { // A-Z
        return LogicalKeyboardKey(code + 32); // Lowercase match
      }
    }
    if (name.startsWith('F') && name.length <= 3) {
      final num = int.tryParse(name.substring(1));
      if (num != null && num >= 1 && num <= 12) {
        return LogicalKeyboardKey(LogicalKeyboardKey.f1.keyId + (num - 1));
      }
    }
    if (name == 'ESCAPE' || name == 'ESC') return LogicalKeyboardKey.escape;
    if (name == 'ENTER') return LogicalKeyboardKey.enter;
    if (name == 'SPACE') return LogicalKeyboardKey.space;
    if (name == 'BACKSPACE') return LogicalKeyboardKey.backspace;
    return null;
  }

  void _navigate(BuildContext context, Widget screen) {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation1, animation2) => screen,
        transitionDuration: Duration.zero,
        reverseTransitionDuration: Duration.zero,
      ),
    );
  }
}
