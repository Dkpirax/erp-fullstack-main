import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/pos_provider.dart';
import '../widgets/sidebar.dart';
import 'package:intl/intl.dart';
import '../services/receipt_service.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({Key? key}) : super(key: key);

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<PosProvider>(context, listen: false).fetchOrderHistory();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<PosProvider>(context);
    final history = provider.orderHistory;

    return Scaffold(
      body: Row(
        children: [
          const Sidebar(activePage: 'History'),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Order History',
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.refresh),
                        onPressed: () => provider.fetchOrderHistory(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Expanded(
                    child: provider.isLoading && history.isEmpty
                        ? const Center(child: CircularProgressIndicator())
                        : history.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.history, size: 64, color: Colors.grey[700]),
                                    const SizedBox(height: 16),
                                    Text('No orders yet', style: TextStyle(color: Colors.grey[500])),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                itemCount: history.length,
                                itemBuilder: (context, index) {
                                  final order = history[index];
                                  final displayId = order.id.length > 6 
                                      ? order.id.substring(order.id.length - 6) 
                                      : order.id;
                                      
                                  return Card(
                                    margin: const EdgeInsets.only(bottom: 16),
                                    color: const Color(0xFF2A2A3C),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    child: ExpansionTile(
                                      iconColor: const Color(0xFF0882C8),
                                      collapsedIconColor: Colors.grey,
                                      title: Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF0882C8).withValues(alpha: 0.1),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              '#$displayId',
                                              style: const TextStyle(color: Color(0xFF0882C8), fontWeight: FontWeight.bold, fontSize: 13),
                                            ),
                                          ),
                                          const SizedBox(width: 16),
                                          Text(
                                            DateFormat('dd MMM yyyy, hh:mm a').format(order.date),
                                            style: const TextStyle(fontSize: 14, color: Colors.white),
                                          ),
                                          const Spacer(),
                                          Text(
                                            'LKR ${order.total.toStringAsFixed(2)}',
                                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                                          ),
                                        ],
                                      ),
                                      subtitle: Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Row(
                                          children: [
                                            Icon(
                                              order.paymentMethod.toUpperCase() == 'CASH' ? Icons.money : Icons.credit_card,
                                              size: 14,
                                              color: Colors.grey,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(order.paymentMethod, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                            const SizedBox(width: 16),
                                            Text('${order.items.fold<int>(0, (sum, item) => sum + item.quantity)} items', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                          ],
                                        ),
                                      ),
                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.all(16.0),
                                          child: Column(
                                            children: [
                                              const Divider(color: Colors.white10),
                                              ...order.items.map((item) => Padding(
                                                padding: const EdgeInsets.symmetric(vertical: 4),
                                                child: Row(
                                                  children: [
                                                    Text('${item.quantity}x ', style: const TextStyle(color: Color(0xFF0882C8))),
                                                    Expanded(
                                                      child: Column(
                                                        crossAxisAlignment: CrossAxisAlignment.start,
                                                        children: [
                                                          Text(item.product.name),
                                                          if (item.product.size != null && item.product.size!.isNotEmpty)
                                                            Text('Size: ${item.product.size}', style: TextStyle(color: Colors.grey[600], fontSize: 10)),
                                                        ],
                                                      ),
                                                    ),
                                                    Text('LKR ${item.totalPrice.toStringAsFixed(2)}'),
                                                  ],
                                                ),
                                              )).toList(),
                                              const Divider(color: Colors.white10),
                                              _summaryRow('Subtotal', order.subtotal),
                                              if (order.discount > 0) _summaryRow('Discount', -order.discount, color: Colors.green),
                                              const SizedBox(height: 8),
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  const Text('Total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                                  Text('LKR ${order.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0882C8))),
                                                ],
                                              ),
                                              const SizedBox(height: 16),
                                              SizedBox(
                                                width: double.infinity,
                                                child: OutlinedButton.icon(
                                                  onPressed: () async {
                                                    ScaffoldMessenger.of(context).showSnackBar(
                                                      const SnackBar(content: Text('🖨️ Opening print dialog...'))
                                                    );
                                                    
                                                    await ReceiptService.showPrintPreview(context, order);
                                                  },
                                                  icon: const Icon(Icons.print, size: 18),
                                                  label: const Text('Reprint Receipt'),
                                                  style: OutlinedButton.styleFrom(
                                                    foregroundColor: const Color(0xFF0882C8),
                                                    side: const BorderSide(color: Color(0xFF0882C8)),
                                                  ),
                                                ),
                                              )
                                            ],
                                          ),
                                        )
                                      ],
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
    );
  }

  Widget _summaryRow(String label, double value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text('LKR ${value.toStringAsFixed(2)}', style: TextStyle(color: color ?? Colors.white, fontSize: 13)),
        ],
      ),
    );
  }
}
