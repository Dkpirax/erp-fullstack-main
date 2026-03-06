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
  final GlobalKey<NavigatorState> navigatorKey;
  const ShortcutWrapper({Key? key, required this.child, required this.navigatorKey}) : super(key: key);

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

          // Only block if shortcut REQUIRES ctrl but ctrl isn't pressed.
          // Allow ctrl to be held even if shortcut doesn't specify it.
          if (requiresCtrl && !event.isControlPressed) return false;

          final mainKeys = _parseKeys(mainKeyStr);
          if (mainKeys.contains(event.logicalKey)) return true;

          final label = event.logicalKey.keyLabel?.toUpperCase();
          if (label != null && label.isNotEmpty && label == mainKeyStr) return true;
          
          final char = event.character?.toUpperCase();
          if (char != null && char.isNotEmpty && char == mainKeyStr) return true;

          // Fallback for Digit keys which sometimes lose keyLabel in certain web/desktop environments
          if (mainKeyStr.length == 1 && RegExp(r'[0-9]').hasMatch(mainKeyStr)) {
            final digit = int.parse(mainKeyStr);
            if (event.logicalKey.keyId == LogicalKeyboardKey.digit0.keyId + digit ||
                event.logicalKey.keyId == LogicalKeyboardKey.numpad0.keyId + digit) {
              return true;
            }
          }

          return false;
        }

        final shortcuts = provider.customShortcuts;

        if (isMatch(shortcuts['Menu'])) {
          _navigate(const MainPosScreen());
        } else if (isMatch(shortcuts['History'])) {
          _navigate(const HistoryScreen());
        } else if (isMatch(shortcuts['Promos'])) {
          _navigate(const PromosScreen());
        } else if (isMatch(shortcuts['Suppliers'])) {
          _navigate(const SuppliersScreen());
        } else if (isMatch(shortcuts['Products']) && provider.isAdmin) {
          _navigate(const ProductsScreen());
        } else if (isMatch(shortcuts['Barcodes']) && provider.isAdmin) {
          _navigate(const BarcodesScreen());
        } else if (isMatch(shortcuts['Settings'])) {
          _navigate(const SettingsScreen());
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

  Set<LogicalKeyboardKey> _parseKeys(String name) {
    if (name.length == 1) {
      final code = name.codeUnitAt(0);
      switch (name) {
        case '1': return {LogicalKeyboardKey.digit1, LogicalKeyboardKey.numpad1};
        case '2': return {LogicalKeyboardKey.digit2, LogicalKeyboardKey.numpad2};
        case '3': return {LogicalKeyboardKey.digit3, LogicalKeyboardKey.numpad3};
        case '4': return {LogicalKeyboardKey.digit4, LogicalKeyboardKey.numpad4};
        case '5': return {LogicalKeyboardKey.digit5, LogicalKeyboardKey.numpad5};
        case '6': return {LogicalKeyboardKey.digit6, LogicalKeyboardKey.numpad6};
        case '7': return {LogicalKeyboardKey.digit7, LogicalKeyboardKey.numpad7};
        case '8': return {LogicalKeyboardKey.digit8, LogicalKeyboardKey.numpad8};
        case '9': return {LogicalKeyboardKey.digit9, LogicalKeyboardKey.numpad9};
        case '0': return {LogicalKeyboardKey.digit0, LogicalKeyboardKey.numpad0};
        case '`': return {LogicalKeyboardKey.backquote};
      }
      if (code >= 65 && code <= 90) { // A-Z
        final char = String.fromCharCode(code).toLowerCase();
        switch (char) {
          case 'a': return {LogicalKeyboardKey.keyA};
          case 'b': return {LogicalKeyboardKey.keyB};
          case 'c': return {LogicalKeyboardKey.keyC};
          case 'd': return {LogicalKeyboardKey.keyD};
          case 'e': return {LogicalKeyboardKey.keyE};
          case 'f': return {LogicalKeyboardKey.keyF};
          case 'g': return {LogicalKeyboardKey.keyG};
          case 'h': return {LogicalKeyboardKey.keyH};
          case 'i': return {LogicalKeyboardKey.keyI};
          case 'j': return {LogicalKeyboardKey.keyJ};
          case 'k': return {LogicalKeyboardKey.keyK};
          case 'l': return {LogicalKeyboardKey.keyL};
          case 'm': return {LogicalKeyboardKey.keyM};
          case 'n': return {LogicalKeyboardKey.keyN};
          case 'o': return {LogicalKeyboardKey.keyO};
          case 'p': return {LogicalKeyboardKey.keyP};
          case 'q': return {LogicalKeyboardKey.keyQ};
          case 'r': return {LogicalKeyboardKey.keyR};
          case 's': return {LogicalKeyboardKey.keyS};
          case 't': return {LogicalKeyboardKey.keyT};
          case 'u': return {LogicalKeyboardKey.keyU};
          case 'v': return {LogicalKeyboardKey.keyV};
          case 'w': return {LogicalKeyboardKey.keyW};
          case 'x': return {LogicalKeyboardKey.keyX};
          case 'y': return {LogicalKeyboardKey.keyY};
          case 'z': return {LogicalKeyboardKey.keyZ};
        }
      }
    }
    if (name.startsWith('F') && name.length <= 3) {
      final num = int.tryParse(name.substring(1));
      if (num != null && num >= 1 && num <= 12) {
        return {LogicalKeyboardKey(LogicalKeyboardKey.f1.keyId + (num - 1))};
      }
    }
    if (name == 'ESCAPE' || name == 'ESC') return {LogicalKeyboardKey.escape};
    if (name == 'ENTER') return {LogicalKeyboardKey.enter, LogicalKeyboardKey.numpadEnter};
    if (name == 'SPACE') return {LogicalKeyboardKey.space};
    if (name == 'BACKSPACE') return {LogicalKeyboardKey.backspace};
    return {};
  }

  void _navigate(Widget screen) {
    navigatorKey.currentState?.pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation1, animation2) => screen,
        transitionDuration: Duration.zero,
        reverseTransitionDuration: Duration.zero,
      ),
    );
  }
}
