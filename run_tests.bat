@echo off
echo ===================================================
echo     Running ERP System Tests (Web & Mobile API)
echo ===================================================

cd erp-test

REM Check if node_modules exists, if not install
if not exist node_modules (
    echo Installing Test Dependencies...
    call npm install
    call npx playwright install
)

echo Starting Tests...
call npx playwright test

if %errorlevel% neq 0 (
    echo.
    echo Tests Failed! 
    echo Opening Report...
    call npx playwright show-report
) else (
    echo.
    echo All Tests Passed!
)

pause
