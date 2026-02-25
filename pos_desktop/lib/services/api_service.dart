import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/product.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:3000/api/v1';

  String? _token;

  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  bool get isAuthenticated => _token != null;

  /// Login with username/password, stores JWT token.
  Future<bool> login(String username, String password) async {
    try {
      // Backend expects multipart/form-data
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/login/access-token'),
      );
      request.fields['username'] = username;
      request.fields['password'] = password;

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _token = data['access_token'];
        return true;
      }
      return false;
    } catch (e) {
      print('Login failed: $e');
      return false;
    }
  }

  void logout() {
    _token = null;
  }

  Map<String, String> get _authHeaders => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  /// Fetches products from the backend.
  /// Response shape: { products: [...] }
  Future<List<Product>> fetchProducts() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/products?limit=200'),
        headers: _authHeaders,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> productList = data['products'] ?? data;
        return productList.map((json) => Product.fromJson(json)).toList();
      } else {
        print('Products API error ${response.statusCode}: ${response.body}');
        return _getMockProducts();
      }
    } catch (e) {
      print('Failed to load products from API: $e. Using mock data.');
      return _getMockProducts();
    }
  }

  /// Submits a POS order to the backend.
  /// Expects items with product_id, quantity, unit_price.
  Future<bool> submitOrder(List<Map<String, dynamic>> orderItems, double totalAmount) async {
    try {
      final payload = {
        'total_amount': totalAmount,
        'status': 'COMPLETED',
        'source': 'POS',
        'payments': [
          {'method': 'CASH', 'amount': totalAmount}
        ],
        'items': orderItems.map((item) => {
          'product_id': item['productId'],
          'quantity': item['quantity'],
          'unit_price': item['price'],
        }).toList(),
      };

      final response = await http.post(
        Uri.parse('$baseUrl/pos/orders'),
        headers: _authHeaders,
        body: jsonEncode(payload),
      );

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Checkout failed: $e');
      return false;
    }
  }

  List<Product> _getMockProducts() {
    return [
      Product(id: '1', name: 'Original Burger', description: 'Classic beef burger', price: 5.99, imageUrl: '', category: 'Burger', stockCount: 11),
      Product(id: '2', name: 'Double Burger', description: 'Double beef patty', price: 10.99, imageUrl: '', category: 'Burger', stockCount: 11),
      Product(id: '3', name: 'Cheese Burger', description: 'Burger with extra cheese', price: 6.99, imageUrl: '', category: 'Burger', stockCount: 9),
      Product(id: '4', name: 'Double Cheese Burger', description: 'Double cheese and patty', price: 12.99, imageUrl: '', category: 'Burger', stockCount: 11),
      Product(id: '5', name: 'Spicy Burger', description: 'Spicy chicken burger', price: 5.99, imageUrl: '', category: 'Burger', stockCount: 11),
      Product(id: '6', name: 'Special Black Burger', description: 'Black bun beef burger', price: 7.39, imageUrl: '', category: 'Burger', stockCount: 11),
      Product(id: '7', name: 'Pad Thai', description: 'Classic Pad Thai noodles', price: 8.99, imageUrl: '', category: 'Noodles', stockCount: 8),
      Product(id: '8', name: 'Ramen', description: 'Japanese style ramen', price: 9.99, imageUrl: '', category: 'Noodles', stockCount: 5),
      Product(id: '9', name: 'Coca Cola', description: 'Chilled Coca Cola', price: 2.50, imageUrl: '', category: 'Drinks', stockCount: 20),
      Product(id: '10', name: 'Lemonade', description: 'Fresh squeezed lemonade', price: 3.50, imageUrl: '', category: 'Drinks', stockCount: 15),
      Product(id: '11', name: 'Chocolate Cake', description: 'Rich chocolate cake', price: 6.50, imageUrl: '', category: 'Desserts', stockCount: 7),
      Product(id: '12', name: 'Ice Cream', description: 'Vanilla ice cream', price: 3.99, imageUrl: '', category: 'Desserts', stockCount: 10),
    ];
  }
}
