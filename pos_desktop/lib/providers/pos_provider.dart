import 'package:flutter/material.dart';
import '../models/product.dart';
import '../models/cart_item.dart';
import '../models/promo.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class PosProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Product> _products = [];
  List<Product> get products => _products;

  List<CartItem> _cart = [];
  List<CartItem> get cart => _cart;

  List<OrderModel> _orderHistory = [];
  List<OrderModel> get orderHistory => _orderHistory;

  // Settings
  bool _useOnScreenKeyboard = false;
  bool get useOnScreenKeyboard => _useOnScreenKeyboard;

  void setUseOnScreenKeyboard(bool value) {
    _useOnScreenKeyboard = value;
    notifyListeners();
  }

  String get serverUrl => _apiService.baseUrl;
  void updateServerUrl(String url) {
    _apiService.updateBaseUrl(url);
    notifyListeners();
  }

  // Printer logic removed to fix build error
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

  /// Unique sorted list of categories from the loaded products.
  List<String> get categories {
    final cats = _products
        .map((p) => p.category)
        .where((c) => c.isNotEmpty)
        .toSet()
        .toList();
    cats.sort();
    return cats;
  }

  double get subtotal => _cart.fold(0, (sum, item) => sum + item.totalPrice);
  double get discount => _selectedPromo?.calculateDiscount(subtotal) ?? 0;
  double get tax => (subtotal - discount) * 0.10;
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
      await fetchPromos(); // load promos after login
      await fetchOrderHistory(); // load history after login
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

    // Auto-select first available category
    if (_products.isNotEmpty && _selectedCategory == null) {
      _selectedCategory = categories.isNotEmpty ? categories.first : null;
    }

    _isLoading = false;
    notifyListeners();
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

  void applyPromo(Promo promo) {
    _selectedPromo = promo;
    notifyListeners();
  }

  /// Looks up a promo by [code] and applies it.
  /// Returns null on success, or an error message string on failure.
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
      return 'Minimum order of \$${match.minPurchase.toStringAsFixed(2)} required for "$upperCode".';
    }

    _selectedPromo = match;
    notifyListeners();
    return null; // success
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
    if (_selectedCategory == null) return _products;
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
      // Refresh history after successful checkout
      await fetchOrderHistory();
      
      clearCart();
      removePromo();
    }
    notifyListeners();

    return success;
  }
}
