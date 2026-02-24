@echo off
echo ========================================================
echo        ERP Desktop Application Build Script
echo ========================================================

:: Change to the directory where this script is located
cd /d "%~dp0"

echo.
echo [1/3] Building the React Frontend...
cd client
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed.
    exit /b %errorlevel%
)

echo.
echo [2/3] Copying Frontend Build to Desktop App Folder...
xcopy /E /I /Y dist "..\erp-desktop\dist-frontend"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to copy frontend build.
    exit /b %errorlevel%
)

echo.
echo [3/3] Building the Desktop Executable (Electron)...
cd ..\erp-desktop
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Desktop app build failed.
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo        Build Completed Successfully!
echo        Executable is located in: erp-desktop\release
echo ========================================================
pause
