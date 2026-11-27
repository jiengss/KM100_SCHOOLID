@echo off
setlocal enabledelayedexpansion
title KM100 Full-Stack Launcher

echo ========================================================
echo   KM100 SKILLS AND TRAINING CENTER, INC.
echo   Full-Stack Service Launcher
echo ========================================================
echo.
echo [REMINDER] Ensure Laragon is open and MySQL is RUNNING
echo            before launching the application services.
echo ========================================================
echo.

set "STATIC_DOMAIN=smokeless-unstitch-upward.ngrok-free.dev"
if exist "%~dp0ngrok-domain.txt" (
    set /p STATIC_DOMAIN=<"%~dp0ngrok-domain.txt"
)

:: 1. Launch Laravel Backend
echo [1/3] Launching Laravel Backend (Port 8000)...
start "Backend (Port 8000)" cmd /k ""%~dp0start-backend.bat""

:: 2. Launch Vite Frontend
echo [2/3] Launching React Vite Frontend (Port 3000)...
start "Frontend (Port 3000)" cmd /k ""%~dp0start-frontend.bat""

:: 3. Detect and Launch ngrok Tunnel
set "NGROK_EXE="
where ngrok >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "NGROK_EXE=ngrok"
) else if exist "%LOCALAPPDATA%\Programs\ngrok\ngrok.exe" (
    set "NGROK_EXE=%LOCALAPPDATA%\Programs\ngrok\ngrok.exe"
) else if exist "C:\laragon\bin\ngrok\ngrok.exe" (
    set "NGROK_EXE=C:\laragon\bin\ngrok\ngrok.exe"
)

if defined NGROK_EXE (
    echo [3/3] Launching ngrok Static Tunnel...
    echo       Public Tunnel URL: https://!STATIC_DOMAIN!
    start "ngrok Tunnel" cmd /k "title ngrok Tunnel && "!NGROK_EXE!" http --url=!STATIC_DOMAIN! 8000"
) else (
    echo [3/3] [NOTE] ngrok binary was not found in PATH or standard paths.
    echo       Local development will run at http://localhost:3000 without public tunnel.
)

echo.
echo [4/4] Waiting 5 seconds for local servers to warm up...
timeout /t 5 >nul

echo Opening http://localhost:3000 in your default browser...
start http://localhost:3000

echo.
echo ========================================================
echo   All services have been started!
echo   - Local Frontend: http://localhost:3000
echo   - Local Backend:  http://127.0.0.1:8000
if defined NGROK_EXE (
    echo   - Public Tunnel:  https://!STATIC_DOMAIN!
)
echo ========================================================
echo.
