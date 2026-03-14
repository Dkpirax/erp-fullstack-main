@echo off
setlocal EnableDelayedExpansion

:: ================================================================
::  ELARA POS - Full Rebuild Script
::  1. Saves backend + launcher files
::  2. Cleans and rebuilds Flutter (windows release)
::  3. Re-injects backend + launcher into fresh Release folder
::  4. Compiles and installs the auto-launcher as elara_pos.exe
:: ================================================================

set "PROJECT=%~dp0pos_desktop"
set "RELEASE=%PROJECT%\build\windows\x64\runner\Release"
set "TEMP_BACKUP=%~dp0_launcher_backup"
set "CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

echo.
echo  ================================================================
echo   ELARA POS - Full Clean Rebuild
echo  ================================================================
echo.

:: ── STEP 1: Backup backend + launcher files ──────────────────────
echo [1/5] Backing up backend and launcher files...
if exist "%TEMP_BACKUP%" rmdir /s /q "%TEMP_BACKUP%"
mkdir "%TEMP_BACKUP%"

if exist "%RELEASE%\backend" (
    xcopy /E /I /Y /Q "%RELEASE%\backend" "%TEMP_BACKUP%\backend" >nul
    echo       backend\  backed up.
) else (
    echo       [WARN] No backend folder found in Release - will copy from project root.
    xcopy /E /I /Y /Q "%~dp0backend_template" "%TEMP_BACKUP%\backend" >nul 2>nul
)

:: Backup launcher source + scripts
for %%f in (launcher_src.cs build_launcher.ps1 stop_backend.bat "Elara POS.vbs" start_elara.bat) do (
    if exist "%RELEASE%\%%f" copy /Y "%RELEASE%\%%f" "%TEMP_BACKUP%\%%f" >nul
)

echo       Done.
echo.

:: ── STEP 2: Flutter clean ────────────────────────────────────────
echo [2/5] Running flutter clean...
cd /d "%PROJECT%"
call flutter clean
if %errorlevel% neq 0 (
    echo [ERROR] flutter clean failed!
    goto :RESTORE_AND_EXIT
)
echo       Done.
echo.

:: ── STEP 3: Flutter build windows ───────────────────────────────
echo [3/5] Building Flutter Windows release (this takes a few minutes)...
call flutter build windows --release
if %errorlevel% neq 0 (
    echo [ERROR] flutter build windows failed!
    goto :RESTORE_AND_EXIT
)
echo       Done.
echo.

:: ── STEP 4: Restore backend + launcher files ─────────────────────
echo [4/5] Restoring backend and launcher files into Release...

:: Restore backend
if exist "%TEMP_BACKUP%\backend" (
    xcopy /E /I /Y /Q "%TEMP_BACKUP%\backend" "%RELEASE%\backend" >nul
    echo       backend\  restored.
)

:: Restore scripts
for %%f in (launcher_src.cs build_launcher.ps1 stop_backend.bat "Elara POS.vbs" start_elara.bat) do (
    if exist "%TEMP_BACKUP%\%%f" copy /Y "%TEMP_BACKUP%\%%f" "%RELEASE%\%%f" >nul
)

:: Create logs folder
if not exist "%RELEASE%\logs" mkdir "%RELEASE%\logs"

echo       Done.
echo.

:: ── STEP 5: Compile and install the auto-launcher ────────────────
echo [5/5] Compiling auto-launcher and installing as elara_pos.exe...

:: The new Flutter build creates elara_pos.exe - rename it first
if exist "%RELEASE%\elara_pos.exe" (
    if exist "%RELEASE%\elara_pos_core.exe" del /f /q "%RELEASE%\elara_pos_core.exe"
    rename "%RELEASE%\elara_pos.exe" "elara_pos_core.exe"
    echo       Renamed elara_pos.exe → elara_pos_core.exe
)

:: Compile launcher
if not exist "%CSC%" (
    echo [ERROR] .NET CSC compiler not found at: %CSC%
    echo         Cannot build auto-launcher. Run build_launcher.ps1 manually.
    goto :DONE
)

"%CSC%" ^
    /target:winexe ^
    /out:"%RELEASE%\elara_pos.exe" ^
    /reference:"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.Windows.Forms.dll" ^
    "%RELEASE%\launcher_src.cs" >nul 2>&1

if %errorlevel% neq 0 (
    echo [ERROR] Launcher compilation failed!
    echo         Run build_launcher.ps1 manually after the build.
    goto :DONE
)

echo       elara_pos.exe = auto-launcher
echo       elara_pos_core.exe = Flutter app
echo.

:DONE
:: Cleanup temp backup
rmdir /s /q "%TEMP_BACKUP%" 2>nul

echo  ================================================================
echo   Build Complete!
echo.
echo   Release folder: %RELEASE%
echo.
echo   Just double-click elara_pos.exe to launch everything!
echo   (MySQL must be running in XAMPP first)
echo  ================================================================
echo.
pause
exit /b 0

:RESTORE_AND_EXIT
echo.
echo [!] Build failed. Attempting to restore files...
if exist "%TEMP_BACKUP%\backend" xcopy /E /I /Y /Q "%TEMP_BACKUP%\backend" "%RELEASE%\backend" >nul 2>nul
rmdir /s /q "%TEMP_BACKUP%" 2>nul
echo.
pause
exit /b 1
