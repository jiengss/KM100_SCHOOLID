@echo off
setlocal
title KM100 Backend (Port 8000)

echo ========================================================
echo   KM100 SKILLS AND TRAINING CENTER, INC.
echo   Starting Laravel Backend Server (Port 8000)
echo ========================================================
echo.

:: Prepend Laragon PHP, Composer, and MySQL binaries to PATH
if exist "C:\laragon\bin\php\php-8.3.36-Win32-vs16-x64" (
    set "PATH=C:\laragon\bin\php\php-8.3.36-Win32-vs16-x64;%PATH%"
)
if exist "C:\laragon\bin\composer" (
    set "PATH=C:\laragon\bin\composer;%PATH%"
)
if exist "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin" (
    set "PATH=C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin;%PATH%"
)

:: Navigate to backend folder (supports BACKEND/ subdirectory or root project)
if exist "%~dp0BACKEND\artisan" (
    cd /d "%~dp0BACKEND"
) else if exist "%~dp0BACKEND" (
    cd /d "%~dp0BACKEND"
) else (
    cd /d "%~dp0"
)

echo [Environment Check]
where php 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PHP executable was not found. Please verify Laragon installation.
    pause
    exit /b 1
)

echo.
echo Local Backend API URL: http://127.0.0.1:8000
echo Serving Laravel application on http://127.0.0.1:8000 ...
echo.

php artisan serve --host=127.0.0.1 --port=8000

echo.
echo [INFO] Laravel backend has stopped.
pause
