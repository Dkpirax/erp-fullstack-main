import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'providers/pos_provider.dart';
import 'screens/login_screen.dart';
import 'widgets/shortcut_wrapper.dart';

import 'services/api_service.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'utils/desktop_setup.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService().loadConfig();

  await initDesktop();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => PosProvider()),
      ],
      child: const POSApp(),
    ),
  );
}

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class POSApp extends StatelessWidget {
  const POSApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'POS Desktop',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF1E1E2C), // Background
        primaryColor: const Color(0xFF0882C8), // Accent
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF0882C8),
          surface: Color(0xFF2A2A3C), // Cards
          background: Color(0xFF1E1E2C),
        ),
        textTheme: GoogleFonts.interTextTheme(
          Theme.of(context).textTheme,
        ).apply(
          bodyColor: Colors.white,
          displayColor: Colors.white,
        ),
        cardColor: const Color(0xFF2A2A3C),
        useMaterial3: true,
      ),
      home: const LoginScreen(),
      builder: (context, child) => ShortcutWrapper(navigatorKey: navigatorKey, child: child!),
    );
  }
}
