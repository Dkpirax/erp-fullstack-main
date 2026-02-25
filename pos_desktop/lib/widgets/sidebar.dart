import 'package:flutter/material.dart';

class Sidebar extends StatelessWidget {
  const Sidebar({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      color: const Color(0xFF1E1E2C),
      child: Column(
        children: [
          const SizedBox(height: 32),
          // Logo
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFFF6B6B),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.fastfood, color: Colors.white, size: 32),
          ),
          const SizedBox(height: 8),
          const Text(
            'POSFood',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          ),
          const SizedBox(height: 48),

          // Menu Items
          _buildMenuItem(Icons.home, 'Home', isActive: true),
          const SizedBox(height: 32),
          _buildMenuItem(Icons.menu_book, 'Menu'),
          const SizedBox(height: 32),
          _buildMenuItem(Icons.history, 'History'),
          const SizedBox(height: 32),
          _buildMenuItem(Icons.local_offer, 'Promos'),
          const SizedBox(height: 32),
          _buildMenuItem(Icons.settings, 'Settings'),
        ],
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String label, {bool isActive = false}) {
    return Container(
      width: 80,
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: isActive
          ? BoxDecoration(
              color: const Color(0xFFFF6B6B).withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
            )
          : null,
      child: Column(
        children: [
          Icon(
            icon,
            color: isActive ? const Color(0xFFFF6B6B) : Colors.grey,
            size: 28,
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              color: isActive ? const Color(0xFFFF6B6B) : Colors.grey,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
