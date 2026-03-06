import 'package:flutter/material.dart';

class VirtualKeyboard extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onClosed;

  const VirtualKeyboard({
    Key? key,
    required this.controller,
    required this.onClosed,
  }) : super(key: key);

  void _onKeyPress(String char) {
    controller.text += char;
    controller.selection = TextSelection.fromPosition(
      TextPosition(offset: controller.text.length),
    );
  }

  void _onBackspace() {
    if (controller.text.isNotEmpty) {
      controller.text = controller.text.substring(0, controller.text.length - 1);
      controller.selection = TextSelection.fromPosition(
        TextPosition(offset: controller.text.length),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF1A1A28),
      padding: const EdgeInsets.all(8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              IconButton(
                icon: const Icon(Icons.keyboard_hide, color: Colors.white),
                onPressed: onClosed,
              ),
            ],
          ),
          _buildRow(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
          _buildRow(['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']),
          _buildRow(['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildKey('Z'), _buildKey('X'), _buildKey('C'), _buildKey('V'),
              _buildKey('B'), _buildKey('N'), _buildKey('M'),
              _buildSpecialKey(Icons.backspace, _onBackspace),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildSpaceKey(),
              _buildSpecialKey(Icons.check_circle, onClosed, color: Colors.green),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRow(List<String> keys) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: keys.map((k) => _buildKey(k)).toList(),
    );
  }

  Widget _buildKey(String label) {
    return Padding(
      padding: const EdgeInsets.all(4.0),
      child: InkWell(
        onTap: () => _onKeyPress(label),
        child: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: const Color(0xFF2A2A3C),
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 18)),
        ),
      ),
    );
  }

  Widget _buildSpecialKey(IconData icon, VoidCallback onTap, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.all(4.0),
      child: InkWell(
        onTap: onTap,
        child: Container(
          width: 70,
          height: 50,
          decoration: BoxDecoration(
            color: color ?? const Color(0xFF3A3A4C),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildSpaceKey() {
    return Padding(
      padding: const EdgeInsets.all(4.0),
      child: InkWell(
        onTap: () => _onKeyPress(' '),
        child: Container(
          width: 300,
          height: 50,
          decoration: BoxDecoration(
            color: const Color(0xFF2A2A3C),
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: const Text('SPACE', style: TextStyle(color: Colors.white)),
        ),
      ),
    );
  }
}
