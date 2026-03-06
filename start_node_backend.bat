@echo off
echo Starting ERP Node.js Backend...
echo.

@REM cd erp-backend-node

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo Starting server on port 8001...
echo API available at http://localhost:8001/api/v1
echo.

call npm run dev
pause
