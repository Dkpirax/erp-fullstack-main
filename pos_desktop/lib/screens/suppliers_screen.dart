import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../models/supplier.dart';
import '../widgets/sidebar.dart';
import '../widgets/app_keyboard.dart';

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


  void _confirmDeleteSupplier(BuildContext context, PosProvider provider, Supplier s) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF2A2A3C),
        title: const Text('Delete Supplier'),
        content: Text('Are you sure you want to delete "${s.name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await provider.deleteSupplier(s.id);
              if (mounted) {
                _loadSuppliers();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Supplier deleted' : 'Failed to delete supplier'),
                    backgroundColor: success ? Colors.green : Colors.red,
                  )
                );
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
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
                                onPressed: () => _showSupplierDialog(context),
                                icon: const Icon(Icons.add),
                                label: const Text('New Supplier'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0882C8),
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
                                        trailing: provider.isAdmin 
                                          ? Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                IconButton(
                                                  icon: const Icon(Icons.edit, color: Color(0xFF0882C8)),
                                                  onPressed: () => _showSupplierDialog(context, supplier: s),
                                                ),
                                                IconButton(
                                                  icon: const Icon(Icons.delete_outline, color: Colors.grey),
                                                  onPressed: () => _confirmDeleteSupplier(context, provider, s),
                                                ),
                                              ],
                                            )
                                          : const Icon(Icons.business, color: Colors.grey),
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
            AppKeyboard(
              controller: _activeController!,
              onClosed: () => setState(() => _activeController = null),
            ),
        ],
      ),
    );
  }

  void _showSupplierDialog(BuildContext context, {Supplier? supplier}) {
    final isEditing = supplier != null;
    final nameCtrl = TextEditingController(text: supplier?.name ?? '');
    final contactCtrl = TextEditingController(text: supplier?.contactName ?? '');
    final emailCtrl = TextEditingController(text: supplier?.email ?? '');
    final phoneCtrl = TextEditingController(text: supplier?.phone ?? '');

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlgState) => AlertDialog(
          backgroundColor: const Color(0xFF2A2A3C),
          title: Text(isEditing ? 'Edit Supplier' : 'Add New Supplier'),
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
                final data = {
                  'name': nameCtrl.text.trim(),
                  'contact_person': contactCtrl.text.trim(),
                  'email': emailCtrl.text.trim(),
                  'phone': phoneCtrl.text.trim(),
                };
                
                bool success;
                if (isEditing) {
                  success = await provider.updateSupplier(supplier!.id, data);
                } else {
                  success = await provider.createSupplier(data);
                }

                if (success) {
                  Navigator.pop(ctx);
                  _loadSuppliers();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(isEditing ? 'Supplier updated' : 'Supplier added'))
                    );
                  }
                } else {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Failed to save supplier. Check server connection.'), backgroundColor: Colors.red)
                    );
                  }
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
