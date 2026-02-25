import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/product.dart';

class ApiService {
  // Update to your actual node server URL
  static const String baseUrl = 'http://localhost:5000/api';

  Future<List<Product>> fetchProducts() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/pos/products'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Product.fromJson(json)).toList();
      } else {
        // Fallback for demo, or if your backend structure is different
        return _getMockProducts();
      }
    } catch (e) {
      print('Failed to load products from API: $e. Using mock data.');
      return _getMockProducts();
    }
  }

  Future<bool> submitOrder(List<Map<String, dynamic>> orderData, double total) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/pos/checkout'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'items': orderData,
          'total': total,
          'type': 'Dine-In', 
        }),
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
      Product(id: '3', name: 'Cheese Burger', description: 'Burger with cheese', price: 6.99, imageUrl: '', category: 'Burger', stockCount: 9),
      Product(id: '4', name: 'Double Cheese Burger', description: 'Double cheese and patty', price: 12.99, imageUrl: '', category: 'Burger', stockCount: 11),
      Product(id: '5', name: 'Spicy Burger', description: 'Spicy chicken burger', price: 5.99, imageUrl: '', category: 'Burger', stockCount: 11),
      Product(id: '6', name: 'Special Black Burger', description: 'Black bun beef burger', price: 7.39, imageUrl: '', category: 'Burger', stockCount: 11),
    ];
  }
}
