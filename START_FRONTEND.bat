@echo off
title LuminaIQ Frontend - React
color 0B

echo ========================================
echo    LuminaIQ Frontend Server
echo ========================================
echo.

cd /d "%~dp0index"

if not exist "node_modules" (
    echo [ERROR] Dependencies not installed!
    echo Installing npm packages...
    call npm install
)

echo [INFO] Starting Vite dev server...
echo.
npm run dev

pause
