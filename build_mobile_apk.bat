@echo off
setlocal
echo ===================================================
echo     Building Mobile APK (Android Preview)
echo ===================================================

cd "mobile"
if %errorlevel% neq 0 (
    echo [Error] Mobile directory not found!
    pause
    exit /b
)

echo Checking/Updating global EAS CLI...
call npm install -g eas-cli@latest

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo.
echo [Action Required] Please log in to your Expo account if prompted.
call eas login

echo.
echo Launching EAS Build...
echo Build Profile: Preview (Generates installable APK)
echo Platform: Android
echo.

call eas build -p android --profile preview

echo.
echo ===================================================
echo Build process finished.
echo If successful, a download link/QR code will appear.
echo ===================================================
pause
