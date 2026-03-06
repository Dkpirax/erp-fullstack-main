import 'package:flutter/material.dart';
import '../providers/pos_provider.dart';
import 'package:provider/provider.dart';
import 'main_pos_screen.dart';
import 'package:virtual_keyboard_multi_language/virtual_keyboard_multi_language.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController(text: 'admin');
  final _passwordController = TextEditingController(text: 'admin');
  final _urlController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  bool _obscurePassword = true;
  
  TextEditingController? _activeController;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _activeController = null;
    });

    final provider = Provider.of<PosProvider>(context, listen: false);
    final success = await provider.login(
      _usernameController.text.trim(),
      _passwordController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainPosScreen()),
      );
    } else {
      setState(() {
        _errorMessage = 'Invalid username or password. Please try again.';
        _isLoading = false;
      });
    }
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
    // Move cursor to end
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
            child: Center(
              child: Container(
                width: 420,
                padding: const EdgeInsets.all(48),
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A3C),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.4),
                      blurRadius: 40,
                      offset: const Offset(0, 20),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Logo & Title
                    Center(
                      child: Column(
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              color: const Color(0xFF0882C8),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Icon(Icons.shopping_bag, color: Colors.white, size: 40),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'ElaraPOS',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            provider.serverUrl.isEmpty ? 'Initial Setup' : 'Sign in to continue',
                            style: TextStyle(color: Colors.grey[400], fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),

                    if (provider.serverUrl.isEmpty) ...[
                      // Setup API URL
                      Text('Server API URL', style: TextStyle(color: Colors.grey[300], fontSize: 14, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
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
                          hintText: 'e.g. https://erp.reon.lk/api/v1',
                          hintStyle: TextStyle(color: Colors.grey[600]),
                          prefixIcon: const Icon(Icons.link, color: Colors.grey),
                          filled: true,
                          fillColor: const Color(0xFF1E1E2C),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF0882C8)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () {
                            if (_urlController.text.trim().isNotEmpty) {
                              provider.updateServerUrl(_urlController.text.trim());
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0882C8),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: const Text('Save URL & Continue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ] else ...[
                      // Username
                      Text('Username', style: TextStyle(color: Colors.grey[300], fontSize: 14, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _usernameController,
                        readOnly: provider.useOnScreenKeyboard,
                        onTap: () {
                          if (provider.useOnScreenKeyboard) {
                            setState(() => _activeController = _usernameController);
                          }
                        },
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Enter username',
                          hintStyle: TextStyle(color: Colors.grey[600]),
                          prefixIcon: const Icon(Icons.person_outline, color: Colors.grey),
                          filled: true,
                          fillColor: const Color(0xFF1E1E2C),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF0882C8)),
                          ),
                        ),
                        onSubmitted: (_) => _login(),
                      ),
                      const SizedBox(height: 20),

                      // Password
                      Text('Password', style: TextStyle(color: Colors.grey[300], fontSize: 14, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        readOnly: provider.useOnScreenKeyboard,
                        onTap: () {
                          if (provider.useOnScreenKeyboard) {
                            setState(() => _activeController = _passwordController);
                          }
                        },
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Enter password',
                          hintStyle: TextStyle(color: Colors.grey[600]),
                          prefixIcon: const Icon(Icons.lock_outline, color: Colors.grey),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_off : Icons.visibility,
                              color: Colors.grey,
                            ),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                          filled: true,
                          fillColor: const Color(0xFF1E1E2C),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF0882C8)),
                          ),
                        ),
                        onSubmitted: (_) => _login(),
                      ),
                      const SizedBox(height: 12),

                      // Error message
                      if (_errorMessage != null)
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.red.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline, color: Colors.red, size: 16),
                              const SizedBox(width: 8),
                              Expanded(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 13))),
                            ],
                          ),
                        ),

                      const SizedBox(height: 28),

                      // Login Button
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _login,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0882C8),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : const Text('Sign In', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
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
                    postKeyPress: (key) => _onKeyPress(key),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
