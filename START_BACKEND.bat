@echo off
title LuminaIQ Backend - FastAPI
color 0E

echo ========================================
echo    LuminaIQ Backend Server
echo ========================================
echo.

cd /d "%~dp0pdfprocess"

if not exist "venv" (
    echo [ERROR] Virtual environment not found!
    echo Please run: python -m venv venv
    echo Then run: venv\Scripts\activate
    echo Then run: pip install -r requirements.txt
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate

echo [INFO] Starting FastAPI server...
echo.
uvicorn main:app --reload --port 8001

pause
