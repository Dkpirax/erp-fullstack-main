import 'package:flutter/material.dart';
import '../models/product.dart';
import '../models/cart_item.dart';
import '../models/promo.dart';
import '../models/order.dart';
import '../models/supplier.dart';
import '../services/api_service.dart';
// import 'package:serial_port_win32/serial_port_win32.dart';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'dart:typed_data';

class PosProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  ApiService get apiService => _apiService;

  PosProvider() {
    initializeSettings();
  }

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

  // Accounts Module State
  Map<String, dynamic>? _dailySummary;
  Map<String, dynamic>? _monthlyReport;
  List<dynamic> _expenseCategories = [];

  Map<String, dynamic>? get dailySummary => _dailySummary;
  Map<String, dynamic>? get monthlyReport => _monthlyReport;
  List<dynamic> get expenseCategories => _expenseCategories;

  // Elais AI state
  List<Map<String, dynamic>> _elaisAlerts = [];
  List<Map<String, String>> _chatHistory = []; // {role: 'user'|'assistant', content: '...'}
  String? _dailyBrief;
  bool _elaisLoading = false;
  Map<String, dynamic>? _elaisCheckoutAnalysis;
  Map<String, dynamic>? _elaisBundleSuggestion;
  bool _isElaisAnalysisLoading = false;

  List<Map<String, dynamic>> get elaisAlerts => _elaisAlerts;
  List<Map<String, String>> get chatHistory => _chatHistory;
  String? get dailyBrief => _dailyBrief;
  bool get elaisLoading => _elaisLoading;
  Map<String, dynamic>? get elaisCheckoutAnalysis => _elaisCheckoutAnalysis;
  Map<String, dynamic>? get elaisBundleSuggestion => _elaisBundleSuggestion;
  bool get isElaisAnalysisLoading => _isElaisAnalysisLoading;

  // Settings
  bool _useOnScreenKeyboard = false;
  bool get useOnScreenKeyboard => _useOnScreenKeyboard;

  bool _useKeyboardShortcuts = true;
  bool get useKeyboardShortcuts => _useKeyboardShortcuts;

  // Elais Settings
  bool _elaisEnabled = true;
  String _elaisSource = 'local';
  String _elaisModel = 'phi3:mini';
  String _elaisOnlineUrl = 'https://ollama.com/api/chat';
  String _elaisOnlineKey = 'bb2b103e40b14846be8287cd366b3994.i2w1u91QQwYB2ePug1CB2B_m';
  String _elaisOnlineModel = 'qwen3.5';
  String _elaisPersonality = "You are Elais, a smart business assistant.";

  bool get elaisEnabled => _elaisEnabled;
  String get elaisSource => _elaisSource;
  String get elaisModel => _elaisModel;
  String get elaisOnlineUrl => _elaisOnlineUrl;
  String get elaisOnlineKey => _elaisOnlineKey;
  String get elaisOnlineModel => _elaisOnlineModel;
  String get elaisPersonality => _elaisPersonality;

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
    'Clear Cart': 'ESC',
    'Apply': 'ENTER',
    'Search': '`',
    'Fullscreen': 'F1',
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
    updateSetting('selected_printer_name', name ?? '');
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

  /// Sum of all discounted line totals (already accounts for per-item discounts).
  double get subtotal => _cart.fold(0, (sum, item) => sum + item.totalPrice);

  /// Total savings from per-item discounts across the whole cart.
  double get itemDiscountTotal => _cart.fold(0, (sum, item) => sum + item.discountAmount);

  double get promoDiscount => _selectedPromo?.calculateDiscount(subtotal) ?? 0;
  double get totalPercentageDiscount => (subtotal - promoDiscount) * (_percentageDiscount / 100);
  double get discount => promoDiscount + totalPercentageDiscount + _manualDiscount;
  double get total => (subtotal - discount) < 0 ? 0 : (subtotal - discount);
  int get totalItems => _cart.fold(0, (sum, item) => sum + item.quantity);

  /// Local profit calculation for instant UI feedback.
  double get estimatedProfit {
    if (_cart.isEmpty) return 0.0;
    double totalBuyingCost = _cart.fold(0, (sum, item) => sum + (item.product.costPrice * item.quantity));
    // Profit = Total (after all discounts) - Total Cost
    return total - totalBuyingCost;
  }


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
      await fetchExpenseCategories();
      // Elais AI Initialization
      fetchElaisAlerts();
      fetchDailyBrief();
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
    _triggerAnalysis();
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

  void _triggerAnalysis() {
    refreshElaisAnalysis();
    fetchBundleSuggestion();
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
    _triggerAnalysis();
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
      _triggerAnalysis();
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
    _elaisCheckoutAnalysis = null;
    _elaisBundleSuggestion = null;
    notifyListeners();
  }

  /// Sets the item-level discount percentage for a specific product in the cart.
  void updateItemDiscount(String productId, double discountPercent) {
    final index = _cart.indexWhere((item) => item.product.id == productId);
    if (index >= 0) {
      _cart[index].itemDiscountPercent = discountPercent.clamp(0, 100);
      _triggerAnalysis();
      notifyListeners();
    }
  }

  Future<bool> checkout(String paymentMethod) async {
    if (_cart.isEmpty) return false;
    final orderData = _cart.map((item) {
      debugPrint('🛒 Checkout Item: ${item.product.name} (ID: ${item.product.id})');
      return {
        'product_id': item.product.id,
        'quantity': item.quantity,
        'price': item.totalPrice / item.quantity,
        'originalPrice': item.product.price,
        'itemDiscountPercent': item.itemDiscountPercent,
        'buying_price': item.product.buyingPrice,
      };
    }).toList();
    _isLoading = true;
    notifyListeners();
    final success = await _apiService.submitOrder(
      orderData, 
      total, 
      discountAmount: discount + itemDiscountTotal, 
      subtotalAmount: _cart.fold(0, (s, i) => s + i.originalTotalPrice), 
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

  // --- Accounts Module Methods ---

  Future<void> fetchDailySummary(DateTime date) async {
    final dateStr = date.toIso8601String().split('T')[0];
    final result = await _apiService.get('/api/accounts/daily-summary?date=$dateStr');
    if (result != null) {
      _dailySummary = result;
      notifyListeners();
    }
  }

  Future<void> fetchMonthlyReport(int year, int month) async {
    final result = await _apiService.get('/api/accounts/monthly-report?year=$year&month=$month');
    if (result != null) {
      _monthlyReport = result;
      notifyListeners();
    }
  }

  Future<bool> addExpense(Map<String, dynamic> data) async {
    final result = await _apiService.post('/api/accounts/transactions', data);
    if (result != null) {
      await fetchDailySummary(DateTime.now());
      return true;
    }
    return false;
  }

  Future<bool> deleteTransaction(int id) async {
    final success = await _apiService.delete('/api/accounts/transactions/$id');
    if (success) {
      await fetchDailySummary(DateTime.now());
      return true;
    }
    return false;
  }

  Future<void> fetchExpenseCategories() async {
    final result = await _apiService.get('/api/accounts/categories');
    if (result != null) {
      _expenseCategories = result;
      notifyListeners();
    }
  }

  Future<bool> deleteProduct(String id) async {
    final success = await _apiService.deleteProduct(id);
    if (!success) {
      _productError = _apiService.lastError;
      notifyListeners();
    } else {
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

  // Elais AI Methods

  Future<void> fetchElaisAlerts() async {
    try {
      final res = await _apiService.get('/api/elais/alerts');
      if (res != null) {
        _elaisAlerts = List<Map<String, dynamic>>.from(res['alerts'] ?? []);
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> fetchDailyBrief() async {
    try {
      final res = await _apiService.get('/api/elais/daily-brief');
      if (res != null) {
        _dailyBrief = res['brief'];
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<String> chatWithElais(String question) async {
    _elaisLoading = true;
    notifyListeners();
    try {
      _chatHistory.add({'role': 'user', 'content': question});
      final res = await _apiService.post('/api/elais/chat', {
        'question': question,
        'history': _chatHistory.length > 6 ? _chatHistory.sublist(_chatHistory.length - 6) : _chatHistory
      });
      
      if (res == null) {
        throw Exception(_apiService.lastError ?? 'Unknown API error');
      }
      
      final answer = res['answer'] as String? ?? 'No response content.';
      _chatHistory.add({'role': 'assistant', 'content': answer});
      notifyListeners();
      return answer;
    } catch (e) {
      final source = _elaisSource == 'local' ? 'Local Ollama' : 'Online Cloud';
      String errMsg = e.toString();
      if (errMsg.contains('Exception:')) errMsg = errMsg.split('Exception:').last.trim();
      
      final err = 'Elais Error ($source): $errMsg';
      _chatHistory.add({'role': 'assistant', 'content': err});
      notifyListeners();
      return err;
    } finally {
      _elaisLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshElaisAnalysis() async {
    if (_cart.isEmpty) {
      _elaisCheckoutAnalysis = null;
      notifyListeners();
      return;
    }
    
    _isElaisAnalysisLoading = true;
    notifyListeners();

    try {
      final items = _cart.map((e) => {
        'id': e.product.id,
        'qty': e.quantity,
        'price': e.totalPrice / e.quantity,
        'buying_price': e.product.buyingPrice,
      }).toList();
      
      final res = await _apiService.post('/api/elais/checkout-analysis', {
        'items': items,
        'cart_discount': discount,
      });
      if (res != null) {
        _elaisCheckoutAnalysis = Map<String, dynamic>.from(res);
      }
    } catch (e) {
      debugPrint('Elais Analysis Error: $e');
    } finally {
      _isElaisAnalysisLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchBundleSuggestion() async {
    if (_cart.isEmpty) {
      _elaisBundleSuggestion = null;
      notifyListeners();
      return;
    }
    try {
      final res = await _apiService.post('/api/elais/bundle-suggestion', {
        'product_ids': _cart.map((e) => int.tryParse(e.product.id) ?? 0).toList()
      });
      if (res != null) {
        _elaisBundleSuggestion = Map<String, dynamic>.from(res['suggestion'] ?? {});
      }
    } catch (_) {}
    notifyListeners();
  }

  void clearElaisChat() {
    _chatHistory.clear();
    notifyListeners();
  }

  Future<String> getMonthlyNarrative(int year, int month) async {
    try {
      final res = await _apiService.get('/api/elais/monthly-narrative?year=$year&month=$month');
      return res != null ? res['narrative'] ?? '' : '';
    } catch (_) {
      return '';
    }
  }

  Future<Map<String, dynamic>?> getBundleSuggestion(List<int> productIds) async {
    try {
      final res = await _apiService.post('/api/elais/bundle-suggestion', {'product_ids': productIds});
      return res != null ? res['suggestion'] : null;
    } catch (_) {
      return null;
    }
  }

  Future<String> getDemandForecast() async {
    try {
      final res = await _apiService.get('/api/elais/demand-forecast');
      return res != null ? res['forecast'] ?? '' : '';
    } catch (_) {
      return '';
    }
  }

  Future<Map<String, dynamic>?> getSupplierScorecard(String supplierId) async {
    try {
      final res = await _apiService.get('/api/elais/supplier-scorecard/$supplierId');
      return res != null ? Map<String, dynamic>.from(res) : null;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> getCashflowForecast() async {
    try {
      final res = await _apiService.get('/api/elais/cashflow-forecast');
      return res != null ? Map<String, dynamic>.from(res) : null;
    } catch (_) {
      return null;
    }
  }

  Future<String> categorizeExpense(String description) async {
    try {
      final res = await _apiService.post('/api/elais/categorize-expense', {'description': description});
      return res != null ? res['category'] ?? '' : '';
    } catch (_) {
      return '';
    }
  }

  Future<void> updateSetting(String key, String value) async {
    try {
      // Update local state if it matches these specific settings
      if (key == 'elais_enabled') _elaisEnabled = value == '1';
      if (key == 'elais_source') _elaisSource = value;
      if (key == 'elais_model') _elaisModel = value;
      if (key == 'elais_online_url') _elaisOnlineUrl = value;
      if (key == 'elais_online_key') _elaisOnlineKey = value;
      if (key == 'elais_online_model') _elaisOnlineModel = value;
      if (key == 'elais_personality') _elaisPersonality = value;
      
      notifyListeners();
      await _apiService.post('/api/accounts/settings-update', {'key': key, 'value': value});
    } catch (_) {}
  }

  void setElaisEnabled(bool value) {
    _elaisEnabled = value;
    updateSetting('elais_enabled', value ? '1' : '0');
  }

  Future<void> initializeSettings() async {
    try {
      final settings = await _apiService.get('/api/accounts/settings');
      if (settings != null) {
        if (settings['elais_enabled'] != null) _elaisEnabled = settings['elais_enabled'] == '1';
        if (settings['elais_source'] != null) _elaisSource = settings['elais_source'];
        if (settings['elais_model'] != null) _elaisModel = settings['elais_model'];
        if (settings['elais_online_url'] != null) _elaisOnlineUrl = settings['elais_online_url'];
        if (settings['elais_online_key'] != null) _elaisOnlineKey = settings['elais_online_key'];
        if (settings['elais_online_model'] != null) _elaisOnlineModel = settings['elais_online_model'];
        if (settings['elais_personality'] != null) _elaisPersonality = settings['elais_personality'];
        if (settings['selected_printer_name'] != null && settings['selected_printer_name'].toString().isNotEmpty) {
          _selectedPrinterName = settings['selected_printer_name'];
        }
        notifyListeners();
      }
    } catch (_) {
      debugPrint('Failed to load settings from server');
    }
  }
}
