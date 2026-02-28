import 'package:flutter/material.dart';
import '../models/product.dart';
import '../models/cart_item.dart';
import '../models/promo.dart';
import '../models/order.dart';
import '../models/supplier.dart';
import '../services/api_service.dart';

class PosProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

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

  double _taxRatePercent = 10.0;
  double get taxRatePercent => _taxRatePercent;

  void setUseOnScreenKeyboard(bool value) {
    _useOnScreenKeyboard = value;
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
  double get discount => _selectedPromo?.calculateDiscount(subtotal) ?? 0;
  double get tax => (subtotal - discount) * (_taxRatePercent / 100);
  double get total => subtotal - discount + tax;

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
      await fetchSettings();
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

  Future<void> fetchProducts() async {
    _isLoading = true;
    _productError = null;
    notifyListeners();
    _products = await _apiService.fetchProducts();
    _productError = _apiService.lastError;
    if (_products.isNotEmpty && _selectedCategory == null) {
      _selectedCategory = categories.isNotEmpty ? categories.first : null;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchSettings() async {
    final settings = await _apiService.fetchPosSettings();
    if (settings.containsKey('tax_rate')) {
      _taxRatePercent = (settings['tax_rate'] ?? 10.0).toDouble();
      notifyListeners();
    }
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

  Future<String?> uploadProductImage(String filePath) async {
    return await _apiService.uploadProductImage(filePath);
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
      (p) => p!.code == upperCode,
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
    final success = await _apiService.submitOrder(orderData, total, paymentMethod: paymentMethod);
    _isLoading = false;
    if (success) {
      await fetchOrderHistory();
      clearCart();
      removePromo();
    }
    notifyListeners();
    return success;
  }
}
