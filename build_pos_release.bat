@echo off
SETLOCAL
SET PROJECT_DIR=%~dp0pos_desktop

echo.
echo ========================================
echo   POS Desktop - Release Build Script
echo ========================================
echo.

cd /d "%PROJECT_DIR%"

echo [1/3] Cleaning project...
call flutter clean
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: flutter clean failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Fetching dependencies...
call flutter pub get
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: flutter pub get failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Building Windows release...
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
echo [4/4] Packing backend server into Release folder...
SET RELEASE_DIR=%PROJECT_DIR%\build\windows\x64\runner\Release
mkdir "%RELEASE_DIR%\backend" 2>nul
xcopy /E /I /Y "%~dp0config" "%RELEASE_DIR%\backend\config"
xcopy /E /I /Y "%~dp0middleware" "%RELEASE_DIR%\backend\middleware"
xcopy /E /I /Y "%~dp0models" "%RELEASE_DIR%\backend\models"
xcopy /E /I /Y "%~dp0routes" "%RELEASE_DIR%\backend\routes"
xcopy /E /I /Y "%~dp0sockets" "%RELEASE_DIR%\backend\sockets"
xcopy /E /I /Y "%~dp0whatsapp" "%RELEASE_DIR%\backend\whatsapp"
copy /Y "%~dp0server.js" "%RELEASE_DIR%\backend\"
copy /Y "%~dp0package.json" "%RELEASE_DIR%\backend\"
copy /Y "%~dp0.env" "%RELEASE_DIR%\backend\" 2>nul
copy /Y "%~dp0users.json" "%RELEASE_DIR%\backend\" 2>nul
copy /Y "%~dp0users_utf8.json" "%RELEASE_DIR%\backend\" 2>nul

echo Installing backend dependencies...
cd /d "%RELEASE_DIR%\backend"
call npm install --omit=dev

echo.
echo The packaged release is fully ready and located in:
echo %PROJECT_DIR%\build\windows\x64\runner\Release\
echo.
pause
ENDLOCAL
