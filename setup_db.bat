@echo off
echo Installing dependencies...
call npm install
echo.

echo Syncing database...
node scripts/sync_database.js
echo.

echo Creating admin user (if not exists)...
node scripts/create_admin.js
echo.

echo Setup complete!
echo Please RESTART your development server (npm run dev) to apply changes.
pause
