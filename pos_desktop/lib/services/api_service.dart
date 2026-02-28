import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/product.dart';
import '../models/promo.dart';
import '../models/order.dart';
import '../models/supplier.dart';

class ApiService {
  String baseUrl = '';
  
  String get serverUrl {
    if (baseUrl.trim().isEmpty) return '';
    try {
      final uri = Uri.parse(baseUrl);
      return '${uri.scheme}://${uri.authority}';
    } catch (e) {
      return '';
    }
  }

  Future<void> loadConfig() async {
    try {
      final file = File('config.json');
      if (await file.exists()) {
        final contents = await file.readAsString();
        final data = json.decode(contents);
        if (data['baseUrl'] != null) {
          baseUrl = data['baseUrl'];
        }
      }
    } catch (e) {
      print('Failed to load config: $e');
    }
  }

  Future<void> _saveConfig(String url) async {
    try {
      final file = File('config.json');
      await file.writeAsString(json.encode({'baseUrl': url}));
    } catch (e) {
      print('Failed to save config: $e');
    }
  }

  void updateBaseUrl(String newUrl) {
    baseUrl = newUrl;
    _saveConfig(newUrl);
  }

  String? _token;
  String _userRole = 'cashier'; // default
  String get userRole => _userRole;

  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  bool get isAuthenticated => _token != null;

  String? lastError;



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

  Future<bool> createProduct(Map<String, dynamic> productData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/products'),
        headers: {..._authHeaders, 'Content-Type': 'application/json'},
        body: jsonEncode(productData),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      lastError = 'Create product failed: $e';
      return false;
    }
  }

  Future<bool> updateProduct(String id, Map<String, dynamic> productData) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/products/$id'),
        headers: {..._authHeaders, 'Content-Type': 'application/json'},
        body: jsonEncode(productData),
      );
      return response.statusCode == 200;
    } catch (e) {
      lastError = 'Update product failed: $e';
      return false;
    }
  }

  Future<String?> uploadProductImage(String filePath) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/products/upload'),
      );
      if (_token != null) {
        request.headers['Authorization'] = 'Bearer $_token';
      }
      request.files.add(await http.MultipartFile.fromPath('image', filePath));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['image_url'];
      } else {
        lastError = 'Upload failed (${response.statusCode})';
        return null;
      }
    } catch (e) {
      lastError = 'Upload error: $e';
      return null;
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

  // Suppliers
  Future<List<Supplier>> fetchSuppliers() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/supply-chain/suppliers'), headers: _authHeaders);
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((j) => Supplier.fromJson(Map<String, dynamic>.from(j))).toList();
      }
      return [];
    } catch (e) {
      print('Fetch suppliers failed: $e');
      return [];
    }
  }

  Future<bool> createSupplier(Map<String, dynamic> supplierData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/supply-chain/suppliers'),
        headers: {..._authHeaders, 'Content-Type': 'application/json'},
        body: jsonEncode(supplierData),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Create supplier failed: $e');
      return false;
    }
  }

  Future<bool> updateSupplier(String id, Map<String, dynamic> supplierData) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/supply-chain/suppliers/$id'),
        headers: {..._authHeaders, 'Content-Type': 'application/json'},
        body: jsonEncode(supplierData),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Update supplier failed: $e');
      return false;
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

  /// Fetches POS settings from the backend. Returns a map like {tax_rate: 10.0}.
  Future<Map<String, dynamic>> fetchPosSettings() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/pos/settings'),
        headers: _authHeaders,
      );
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(json.decode(response.body) as Map);
      }
    } catch (_) {}
    return {'tax_rate': 10.0}; // default fallback
  }

  /// Saves POS settings to the backend.
  Future<bool> savePosSettings(Map<String, dynamic> settings) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/pos/settings'),
        headers: {..._authHeaders, 'Content-Type': 'application/json'},
        body: json.encode(settings),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
