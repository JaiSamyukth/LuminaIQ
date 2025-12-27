@echo off
title LuminaIQ - Starting Development Servers
color 0A

echo ========================================
echo    Starting LuminaIQ Development
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo [1/4] Checking directories...
if not exist "index" (
    echo [ERROR] Frontend directory 'index' not found!
    pause
    exit /b 1
)
if not exist "pdfprocess" (
    echo [ERROR] Backend directory 'pdfprocess' not found!
    pause
    exit /b 1
)

echo [2/4] Starting Backend Server (FastAPI)...
start "LuminaIQ Backend" cmd /k "cd pdfprocess && venv\Scripts\activate && uvicorn main:app --reload --port 8001"
timeout /t 3 >nul

echo [3/4] Starting Frontend Server (React + Vite)...
start "LuminaIQ Frontend" cmd /k "cd index && npm run dev"
timeout /t 3 >nul

echo [4/4] Opening browser...
timeout /t 5 >nul
start http://localhost:5173

echo.
echo ========================================
echo    LuminaIQ is Running!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8001
echo API Docs: http://localhost:8001/docs
echo.
echo Press any key to close this window...
echo (Servers will keep running in separate windows)
pause >nul
