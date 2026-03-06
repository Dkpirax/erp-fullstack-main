import 'package:flutter/material.dart';
import '../models/product.dart';
import '../models/cart_item.dart';
import '../models/promo.dart';
import '../models/order.dart';
import '../models/supplier.dart';
import '../services/api_service.dart';
// import 'package:serial_port_win32/serial_port_win32.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:typed_data';

class PosProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  VoidCallback? onCheckoutTrigger;
  VoidCallback? onApplyTrigger;
  VoidCallback? onSearchTrigger;
  VoidCallback? onNewProductTrigger;
  VoidCallback? onRefreshTrigger;
  VoidCallback? onFullscreenTrigger;

  List<Product> _products = [];
  List<Product> get products => _products;

  List<CartItem> _cart = [];
  List<CartItem> get cart => _cart;

  List<OrderModel> _orderHistory = [];
  List<OrderModel> get orderHistory => _orderHistory;

  List<Supplier> _suppliers = [];
  List<Supplier> get suppliers => _suppliers;

  // Settings
  bool _useOnScreenKeyboard = false;
  bool get useOnScreenKeyboard => _useOnScreenKeyboard;

  bool _useKeyboardShortcuts = true;
  bool get useKeyboardShortcuts => _useKeyboardShortcuts;

  void setUseOnScreenKeyboard(bool value) {
    _useOnScreenKeyboard = value;
    notifyListeners();
  }

  void setUseKeyboardShortcuts(bool value) {
    _useKeyboardShortcuts = value;
    notifyListeners();
  }

  // Discount Logic
  double _manualDiscount = 0.0;
  double get manualDiscount => _manualDiscount;
  
  double _percentageDiscount = 0.0;
  double get percentageDiscount => _percentageDiscount;

  void setManualDiscount(double value) {
    _manualDiscount = value;
    notifyListeners();
  }

  void setPercentageDiscount(double value) {
    _percentageDiscount = value;
    notifyListeners();
  }

  // Editable Shortcuts
  Map<String, String> _customShortcuts = {
    'Menu': 'CTRL+1',
    'History': 'CTRL+2',
    'Promos': 'CTRL+3',
    'Suppliers': 'CTRL+4',
    'Products': 'CTRL+5',
    'Barcodes': 'CTRL+6',
    'Settings': 'CTRL+7',
    'Checkout': 'SPACE',
    'Clear Cart': 'BACKSPACE',
    'Apply': 'ENTER',
    'Search': '`',
    'Fullscreen': 'ESC',
    'New Product': 'CTRL+N',
    'Keyboard': 'CTRL+C',
    'Refresh': 'CTRL+R',
  };
  Map<String, String> get customShortcuts => _customShortcuts;

  void updateShortcut(String action, String key) {
    _customShortcuts[action] = key;
    notifyListeners();
  }

  void triggerCheckout() => onCheckoutTrigger?.call();
  void triggerApply() => onApplyTrigger?.call();
  void triggerSearch() => onSearchTrigger?.call();
  void triggerNewProduct() => onNewProductTrigger?.call();
  void triggerRefresh() => onRefreshTrigger?.call();
  void triggerFullscreen() => onFullscreenTrigger?.call();

  void toggleOnScreenKeyboard() {
    _useOnScreenKeyboard = !_useOnScreenKeyboard;
    notifyListeners();
  }

  String get serverUrl => _apiService.baseUrl;
  String get baseDomain => _apiService.serverUrl;

  void updateServerUrl(String url) {
    _apiService.updateBaseUrl(url);
    notifyListeners();
  }

  String? _selectedPrinterName;
  String? get selectedPrinterName => _selectedPrinterName;

  void setSelectedPrinterName(String? name) {
    _selectedPrinterName = name;
    notifyListeners();
  }

  // Scanner Settings
  String? _selectedScannerPort;
  String? get selectedScannerPort => _selectedScannerPort;
  // SerialPort? _activeSerialPort;
  dynamic _activeSerialPort;

  void setSelectedScannerPort(String? portName) {
    if (_selectedScannerPort == portName) return;
    _selectedScannerPort = portName;
    _initializeSerialScanner();
    notifyListeners();
  }

  List<String> getAvailableSerialPorts() {
    // if (kIsWeb) return [];
    // try {
    //   return SerialPort.getAvailablePorts();
    // } catch (e) {
    //   return [];
    // }
    return [];
  }

  void _initializeSerialScanner() {
    // try {
    //   if (_activeSerialPort != null) {
    //     _activeSerialPort!.close();
    //     _activeSerialPort = null;
    //   }
    // } catch (e) {
    //   print('Error closing port: $e');
    // }

    // if (kIsWeb) return;
    // if (_selectedScannerPort == null || _selectedScannerPort == 'None') return;

    // try {
    //   final port = SerialPort(_selectedScannerPort!, BaudRate: 9600);
    //   port.open();
    //   if (port.isOpened) {
    //     _activeSerialPort = port;
    //     _listenToSerial();
    //   }
    // } catch (e) {
    //   print('Failed to open serial port: $e');
    // }
  }

  void _listenToSerial() async {
    // if (_activeSerialPort == null) return;
    
    // String buffer = '';
    // while (_activeSerialPort != null && _activeSerialPort!.isOpened) {
    //   try {
    //     final data = await _activeSerialPort!.readBytes(1, timeout: const Duration(milliseconds: 10)); // Read byte by byte for simplicity or use events
    //     if (data.isNotEmpty) {
    //        final char = String.fromCharCodes(data);
    //        if (char == '\n' || char == '\r') {
    //          if (buffer.isNotEmpty) {
    //            addProductByBarcode(buffer.trim());
    //            buffer = '';
    //          }
    //        } else {
    //          buffer += char;
    //        }
    //     }
    //   } catch (e) {
    //     break;
    //   }
    //   await Future.delayed(const Duration(milliseconds: 10));
    // }
  }

  // Promos
  List<Promo> _promos = [];
  List<Promo> get promos => _promos;
  Promo? _selectedPromo;
  Promo? get selectedPromo => _selectedPromo;

  // User info
  String get userRole => _apiService.userRole;
  bool get isAdmin => userRole == 'admin';

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _isLoggedIn = false;
  bool get isLoggedIn => _isLoggedIn;

  String? _productError;
  String? get productError => _productError;

  String? _promoError;
  String? get promoError => _promoError;

  String? _selectedCategory;
  String? get selectedCategory => _selectedCategory;

  List<String> get categories {
    final cats = _products
        .map((p) => p.category)
        .where((c) => c.isNotEmpty)
        .toSet()
        .toList();
    cats.sort();
    return ['All', ...cats];
  }

  double get subtotal => _cart.fold(0, (sum, item) => sum + item.totalPrice);
  double get promoDiscount => _selectedPromo?.calculateDiscount(subtotal) ?? 0;
  double get totalPercentageDiscount => (subtotal - promoDiscount) * (_percentageDiscount / 100);
  double get discount => promoDiscount + totalPercentageDiscount + _manualDiscount;
  double get total => (subtotal - discount) < 0 ? 0 : (subtotal - discount);
  int get totalItems => _cart.fold(0, (sum, item) => sum + item.quantity);

  PosProvider();

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    notifyListeners();
    final success = await _apiService.login(username, password);
    _isLoading = false;
    if (success) {
      _isLoggedIn = true;
      await fetchProducts();
      await fetchPromos();
      await fetchOrderHistory();
      await fetchSuppliers();
    }
    notifyListeners();
    return success;
  }

  void logout() {
    _isLoggedIn = false;
    _products = [];
    _cart = [];
    _promos = [];
    _orderHistory = [];
    _suppliers = [];
    _selectedPromo = null;
    _apiService.logout();
    notifyListeners();
  }

  Future<void> fetchProducts({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _productError = null;
      notifyListeners();
    }
    _products = await _apiService.fetchProducts();
    _productError = _apiService.lastError;
    if (_products.isNotEmpty && _selectedCategory == null) {
      _selectedCategory = categories.isNotEmpty ? categories.first : null;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createProduct(Map<String, dynamic> data) async {
    final success = await _apiService.createProduct(data);
    if (success) {
      await fetchProducts();
    }
    return success;
  }

  void addProductByBarcode(String barcode) {
    if (barcode.trim().isEmpty) return;
    try {
      final product = _products.firstWhere((p) => p.sku == barcode.trim() || p.id == barcode.trim());
      addToCart(product);
    } catch (e) {
      // Product not found
    }
  }

  Future<bool> updateProduct(String id, Map<String, dynamic> data) async {
    final success = await _apiService.updateProduct(id, data);
    if (success) {
      await fetchProducts();
    }
    return success;
  }

  Future<String?> uploadProductImageBytes(Uint8List bytes, String filename) async {
    return await _apiService.uploadProductImageBytes(bytes, filename);
  }

  Future<void> fetchPromos() async {
    _promos = await _apiService.fetchPromos();
    _promoError = _promos.isEmpty ? _apiService.lastError : null;
    notifyListeners();
  }

  Future<void> fetchOrderHistory() async {
    _orderHistory = await _apiService.fetchOrderHistory();
    notifyListeners();
  }

  Future<List<Supplier>> fetchSuppliers() async {
    _suppliers = await _apiService.fetchSuppliers();
    notifyListeners();
    return _suppliers;
  }

  Future<bool> createSupplier(Map<String, dynamic> data) async {
    final success = await _apiService.createSupplier(data);
    if (success) {
      await fetchSuppliers();
    }
    return success;
  }

  Future<bool> updateSupplier(String id, Map<String, dynamic> data) async {
    final success = await _apiService.updateSupplier(id, data);
    if (success) {
      await fetchSuppliers();
    }
    return success;
  }

  void applyPromo(Promo promo) {
    _selectedPromo = promo;
    notifyListeners();
  }

  String? applyPromoByCode(String code) {
    final upperCode = code.trim().toUpperCase();
    if (upperCode.isEmpty) return 'Please enter a promo code.';
    final match = _promos.cast<Promo?>().firstWhere(
      (p) => p != null && p.code == upperCode,
      orElse: () => null,
    );
    if (match == null) return 'Invalid promo code "$upperCode".';
    if (!match.isActive) return 'Promo "$upperCode" is no longer active.';
    if (subtotal < match.minPurchase) {
      return 'Minimum order of LKR ${match.minPurchase.toStringAsFixed(2)} required for "$upperCode".';
    }
    _selectedPromo = match;
    notifyListeners();
    return null;
  }

  void removePromo() {
    _selectedPromo = null;
    _manualDiscount = 0;
    _percentageDiscount = 0;
    notifyListeners();
  }

  Future<bool> createPromo(Map<String, dynamic> data) async {
    final created = await _apiService.createPromo(data);
    if (created != null) {
      _promos.insert(0, created);
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<bool> deletePromo(String promoId) async {
    final success = await _apiService.deletePromo(promoId);
    if (success) {
      _promos.removeWhere((p) => p.id == promoId);
      if (_selectedPromo?.id == promoId) _selectedPromo = null;
      notifyListeners();
    }
    return success;
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  List<Product> get filteredProducts {
    if (_selectedCategory == null || _selectedCategory == 'All') return _products;
    return _products.where((p) => p.category == _selectedCategory).toList();
  }

  void addToCart(Product product) {
    final index = _cart.indexWhere((item) => item.product.id == product.id);
    int currentQty = index >= 0 ? _cart[index].quantity : 0;
    
    // Do not exceed physical stock
    if (currentQty >= product.stockCount) {
      return;
    }

    if (index >= 0) {
      _cart[index].quantity++;
    } else {
      _cart.add(CartItem(product: product));
    }
    notifyListeners();
  }

  void updateQuantity(Product product, int quantity) {
    final index = _cart.indexWhere((item) => item.product.id == product.id);
    if (index >= 0) {
      if (quantity <= 0) {
        _cart.removeAt(index);
      } else {
        _cart[index].quantity = quantity;
      }
      notifyListeners();
    }
  }

  Map<String, int> getProductStockInfo(String productId) {
    try {
      final product = _products.firstWhere((p) => p.id == productId);
      final cartItemIndex = _cart.indexWhere((item) => item.product.id == productId);
      int cartQty = 0;
      if (cartItemIndex >= 0) {
        cartQty = _cart[cartItemIndex].quantity;
      }
      int balance = product.stockCount - cartQty;
      return {
        'stock': balance < 0 ? 0 : balance,
        'total': product.stockCount,
        'cart': cartQty,
      };
    } catch (e) {
      return {'stock': 0, 'total': 0, 'cart': 0};
    }
  }

  void clearCart() {
    _cart.clear();
    notifyListeners();
  }

  Future<bool> checkout(String paymentMethod) async {
    if (_cart.isEmpty) return false;
    final orderData = _cart.map((item) => {
      'productId': item.product.id,
      'quantity': item.quantity,
      'price': item.product.price,
    }).toList();
    _isLoading = true;
    notifyListeners();
    final success = await _apiService.submitOrder(
      orderData, 
      total, 
      discountAmount: discount, 
      subtotalAmount: subtotal, 
      paymentMethod: paymentMethod
    );
    _isLoading = false;
    if (success) {
      await fetchOrderHistory();
      await fetchProducts(silent: true);
      clearCart();
      removePromo();
    }
    notifyListeners();
    return success;
  }

  Future<bool> deleteProduct(String id) async {
    final success = await _apiService.deleteProduct(id);
    if (success) {
      await fetchProducts();
    }
    return success;
  }

  Future<bool> deleteSupplier(String id) async {
    final success = await _apiService.deleteSupplier(id);
    if (success) {
      await fetchSuppliers();
    }
    return success;
  }
}
