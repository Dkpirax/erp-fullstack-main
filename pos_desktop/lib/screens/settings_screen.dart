import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../widgets/sidebar.dart';
import 'package:virtual_keyboard_multi_language/virtual_keyboard_multi_language.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _urlController;
  TextEditingController? _activeController;
  
  // Using a list of Strings since the printing package had build issues on your system
  final List<String> _printers = ['Default Printer', 'Thermal Receipt Printer', 'PDF Printer'];
  bool _fetchingPrinters = false;

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<PosProvider>(context, listen: false);
    _urlController = TextEditingController(text: provider.serverUrl);
  }

  Future<void> _fetchPrinters() async {
    setState(() => _fetchingPrinters = true);
    // Simulate fetching printers
    await Future.delayed(const Duration(seconds: 1));
    setState(() => _fetchingPrinters = false);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  void _onKeyPress(VirtualKeyboardKey key) {
    if (_activeController == null) return;
    
    if (key.keyType == VirtualKeyboardKeyType.String) {
      _activeController!.text += key.text!;
    } else if (key.keyType == VirtualKeyboardKeyType.Action) {
      switch (key.action) {
        case VirtualKeyboardKeyAction.Backspace:
          if (_activeController!.text.isNotEmpty) {
            _activeController!.text = _activeController!.text
                .substring(0, _activeController!.text.length - 1);
          }
          break;
        case VirtualKeyboardKeyAction.Return:
          _activeController!.text += '\n';
          break;
        case VirtualKeyboardKeyAction.Space:
          _activeController!.text += ' ';
          break;
        default:
      }
    }
    _activeController!.selection = TextSelection.fromPosition(
        TextPosition(offset: _activeController!.text.length));
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
                              activeThumbColor: const Color(0xFFFF6B6B),
                            ),
                          ),
                          
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
                                      onPressed: _fetchPrinters,
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
                                      value: provider.selectedPrinterName,
                                      isExpanded: true,
                                      hint: const Text('Select Printer', style: TextStyle(color: Colors.grey)),
                                      dropdownColor: const Color(0xFF2A2A3C),
                                      items: _printers.map((String name) {
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
                                    style: const TextStyle(color: Color(0xFFFF6B6B), fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ]
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
                                      hintText: 'http://localhost:3000/api/v1',
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
                                      backgroundColor: const Color(0xFFFF6B6B),
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
            Container(
              color: const Color(0xFF1A1A28),
              padding: const EdgeInsets.only(bottom: 10),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        onPressed: () => setState(() => _activeController = null),
                      ),
                    ],
                  ),
                  VirtualKeyboard(
                    height: 250,
                    textColor: Colors.white,
                    fontSize: 20,
                    type: VirtualKeyboardType.Alphanumeric,
                    postKeyPress: _onKeyPress,
                  ),
                ],
              ),
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
