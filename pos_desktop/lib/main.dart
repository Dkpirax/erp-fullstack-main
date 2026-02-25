import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'providers/pos_provider.dart';
import 'screens/main_pos_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => PosProvider()),
      ],
      child: const POSApp(),
    ),
  );
}

class POSApp extends StatelessWidget {
  const POSApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'POS Desktop',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF1E1E2C), // Background
        primaryColor: const Color(0xFFFF6B6B), // Accent
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFF6B6B),
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
      home: const MainPosScreen(),
    );
  }
}
