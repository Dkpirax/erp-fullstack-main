import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../models/promo.dart';
import '../widgets/sidebar.dart';
import '../widgets/app_keyboard.dart';

class PromosScreen extends StatefulWidget {
  const PromosScreen({Key? key}) : super(key: key);

  @override
  State<PromosScreen> createState() => _PromosScreenState();
}

class _PromosScreenState extends State<PromosScreen> {
  TextEditingController? _activeController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<PosProvider>(context, listen: false).fetchPromos();
    });
  }


  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<PosProvider>(context);
    final isAdmin = provider.isAdmin;

    return Scaffold(
      backgroundColor: const Color(0xFF1E1E2C),
      body: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                const Sidebar(activePage: 'Promos'),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Promos',
                                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text(
                                  isAdmin
                                      ? 'Manage your promotional offers'
                                      : 'Select a promo to apply to your order',
                                  style: TextStyle(color: Colors.grey[400], fontSize: 15),
                                ),
                              ],
                            ),
                            if (isAdmin)
                              ElevatedButton.icon(
                                onPressed: () => _showCreatePromoDialog(context),
                                icon: const Icon(Icons.add),
                                label: const Text('New Promo'),
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

                        // Applied promo banner (for sales)
                        if (!isAdmin && provider.selectedPromo != null)
                          _buildAppliedBanner(context, provider),

                        if (!isAdmin && provider.selectedPromo != null) const SizedBox(height: 16),

                        // Promos grid
                        Expanded(
                          child: provider.promos.isEmpty
                              ? _buildEmptyState(isAdmin)
                              : GridView.builder(
                                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 3,
                                    childAspectRatio: 1.8,
                                    crossAxisSpacing: 16,
                                    mainAxisSpacing: 16,
                                  ),
                                  itemCount: provider.promos.length,
                                  itemBuilder: (context, index) {
                                    final promo = provider.promos[index];
                                    return isAdmin
                                        ? _buildAdminPromoCard(context, promo, provider)
                                        : _buildSalesPromoCard(context, promo, provider);
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

  Widget _buildAppliedBanner(BuildContext context, PosProvider provider) {
    final promo = provider.selectedPromo!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Promo "${promo.code}" applied — ${promo.displayLabel}',
              style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
            ),
          ),
          TextButton(
            onPressed: () => provider.removePromo(),
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Widget _buildAdminPromoCard(BuildContext context, Promo promo, PosProvider provider) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF2A2A3C),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: promo.isActive ? const Color(0xFF0882C8).withOpacity(0.3) : Colors.grey.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF0882C8).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  promo.code,
                  style: const TextStyle(
                    color: Color(0xFF0882C8),
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: promo.isActive ? Colors.green.withOpacity(0.15) : Colors.grey.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      promo.isActive ? 'Active' : 'Inactive',
                      style: TextStyle(
                        color: promo.isActive ? Colors.green : Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                    onPressed: () => _confirmDelete(context, promo, provider),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            promo.displayLabel,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            'Min. purchase: LKR ${promo.minPurchase.toStringAsFixed(2)}',
            style: TextStyle(color: Colors.grey[400], fontSize: 12),
          ),
          if (promo.expiryDate != null)
            Text(
              'Expires: ${promo.expiryDate}',
              style: TextStyle(color: Colors.grey[400], fontSize: 12),
            ),
        ],
      ),
    );
  }

  Widget _buildSalesPromoCard(BuildContext context, Promo promo, PosProvider provider) {
    final isApplied = provider.selectedPromo?.id == promo.id;
    return GestureDetector(
      onTap: promo.isActive ? () {
        if (isApplied) {
          provider.removePromo();
        } else {
          provider.applyPromo(promo);
        }
      } : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isApplied ? const Color(0xFF0882C8).withOpacity(0.15) : const Color(0xFF2A2A3C),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isApplied ? const Color(0xFF0882C8) : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0882C8).withOpacity(isApplied ? 0.25 : 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    promo.code,
                    style: const TextStyle(
                      color: Color(0xFF0882C8),
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      letterSpacing: 1,
                    ),
                  ),
                ),
                if (isApplied) ...[
                  const SizedBox(width: 8),
                  const Icon(Icons.check_circle, color: Color(0xFF0882C8), size: 18),
                ],
                if (!promo.isActive) ...[
                  const SizedBox(width: 8),
                  const Text('Inactive', style: TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ],
            ),
            const SizedBox(height: 8),
            Text(
              promo.displayLabel,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: promo.isActive ? Colors.white : Colors.grey,
              ),
            ),
            if (promo.minPurchase > 0)
              Text(
                'Min. LKR ${promo.minPurchase.toStringAsFixed(0)}',
                style: TextStyle(color: Colors.grey[400], fontSize: 12),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isAdmin) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.local_offer_outlined, size: 80, color: Colors.grey[700]),
          const SizedBox(height: 16),
          Text(
            isAdmin ? 'No promos yet' : 'No promos available',
            style: TextStyle(color: Colors.grey[400], fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            isAdmin ? 'Click "New Promo" to create your first promotion.' : 'Ask your admin to create promos.',
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, Promo promo, PosProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF2A2A3C),
        title: const Text('Delete Promo?'),
        content: Text('Delete promo "${promo.code}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(ctx);
              await provider.deletePromo(promo.id);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showCreatePromoDialog(BuildContext context) {
    final codeCtrl = TextEditingController();
    final valueCtrl = TextEditingController();
    final minCtrl = TextEditingController(text: '0');
    String selectedType = 'percentage';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlgState) => AlertDialog(
          backgroundColor: const Color(0xFF2A2A3C),
          title: const Text('Create New Promo', style: TextStyle(fontWeight: FontWeight.bold)),
          content: SizedBox(
            width: 400,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _dialogField('Promo Code (e.g. SAVE10)', codeCtrl),
                const SizedBox(height: 16),
                // Type selector
                Row(
                  children: [
                    const Text('Type:', style: TextStyle(color: Colors.grey)),
                    const SizedBox(width: 16),
                    _typeChip('percentage', '% Off', selectedType, (v) => setDlgState(() => selectedType = v)),
                    const SizedBox(width: 8),
                    _typeChip('fixed', 'Fixed Amount', selectedType, (v) => setDlgState(() => selectedType = v)),
                  ],
                ),
                const SizedBox(height: 16),
                _dialogField(
                  selectedType == 'percentage' ? 'Discount % (e.g. 10)' : 'Discount Amount',
                  valueCtrl,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                _dialogField('Min. Purchase Amount (0 = no minimum)', minCtrl,
                    keyboardType: TextInputType.number),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0882C8)),
              onPressed: () async {
                final code = codeCtrl.text.trim().toUpperCase();
                final value = double.tryParse(valueCtrl.text) ?? 0;
                final minPurchase = double.tryParse(minCtrl.text) ?? 0;

                if (code.isEmpty || value <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please fill in code and value.')),
                  );
                  return;
                }

                Navigator.pop(ctx);
                final provider = Provider.of<PosProvider>(context, listen: false);
                final success = await provider.createPromo({
                  'code': code,
                  'type': selectedType,
                  'value': value,
                  'min_purchase': minPurchase,
                  'is_active': true,
                });

                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text(success ? 'Promo "$code" created!' : 'Failed to create promo.'),
                    backgroundColor: success ? Colors.green : Colors.red,
                  ));
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dialogField(String hint, TextEditingController ctrl,
      {TextInputType? keyboardType}) {
    final provider = Provider.of<PosProvider>(context, listen: false);
    return TextField(
      controller: ctrl,
      keyboardType: keyboardType,
      readOnly: provider.useOnScreenKeyboard,
      onTap: () {
        if (provider.useOnScreenKeyboard) {
          setState(() => _activeController = ctrl);
        }
      },
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: Colors.grey[600]),
        filled: true,
        fillColor: const Color(0xFF1E1E2C),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF0882C8)),
        ),
      ),
    );
  }

  Widget _typeChip(String value, String label, String selected, Function(String) onTap) {
    final isSelected = selected == value;
    return GestureDetector(
      onTap: () => onTap(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0882C8) : const Color(0xFF1E1E2C),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.grey[400],
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            )),
      ),
    );
  }
}
