<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ScanController;
use App\Http\Controllers\Api\StatusController;
use App\Http\Controllers\Api\StudentController;
use Illuminate\Support\Facades\Route;

$registerRoutes = function () {
    // Health / Status check
    Route::get('/health', [StatusController::class, 'health']);

    // Unified 0-Delay Scan (Students & Employees / Instructors / Staff)
    Route::get('/scan/{value}', [ScanController::class, 'scan']);

    // Admin Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Students management
    Route::prefix('students')->group(function () {
        Route::get('/', [StudentController::class, 'index']);
        Route::post('/', [StudentController::class, 'store']);
        Route::post('/bulk', [StudentController::class, 'bulk']);
        Route::post('/purge-mock', [StudentController::class, 'purgeMock']);
        Route::get('/scan/{value}', [StudentController::class, 'scan']);
        Route::get('/{id}', [StudentController::class, 'show']);
        Route::put('/{id}', [StudentController::class, 'update']);
        Route::delete('/{id}', [StudentController::class, 'destroy']);
    });

    // Employees, Instructors & Staff management
    Route::prefix('employees')->group(function () {
        Route::get('/', [EmployeeController::class, 'index']);
        Route::post('/', [EmployeeController::class, 'store']);
        Route::get('/{id}', [EmployeeController::class, 'show']);
        Route::put('/{id}', [EmployeeController::class, 'update']);
        Route::delete('/{id}', [EmployeeController::class, 'destroy']);
    });

    // Attendance logging (Unified for Students and Personnel)
    Route::prefix('attendance')->group(function () {
        Route::get('/', [AttendanceController::class, 'index']);
        Route::post('/', [AttendanceController::class, 'store']);
        Route::get('/last/{id}', [AttendanceController::class, 'last']);
    });
};

// Register base routes (e.g. /api/auth/login) and v1 versioned routes (e.g. /api/v1/auth/login)
$registerRoutes();
Route::prefix('v1')->group($registerRoutes);
