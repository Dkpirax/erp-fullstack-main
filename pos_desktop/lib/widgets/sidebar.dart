import 'package:flutter/material.dart';
import 'dart:ui';
import '../screens/history_screen.dart';
import '../screens/main_pos_screen.dart';
import '../screens/promos_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/suppliers_screen.dart';
import '../screens/products_screen.dart';
import '../screens/barcodes_screen.dart';
import '../screens/accounts_screen.dart';
import '../screens/elais_screen.dart';

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
            const SizedBox(height: 32),
            _buildMenuItem(
              context: context,
              icon: Icons.account_balance,
              label: 'Accounts',
              isActive: activePage == 'Accounts',
              onTap: () => _showPasscodeDialog(context),
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
          // Elais AI
          _buildMenuItem(
            context: context,
            icon: Icons.auto_awesome,
            label: 'Elais AI',
            isActive: activePage == 'elais',
            activeColor: const Color(0xFFD2042D),
            hasAlert: provider.elaisAlerts.isNotEmpty,
            onTap: () => _navigateTo(context, const ElaisScreen(), 'elais'),
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

  void _showPasscodeDialog(BuildContext context) {
    final TextEditingController controller = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: AlertDialog(
            backgroundColor: const Color(0xFF1A1A28),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Security Check', style: TextStyle(color: Colors.white)),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Please enter the passcode to access Accounts.',
                    style: TextStyle(color: Colors.grey, fontSize: 13)),
                const SizedBox(height: 20),
                TextField(
                  controller: controller,
                  keyboardType: TextInputType.number,
                  obscureText: true,
                  style: const TextStyle(color: Colors.white),
                  textAlign: TextAlign.center,
                  decoration: InputDecoration(
                    hintText: 'Passcode',
                    hintStyle: const TextStyle(color: Colors.grey),
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.05),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none),
                  ),
                  onSubmitted: (value) {
                    if (value == '2000') {
                      Navigator.of(context).pop();
                      _navigateTo(context, const AccountsScreen(), 'Accounts');
                    }
                  },
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0882C8),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () {
                  if (controller.text == '2000') {
                    Navigator.of(context).pop();
                    _navigateTo(context, const AccountsScreen(), 'Accounts');
                  }
                },
                child: const Text('Confirm'),
              ),
              const SizedBox(width: 8),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMenuItem({
    required BuildContext context,
    required IconData icon,
    required String label,
    bool isActive = false,
    bool hasAlert = false,
    Color activeColor = const Color(0xFF0882C8),
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
                color: activeColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(16),
              )
            : null,
        child: Column(
          children: [
            Stack(
              children: [
                Icon(
                  icon,
                  color: isActive ? activeColor : Colors.grey[600],
                  size: 26,
                ),
                if (hasAlert)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(1),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 8,
                        minHeight: 8,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                color: isActive ? activeColor : Colors.grey[600],
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
