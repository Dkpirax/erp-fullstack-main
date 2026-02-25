import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../models/supplier.dart';
import '../widgets/sidebar.dart';
import 'package:virtual_keyboard_multi_language/virtual_keyboard_multi_language.dart';

class SuppliersScreen extends StatefulWidget {
  const SuppliersScreen({Key? key}) : super(key: key);

  @override
  State<SuppliersScreen> createState() => _SuppliersScreenState();
}

class _SuppliersScreenState extends State<SuppliersScreen> {
  TextEditingController? _activeController;
  List<Supplier> _suppliers = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadSuppliers();
  }

  Future<void> _loadSuppliers() async {
    setState(() => _isLoading = true);
    final provider = Provider.of<PosProvider>(context, listen: false);
    final suppliers = await provider.fetchSuppliers();
    setState(() {
      _suppliers = suppliers;
      _isLoading = false;
    });
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
      backgroundColor: const Color(0xFF1E1E2C),
      body: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                const Sidebar(activePage: 'Suppliers'),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Suppliers', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                            if (provider.isAdmin)
                              ElevatedButton.icon(
                                onPressed: () => _showAddSupplierDialog(context),
                                icon: const Icon(Icons.add),
                                label: const Text('New Supplier'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFFF6B6B),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 32),
                        Expanded(
                          child: _isLoading 
                            ? const Center(child: CircularProgressIndicator())
                            : _suppliers.isEmpty
                              ? const Center(child: Text('No suppliers found', style: TextStyle(color: Colors.grey)))
                              : ListView.builder(
                                  itemCount: _suppliers.length,
                                  itemBuilder: (context, index) {
                                    final s = _suppliers[index];
                                    return Card(
                                      color: const Color(0xFF2A2A3C),
                                      margin: const EdgeInsets.only(bottom: 16),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      child: ListTile(
                                        title: Text(s.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                        subtitle: Text('${s.email} | ${s.phone}'),
                                        trailing: const Icon(Icons.business, color: Color(0xFFFF6B6B)),
                                      ),
                                    );
                                  },
                                ),
                        ),
                      ],
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
                    onKeyPress: _onKeyPress,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _showAddSupplierDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    final contactCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlgState) => AlertDialog(
          backgroundColor: const Color(0xFF2A2A3C),
          title: const Text('Add New Supplier'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _dialogField('Supplier Name', nameCtrl),
                const SizedBox(height: 12),
                _dialogField('Contact Person', contactCtrl),
                const SizedBox(height: 12),
                _dialogField('Email', emailCtrl),
                const SizedBox(height: 12),
                _dialogField('Phone', phoneCtrl),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final provider = Provider.of<PosProvider>(context, listen: false);
                final success = await provider.createSupplier({
                  'name': nameCtrl.text,
                  'contact_name': contactCtrl.text,
                  'email': emailCtrl.text,
                  'phone': phoneCtrl.text,
                });
                if (success) {
                  Navigator.pop(ctx);
                  _loadSuppliers();
                }
              },
              child: const Text('Save'),
            )
          ],
        ),
      ),
    );
  }

  Widget _dialogField(String hint, TextEditingController ctrl) {
    final provider = Provider.of<PosProvider>(context, listen: false);
    return TextField(
      controller: ctrl,
      readOnly: provider.useOnScreenKeyboard,
      onTap: () {
        if (provider.useOnScreenKeyboard) {
          setState(() => _activeController = ctrl);
        }
      },
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: const Color(0xFF1E1E2C),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
