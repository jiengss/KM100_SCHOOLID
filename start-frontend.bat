@echo off
setlocal
title KM100 Frontend (Port 3000)

echo ========================================================
echo   KM100 SKILLS AND TRAINING CENTER, INC.
echo   Starting React + Vite Frontend (Port 3000)
echo ========================================================
echo.

:: Navigate to frontend folder
if exist "%~dp0FRONTEND" (
    cd /d "%~dp0FRONTEND"
) else (
    cd /d "%~dp0"
)

echo Local Frontend URL: http://localhost:3000
echo Starting Vite development server on port 3000...
echo.

npm run dev -- --port 3000

echo.
echo [INFO] Vite frontend server has stopped.
pause
