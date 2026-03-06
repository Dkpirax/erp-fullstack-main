import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../widgets/sidebar.dart';
import '../widgets/app_keyboard.dart';
import '../services/receipt_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _urlController;
  TextEditingController? _activeController;

  // List of actual printers fetched from the system
  List<String> _availablePrinters = [];
  bool _fetchingPrinters = false;

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<PosProvider>(context, listen: false);
    _urlController = TextEditingController(text: provider.serverUrl);
    _loadPrinters(); // Load initially
  }

  Future<void> _loadPrinters() async {
    setState(() => _fetchingPrinters = true);
    try {
      final printers = await ReceiptService.listPrinters();
      setState(() {
        _availablePrinters = printers;
        _fetchingPrinters = false;
      });
    } catch (e) {
      setState(() => _fetchingPrinters = false);
    }
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }


  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<PosProvider>(context);

    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                const Sidebar(activePage: 'Settings'),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Settings',
                            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 32),
                          
                          // Keyboard Setting
                          _buildSettingCard(
                            title: 'On-Screen Keyboard',
                            subtitle: 'Show a virtual keyboard when tapping text fields',
                            trailing: Switch(
                              value: provider.useOnScreenKeyboard,
                              onChanged: (value) => provider.setUseOnScreenKeyboard(value),
                              activeThumbColor: const Color(0xFF0882C8),
                            ),
                          ),
                          
                          const SizedBox(height: 24),

                          // Shortcut Setting
                          _buildSettingCard(
                            title: 'Keyboard Shortcuts',
                            subtitle: 'Enable F1 (Search), F2 (Checkout), Esc (Clear)',
                            trailing: Switch(
                              value: provider.useKeyboardShortcuts,
                              onChanged: (value) => provider.setUseKeyboardShortcuts(value),
                              activeThumbColor: const Color(0xFF0882C8),
                            ),
                          ),
                          
                          if (provider.useKeyboardShortcuts) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF2A2A3C),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Shortcuts', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                                  const SizedBox(height: 16),
                                  ...provider.customShortcuts.entries.map((entry) {
                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: 8.0),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(entry.key, style: const TextStyle(color: Colors.grey)),
                                          SizedBox(
                                            width: 100,
                                            height: 36,
                                            child: TextField(
                                              textAlign: TextAlign.center,
                                              style: const TextStyle(color: Color(0xFF0882C8), fontWeight: FontWeight.bold),
                                                decoration: InputDecoration(
                                                  filled: true,
                                                  fillColor: const Color(0xFF1E1E2C),
                                                  contentPadding: EdgeInsets.zero,
                                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                                                  hintText: 'e.g. F1 or CTRL+1',
                                                ),
                                              controller: TextEditingController(text: entry.value),
                                              onSubmitted: (newVal) => provider.updateShortcut(entry.key, newVal),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }).toList(),
                                ],
                              ),
                            ),
                          ],
                          
                          const SizedBox(height: 24),

                          // Printer Setting
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2A2A3C),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Receipt Printer',
                                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                        ),
                                        SizedBox(height: 4),
                                        Text(
                                          'Select the printer for receipts',
                                          style: TextStyle(color: Colors.grey, fontSize: 13),
                                        ),
                                      ],
                                    ),
                                    IconButton(
                                      icon: _fetchingPrinters 
                                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                        : const Icon(Icons.refresh, color: Colors.white70),
                                      onPressed: _loadPrinters,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E1E2C),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                    child: DropdownButtonHideUnderline(
                                      child: DropdownButton<String>(
                                        value: _availablePrinters.contains(provider.selectedPrinterName) 
                                          ? provider.selectedPrinterName 
                                          : null,
                                        isExpanded: true,
                                        hint: Text(
                                          _fetchingPrinters ? 'Searching...' : 'Select Printer', 
                                          style: const TextStyle(color: Colors.grey)
                                        ),
                                        dropdownColor: const Color(0xFF2A2A3C),
                                        items: _availablePrinters.map((String name) {
                                          return DropdownMenuItem<String>(
                                            value: name,
                                            child: Text(name, style: const TextStyle(color: Colors.white)),
                                          );
                                        }).toList(),
                                        onChanged: (String? newValue) {
                                          provider.setSelectedPrinterName(newValue);
                                        },
                                      ),
                                    ),
                                ),
                                if (provider.selectedPrinterName != null) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    'Selected: ${provider.selectedPrinterName}',
                                    style: const TextStyle(color: Color(0xFF0882C8), fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ]
                              ],
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Barcode Scanner Setting
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2A2A3C),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Barcode Scanner (Serial)',
                                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                        ),
                                        SizedBox(height: 4),
                                        Text(
                                          'Select the COM port for the barcode scanner',
                                          style: TextStyle(color: Colors.grey, fontSize: 13),
                                        ),
                                      ],
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.refresh, color: Colors.white70),
                                      onPressed: () => setState(() {}), // Trigger rebuild to refresh port list
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E1E2C),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      value: provider.selectedScannerPort,
                                      isExpanded: true,
                                      hint: const Text('None / Select Port', style: TextStyle(color: Colors.grey)),
                                      dropdownColor: const Color(0xFF2A2A3C),
                                      items: [
                                        const DropdownMenuItem<String>(
                                          value: 'None',
                                          child: Text('None', style: TextStyle(color: Colors.white)),
                                        ),
                                        ...provider.getAvailableSerialPorts().map((String port) {
                                          return DropdownMenuItem<String>(
                                            value: port,
                                            child: Text(port, style: const TextStyle(color: Colors.white)),
                                          );
                                        }),
                                      ],
                                      onChanged: (String? newValue) {
                                        provider.setSelectedScannerPort(newValue);
                                      },
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Server URL Setting (Admin Only)
                          if (provider.isAdmin)
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: const Color(0xFF2A2A3C),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Server Configuration',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 16),
                                  TextField(
                                    controller: _urlController,
                                    readOnly: provider.useOnScreenKeyboard,
                                    onTap: () {
                                      if (provider.useOnScreenKeyboard) {
                                        setState(() => _activeController = _urlController);
                                      }
                                    },
                                    style: const TextStyle(color: Colors.white),
                                    decoration: InputDecoration(
                                      labelText: 'API Base URL',
                                      hintText: 'e.g. https://erp.reon.lk/api/v1',
                                      filled: true,
                                      fillColor: const Color(0xFF1E1E2C),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton(
                                    onPressed: () {
                                      provider.updateServerUrl(_urlController.text.trim());
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('✅ Server URL updated successfully!')),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0882C8),
                                      foregroundColor: Colors.white,
                                    ),
                                    child: const Text('Save URL'),
                                  ),
                                ],
                              ),
                            ),

                          const SizedBox(height: 32),
                          
                          // Logout Button
                          SizedBox(
                            width: 200,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                provider.logout();
                                Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
                              },
                              icon: const Icon(Icons.logout),
                              label: const Text('Logout'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red.withValues(alpha: 0.1),
                                foregroundColor: Colors.red,
                                side: const BorderSide(color: Colors.red),
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (provider.useOnScreenKeyboard && _activeController != null)
            AppKeyboard(
              controller: _activeController!,
              onClosed: () => setState(() => _activeController = null),
            ),
        ],
      ),
    );
  }

  Widget _buildSettingCard({required String title, required String subtitle, required Widget trailing}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF2A2A3C),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(color: Colors.grey, fontSize: 13),
              ),
            ],
          ),
          trailing,
        ],
      ),
    );
  }
}
