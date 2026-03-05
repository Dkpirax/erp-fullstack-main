@echo off
SETLOCAL
SET PROJECT_DIR=%~dp0pos_desktop

echo.
echo ========================================
echo   POS Desktop - Release Build Script
echo ========================================
echo.

cd /d "%PROJECT_DIR%"

echo [1/2] Fetching dependencies...
call flutter pub get
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: flutter pub get failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Building Windows release...
call flutter build windows --release
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: flutter build windows failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================
echo   Build Successful!
echo ========================================
echo The release files are located in:
echo %PROJECT_DIR%\build\windows\x64\runner\Release\
echo.
pause
ENDLOCAL
