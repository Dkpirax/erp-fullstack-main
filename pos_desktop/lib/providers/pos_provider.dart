import 'package:flutter/material.dart';
import '../models/product.dart';
import '../models/cart_item.dart';
import '../services/api_service.dart';

class PosProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Product> _products = [];
  List<Product> get products => _products;

  List<CartItem> _cart = [];
  List<CartItem> get cart => _cart;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _isLoggedIn = false;
  bool get isLoggedIn => _isLoggedIn;

  String _selectedCategory = 'Burger';
  String get selectedCategory => _selectedCategory;

  double get subtotal => _cart.fold(0, (sum, item) => sum + item.totalPrice);
  double get tax => subtotal * 0.10;
  double get total => subtotal + tax;

  PosProvider();

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    notifyListeners();
    final success = await _apiService.login(username, password);
    _isLoading = false;
    if (success) {
      _isLoggedIn = true;
      await fetchProducts();
    }
    notifyListeners();
    return success;
  }

  void logout() {
    _isLoggedIn = false;
    _products = [];
    _cart = [];
    _apiService.logout();
    notifyListeners();
  }

  Future<void> fetchProducts() async {
    _isLoading = true;
    notifyListeners();

    _products = await _apiService.fetchProducts();

    _isLoading = false;
    notifyListeners();
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  List<Product> get filteredProducts {
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

  Future<bool> checkout() async {
    if (_cart.isEmpty) return false;

    final orderData = _cart.map((item) => {
      'productId': item.product.id,
      'quantity': item.quantity,
      'price': item.product.price,
    }).toList();

    _isLoading = true;
    notifyListeners();

    final success = await _apiService.submitOrder(orderData, total);
    
    _isLoading = false;
    if (success) {
      clearCart();
    }
    notifyListeners();

    return success;
  }
}
