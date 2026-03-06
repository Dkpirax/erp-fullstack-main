@echo off
echo ========================================
echo   COPYING FILES TO FULLSTACK PROJECT
echo ========================================
echo.

set SOURCE_FRONTEND=..\erp-frontend
set SOURCE_BACKEND=..\erp-backend-node
set TARGET=%cd%

echo Copying backend files...
echo.

REM Create directories
if not exist "config" mkdir config
if not exist "models" mkdir models
if not exist "middleware" mkdir middleware
if not exist "routes" mkdir routes
if not exist "scripts" mkdir scripts

REM Copy backend files
echo [1/8] Copying config...
xcopy /Y "%SOURCE_BACKEND%\config\*.*" "config\"

echo [2/8] Copying models...
xcopy /Y "%SOURCE_BACKEND%\models\*.*" "models\"

echo [3/8] Copying middleware...
xcopy /Y "%SOURCE_BACKEND%\middleware\*.*" "middleware\"

echo [4/8] Copying routes...
xcopy /Y "%SOURCE_BACKEND%\routes\*.*" "routes\"

echo [5/8] Copying scripts...
xcopy /Y "%SOURCE_BACKEND%\create_admin.js" "scripts\"

echo.
echo Copying frontend files...
echo.

echo [6/8] Copying entire frontend to client folder...
if exist "client" (
    echo Client folder exists, removing...
    rmdir /S /Q client
)
xcopy /E /I /Y "%SOURCE_FRONTEND%" "client"

echo.
echo [7/8] Updating frontend configuration...
REM Update vite.config.ts to use relative API URLs
echo // Vite configuration for production build > client\vite.config.ts.new
echo import { defineConfig } from 'vite'; >> client\vite.config.ts.new
echo import react from '@vitejs/plugin-react'; >> client\vite.config.ts.new
echo. >> client\vite.config.ts.new
echo export default defineConfig({ >> client\vite.config.ts.new
echo   plugins: [react()], >> client\vite.config.ts.new
echo   server: { >> client\vite.config.ts.new
echo     port: 5173, >> client\vite.config.ts.new
echo     proxy: { >> client\vite.config.ts.new
echo       '/api': { >> client\vite.config.ts.new
echo         target: 'http://localhost:3000', >> client\vite.config.ts.new
echo         changeOrigin: true, >> client\vite.config.ts.new
echo         secure: false >> client\vite.config.ts.new
echo       } >> client\vite.config.ts.new
echo     } >> client\vite.config.ts.new
echo   }, >> client\vite.config.ts.new
echo   build: { >> client\vite.config.ts.new
echo     outDir: 'dist', >> client\vite.config.ts.new
echo     sourcemap: false >> client\vite.config.ts.new
echo   } >> client\vite.config.ts.new
echo }); >> client\vite.config.ts.new

move /Y client\vite.config.ts.new client\vite.config.ts

REM Update .env to use relative URLs
echo VITE_API_URL=/api/v1 > client\.env

echo [8/8] Cleaning up...
REM Remove node_modules from copied frontend (will reinstall)
if exist "client\node_modules" rmdir /S /Q client\node_modules

echo.
echo ========================================
echo   COPY COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Run setup.bat to install dependencies
echo 2. Run npm start to launch the application
echo.
pause
