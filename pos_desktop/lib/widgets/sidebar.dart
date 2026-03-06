import 'package:flutter/material.dart';
import '../screens/history_screen.dart';
import '../screens/main_pos_screen.dart';
import '../screens/promos_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/suppliers_screen.dart';
import '../screens/products_screen.dart';
import '../screens/barcodes_screen.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../utils/fullscreen.dart';

class Sidebar extends StatelessWidget {
  final String activePage;

  const Sidebar({Key? key, this.activePage = 'Home'}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<PosProvider>(context);

    return Container(
      width: 100,
      color: const Color(0xFF1A1A28),
      child: Column(
        children: [
          const SizedBox(height: 32),
          // Logo
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 30, maxWidth: 30),
              child: Image.asset(
                'assets/image/logo.png',
                fit: BoxFit.contain,
              ),
            ),
          ),
          const SizedBox(height: 8),
          const Text('ElaraPOS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(height: 16),

          // Menu Items
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  const SizedBox(height: 16),
          _buildMenuItem(
            context: context,
            icon: Icons.menu_book,
            label: 'Menu',
            isActive: activePage == 'Home',
            onTap: () => _navigateTo(context, const MainPosScreen(), 'Home'),
          ),
          const SizedBox(height: 32),
          _buildMenuItem(
            context: context,
            icon: Icons.history,
            label: 'History',
            isActive: activePage == 'History',
            onTap: () => _navigateTo(context, const HistoryScreen(), 'History'),
          ),
          const SizedBox(height: 32),
          _buildMenuItem(
            context: context,
            icon: Icons.local_offer,
            label: 'Promos',
            isActive: activePage == 'Promos',
            onTap: () => _navigateTo(context, const PromosScreen(), 'Promos'),
          ),
          const SizedBox(height: 32),
          _buildMenuItem(
            context: context,
            icon: Icons.business,
            label: 'Suppliers',
            isActive: activePage == 'Suppliers',
            onTap: () => _navigateTo(context, const SuppliersScreen(), 'Suppliers'),
          ),
          if (provider.isAdmin) ...[
            const SizedBox(height: 32),
            _buildMenuItem(
              context: context,
              icon: Icons.inventory,
              label: 'Products',
              isActive: activePage == 'Products',
              onTap: () => _navigateTo(context, const ProductsScreen(), 'Products'),
            ),
            const SizedBox(height: 32),
            _buildMenuItem(
              context: context,
              icon: Icons.qr_code_2,
              label: 'Barcodes',
              isActive: activePage == 'Barcodes',
              onTap: () => _navigateTo(context, const BarcodesScreen(), 'Barcodes'),
            ),
          ],
          const SizedBox(height: 32),
                  _buildMenuItem(
                    context: context,
                    icon: Icons.settings,
                    label: 'Settings',
                    isActive: activePage == 'Settings',
                    onTap: () => _navigateTo(context, const SettingsScreen(), 'Settings'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Fullscreen Toggle
          _buildMenuItem(
            context: context,
            icon: Icons.fullscreen,
            label: 'Fullscreen',
            isActive: false,
            onTap: () => toggleFullScreen(),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _navigateTo(BuildContext context, Widget screen, String name) {
    if (activePage == name) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation1, animation2) => screen,
        transitionDuration: Duration.zero,
        reverseTransitionDuration: Duration.zero,
      ),
    );
  }

  Widget _buildMenuItem({
    required BuildContext context,
    required IconData icon,
    required String label,
    bool isActive = false,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 80,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: isActive
            ? BoxDecoration(
                color: const Color(0xFF0882C8).withOpacity(0.15),
                borderRadius: BorderRadius.circular(16),
              )
            : null,
        child: Column(
          children: [
            Icon(
              icon,
              color: isActive ? const Color(0xFF0882C8) : Colors.grey[600],
              size: 26,
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                color: isActive ? const Color(0xFF0882C8) : Colors.grey[600],
                fontSize: 11,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
