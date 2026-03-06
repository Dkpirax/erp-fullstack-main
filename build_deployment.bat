@echo off
echo ===================================================
echo   ERP Fullstack - Deployment Builder for Shared Hosting
echo ===================================================
echo.

echo [1/5] Installing Backend Dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing backend dependencies.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/5] Installing Frontend Dependencies...
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing frontend dependencies.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/5] Building Frontend...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error building frontend.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [4/5] Creating Deployment Package...
if exist "deployment" (
    rmdir /s /q "deployment"
)
mkdir "deployment"

REM Copy Backend Files
copy "server.js" "deployment\"
copy "package.json" "deployment\"
if exist "package-lock.json" copy "package-lock.json" "deployment\"
if exist ".env" copy ".env" "deployment\.env.example"
xcopy "config" "deployment\config\" /E /I
xcopy "models" "deployment\models\" /E /I
xcopy "routes" "deployment\routes\" /E /I
xcopy "middleware" "deployment\middleware\" /E /I
xcopy "scripts" "deployment\scripts\" /E /I
xcopy "sockets" "deployment\sockets\" /E /I
xcopy "whatsapp" "deployment\whatsapp\" /E /I
xcopy "public" "deployment\public\" /E /I

REM Copy Admin Creation Script specifically if not in scripts
if exist "create_admin.js" copy "create_admin.js" "deployment\"

REM Copy Frontend Build
mkdir "deployment\client\dist"
xcopy "client\dist" "deployment\client\dist\" /E /I

echo.
echo [4.5/5] Zipping Deployment Package...
powershell -command "Compress-Archive -Path 'deployment\*' -DestinationPath 'erp-deploy.zip' -Force"
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Could not create zip file automatically. Please zip the 'deployment' folder manually.
) else (
    echo Created 'erp-deploy.zip' successfully.
)

echo.
echo [5/5] Deployment Package Ready!
echo.
echo The 'deployment' folder contains everything you need to upload.
echo.
echo Instructions:
echo 1. Zip the contents of the 'deployment' folder.
echo 2. Upload the zip to your hosting (e.g., File Manager).
echo 3. Extract it.
echo 4. Follow the DEPLOYMENT_SPACESHIP.md guide.
echo.

