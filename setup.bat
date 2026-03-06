@echo off
echo ========================================
echo   ERP FULLSTACK - COMPLETE SETUP
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Installing frontend dependencies...
cd client
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo [3/5] Building frontend for production...
cd client
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)
cd ..

echo.
echo [4/5] Creating admin user...
call npm run create-admin
if errorlevel 1 (
    echo WARNING: Admin creation failed or admin already exists
)

echo.
echo [5/5] Setup complete!
echo.
echo ========================================
echo   DEPLOYMENT OPTIONS
echo ========================================
echo.
echo Option 1: Run with Node.js (Recommended)
echo    npm start
echo    Access at: http://localhost:3000
echo.
echo Option 2: Deploy to Apache
echo    1. Keep Node.js running: npm start
echo    2. Configure Apache (see DEPLOYMENT.md)
echo    3. Access via Apache virtual host
echo.
echo ========================================
pause
