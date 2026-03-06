@echo off
git init
if %errorlevel% neq 0 echo "Failed to init" & exit /b %errorlevel%
git add .
if %errorlevel% neq 0 echo "Failed to add" & exit /b %errorlevel%
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/roshan1991/erp-fullstack.git
git push -u origin main
if %errorlevel% neq 0 echo "Failed to push" & exit /b %errorlevel%
echo "SUCCESS"
