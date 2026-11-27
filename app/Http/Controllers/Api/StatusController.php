<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\AttendanceLog;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatusController extends Controller
{
    public function health(): JsonResponse
    {
        try {
            DB::connection()->getPdo();
            $dbConnected = true;
            $studentsCount = Student::count();
            $logsCount = AttendanceLog::count();
            $adminsCount = AdminUser::count();
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database connection error: ' . $e->getMessage(),
                'backend' => 'Laravel (Laragon MySQL)'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Connected to Laravel MySQL backend (Laragon).',
            'backend' => 'Laravel (Laragon MySQL)',
            'database' => config('database.default'),
            'counts' => [
                'students' => $studentsCount,
                'attendance_logs' => $logsCount,
                'admins' => $adminsCount,
            ],
            'server_time' => now()->toIso8601String(),
        ]);
    }
}
