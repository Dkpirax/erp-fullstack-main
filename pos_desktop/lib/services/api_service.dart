import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/product.dart';
import '../models/promo.dart';
import '../models/order.dart';

class ApiService {
  String baseUrl = 'http://localhost:3000/api/v1';

  String? _token;
  String _userRole = 'cashier'; // default
  String get userRole => _userRole;

  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  bool get isAuthenticated => _token != null;

  String? lastError;

  void updateBaseUrl(String newUrl) {
    baseUrl = newUrl;
  }

  /// Login with username/password, stores JWT token.
  Future<bool> login(String username, String password) async {
    lastError = null;
    try {
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
        await _fetchUserRole();
        return true;
      } else {
        lastError = 'Login failed (${response.statusCode})';
        return false;
      }
    } catch (e) {
      lastError = 'Connection error: $e';
      return false;
    }
  }

  void logout() {
    _token = null;
    _userRole = 'cashier';
    lastError = null;
  }

  Future<void> _fetchUserRole() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/users/me'),
        headers: _authHeaders,
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _userRole = data['role'] ?? 'cashier';
      }
    } catch (e) {
      print('Failed to fetch user role: $e');
    }
  }

  Map<String, String> get _authHeaders => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  Future<List<Product>> fetchProducts() async {
    lastError = null;
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/products?limit=200'),
        headers: _authHeaders,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final dynamic decoded = json.decode(response.body);
        List<dynamic> productList;
        if (decoded is List) {
          productList = decoded;
        } else if (decoded is Map) {
          final val = decoded['products'] ?? decoded['data'] ?? decoded['items'];
          productList = val is List ? val : [];
        } else {
          productList = [];
        }
        
        try {
          return productList.map((j) => Product.fromJson(Map<String, dynamic>.from(j as Map))).toList();
        } catch (parseError) {
          lastError = 'Data parsing error: $parseError';
          print('Product parsing error: $parseError');
          return [];
        }
      } else {
        lastError = 'Server error ${response.statusCode}';
        return [];
      }
    } catch (e) {
      lastError = 'Cannot reach server. Is it running on port 3000?';
      print('fetchProducts failed: $e');
      return [];
    }
  }

  Future<bool> submitOrder(List<Map<String, dynamic>> orderItems, double totalAmount, {String paymentMethod = 'CASH'}) async {
    lastError = null;
    try {
      final payload = {
        'total_amount': totalAmount,
        'status': 'COMPLETED',
        'source': 'POS',
        'payments': [
          {'method': paymentMethod, 'amount': totalAmount}
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

      if (response.statusCode != 200 && response.statusCode != 201) {
        lastError = 'Checkout failed (${response.statusCode}): ${response.body}';
        return false;
      }
      return true;
    } catch (e) {
      lastError = 'Checkout error: $e';
      return false;
    }
  }

  Future<List<OrderModel>> fetchOrderHistory() async {
    lastError = null;
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/pos/orders'),
        headers: _authHeaders,
      );
      if (response.statusCode == 200) {
        final dynamic decoded = json.decode(response.body);
        List<dynamic> orderList;
        if (decoded is List) {
          orderList = decoded;
        } else if (decoded is Map) {
          final val = decoded['orders'] ?? decoded['data'] ?? decoded['items'];
          orderList = val is List ? val : [];
        } else {
          orderList = [];
        }
        return orderList.map((j) => OrderModel.fromJson(Map<String, dynamic>.from(j as Map))).toList();
      } else {
        lastError = 'Failed to fetch history (${response.statusCode})';
        return [];
      }
    } catch (e) {
      lastError = 'History fetch error: $e';
      return [];
    }
  }

  Future<List<Promo>> fetchPromos() async {
    lastError = null;
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/coupons'),
        headers: _authHeaders,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        try {
          return data.map((j) => Promo.fromJson(Map<String, dynamic>.from(j as Map))).toList();
        } catch (parseError) {
          lastError = 'Promo parsing error: $parseError';
          return [];
        }
      } else {
        lastError = 'Failed to fetch promos (${response.statusCode})';
        return [];
      }
    } catch (e) {
      lastError = 'Promo fetch error: $e';
      return [];
    }
  }

  Future<Promo?> createPromo(Map<String, dynamic> promoData) async {
    lastError = null;
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/coupons'),
        headers: _authHeaders,
        body: jsonEncode(promoData),
      );
      if (response.statusCode == 201) {
        return Promo.fromJson(json.decode(response.body));
      }
      lastError = 'Create promo failed (${response.statusCode})';
      return null;
    } catch (e) {
      lastError = 'Create promo error: $e';
      return null;
    }
  }

  Future<bool> deletePromo(String promoId) async {
    lastError = null;
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/coupons/$promoId'),
        headers: _authHeaders,
      );
      if (response.statusCode != 200) {
        lastError = 'Delete failed (${response.statusCode})';
        return false;
      }
      return true;
    } catch (e) {
      lastError = 'Delete error: $e';
      return false;
    }
  }
}
