@echo off
title LuminaIQ - HARD RESET
color 0C

echo ========================================
echo    PERFORMING HARD RESET...
echo ========================================
echo.

echo [1/5] Killing all running Node.js and Python processes...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM uvicorn.exe /T 2>nul
echo Done.

echo [2/5] Cleaning Vite Cache...
if exist "index\node_modules\.vite" (
    rmdir /s /q "index\node_modules\.vite"
    echo Cache cleared.
) else (
    echo Cache already clean.
)

echo [3/5] Verifying Environment Variables...
REM Paranoia check - overwriting to exact new values
echo VITE_SUPABASE_URL=https://bcosfvilvwyxtrctsmez.supabase.co> index\.env
echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb3Nmdmlsdnd5eHRyY3RzbWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODIyMTMsImV4cCI6MjA4MjM1ODIxM30.bj9wwAT41fkvGX6CLrmyQT16-Fph4_mgqSXZintsNX0>> index\.env
echo VITE_PDF_SERVICE_URL=http://localhost:8001>> index\.env
echo Frontend config updated.

echo [4/5] Restoring Backend Environment...
echo SUPABASE_URL=https://bcosfvilvwyxtrctsmez.supabase.co> pdfprocess\.env
echo SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb3Nmdmlsdnd5eHRyY3RzbWV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc4MjIxMywiZXhwIjoyMDgyMzU4MjEzfQ.Fyog6EUERO2Uo7EhlOHQAkRIXnQQEP8e-Klig9kp8I4>> pdfprocess\.env
echo MAIN_API_WEBHOOK_URL=http://localhost:8000/api/v1/webhook/document-ready>> pdfprocess\.env
echo MAIN_API_WEBHOOK_SECRET=supersecretwebhook>> pdfprocess\.env
echo ENVIRONMENT=development>> pdfprocess\.env
echo BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://localhost:8000"]>> pdfprocess\.env
echo CHUNK_SIZE=500>> pdfprocess\.env
echo CHUNK_OVERLAP=50>> pdfprocess\.env
echo MAX_FILE_SIZE=10485760>> pdfprocess\.env
echo Backend config updated.

echo.
echo ========================================
echo    RESET COMPLETE! STARTING NOW...
echo ========================================
echo.
timeout /t 2 >nul

call START.bat
