@echo off
echo ============================================
echo  POS Desktop - Build and Launch
echo ============================================
echo.

cd /d "%~dp0pos_desktop"

echo [1/3] Building Flutter app (Dart compilation)...
flutter build windows 2>&1 | findstr /V "C1083\|vcxproj\|error C\|cpp_client"
echo.

echo [2/3] Starting Node.js backend server...
cd /d "%~dp0"
start "ERP Backend (port 3000)" cmd /k "node server.js"
timeout /t 4 /nobreak > nul

echo [3/3] Launching POS Desktop App...
start "" "%~dp0pos_desktop\build\windows\x64\runner\Release\pos_desktop.exe"

echo.
echo ============================================
echo  POS App launched!
echo  Backend running in separate window.
echo  Close the backend window to stop the server.
echo ============================================
