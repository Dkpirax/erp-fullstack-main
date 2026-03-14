import 'dart:io';
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';

Process? _backendProcess;

class BackendLifecycleListener extends WindowListener {
  @override
  void onWindowClose() async {
    print('Closing POS Desktop. Killing backend server...');
    if (_backendProcess != null) {
      if (Platform.isWindows) {
        // Fast and forceful kill of the Node process and all its children
        Process.runSync('taskkill', ['/F', '/T', '/PID', _backendProcess!.pid.toString()]);
      } else {
        _backendProcess!.kill();
      }
    }
    await windowManager.destroy();
    exit(0); // Force the Flutter app to quit immediately
  }
}

Future<void> initDesktop() async {
  await windowManager.ensureInitialized();
  WindowOptions windowOptions = const WindowOptions(
    center: true,
    backgroundColor: Colors.transparent,
    skipTaskbar: false,
    titleBarStyle: TitleBarStyle.normal,
  );
  windowManager.waitUntilReadyToShow(windowOptions, () async {
    await windowManager.show();
    await windowManager.focus();
  });

  windowManager.addListener(BackendLifecycleListener());
  windowManager.setPreventClose(true); // Manually handle close to kill backend

  _startBackendServer();
}

Future<void> _startBackendServer() async {
  try {
    String cmd = 'node';
    List<String> args = ['server.js'];
    
    // Path of the running executable (release mode)
    String exeDir = File(Platform.resolvedExecutable).parent.path;
    print('Executable directory: $exeDir');

    // Ordered list of directories to check for server.js
    List<String> _possibleDirs = [
      exeDir, // If server.js is shipped right next to the .exe
      '$exeDir\\backend', // If packaged into a backend/ subfolder
      '$exeDir\\..\\..\\..\\..\\..\\..\\', // Default Windows Release build path up to project root
      '..\\', // Typical Flutter run from IDE (cwd = pos_desktop)
      Directory.current.path, // Fallback to current working directory
    ];

    String? workingDirectory;
    for (String dir in _possibleDirs) {
      final checkFile = File('$dir\\server.js');
      if (await checkFile.exists()) {
        workingDirectory = dir;
        print('Found server.js in: $dir');
        break;
      }
    }

    if (workingDirectory == null) {
      print('Failed to locate server.js. Cannot start backend.');
      return;
    }

    _backendProcess = await Process.start(
      cmd, 
      args,
      workingDirectory: workingDirectory,
    );
    
    _backendProcess?.stdout.listen((event) {
      print('Backend: ${String.fromCharCodes(event).trim()}');
    });

    _backendProcess?.stderr.listen((event) {
      print('Backend Error: ${String.fromCharCodes(event).trim()}');
    });
        
    print('Started Backend Server with PID: ${_backendProcess?.pid}');
  } catch (e) {
    print('Failed to start backend server: $e');
  }
}
