<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\Employee;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $limit = min((int) ($request->get('limit', 100)), 500);

        $query = AttendanceLog::with(['student', 'employee']);

        if ($request->filled('person_type')) {
            $query->where('person_type', $request->person_type);
        }

        if ($request->filled('school_id')) {
            $query->where('school_id', $request->school_id);
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('log_type')) {
            $query->where('log_type', $request->log_type);
        }

        if ($request->filled('date')) {
            $query->whereDate('timestamp', $request->date);
        }

        if ($request->filled('course_strand')) {
            $strand = $request->course_strand;
            $query->whereHas('student', function ($q) use ($strand) {
                $q->where('course_strand', $strand);
            });
        }

        $logs = $query->orderBy('timestamp', 'desc')->limit($limit)->get();

        return response()->json($logs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'person_type' => 'nullable|string|in:STUDENT,EMPLOYEE',
            'student_id' => 'nullable|uuid',
            'employee_id' => 'nullable|uuid',
            'school_id' => 'required|string',
            'log_type' => 'required|in:IN,OUT',
            'timestamp' => 'nullable|date',
            'gate_station' => 'nullable|string|max:100',
            'remarks' => 'nullable|string',
        ]);

        $personType = $validated['person_type'] ?? 'STUDENT';
        $studentId = $validated['student_id'] ?? null;
        $employeeId = $validated['employee_id'] ?? null;

        // Auto-resolve person if IDs not directly provided
        if ($personType === 'EMPLOYEE' || !empty($employeeId)) {
            $personType = 'EMPLOYEE';
            if (!$employeeId) {
                $emp = Employee::where('employee_id', $validated['school_id'])->first();
                $employeeId = $emp?->id;
            }
        } else {
            $personType = 'STUDENT';
            if (!$studentId) {
                $stu = Student::where('school_id', $validated['school_id'])->first();
                $studentId = $stu?->id;
            }
        }

        $log = AttendanceLog::create([
            'id' => (string) Str::uuid(),
            'person_type' => $personType,
            'student_id' => $studentId,
            'employee_id' => $employeeId,
            'school_id' => $validated['school_id'],
            'log_type' => $validated['log_type'],
            'timestamp' => !empty($validated['timestamp']) ? Carbon::parse($validated['timestamp']) : Carbon::now(),
            'gate_station' => $validated['gate_station'] ?? 'Main Gate Kiosk',
            'remarks' => $validated['remarks'] ?? 'Normal',
        ]);

        $log->load(['student', 'employee']);

        return response()->json($log, 201);
    }

    public function last(string $personId): JsonResponse
    {
        $log = AttendanceLog::with(['student', 'employee'])
            ->where(function ($q) use ($personId) {
                $q->where('student_id', $personId)
                    ->orWhere('employee_id', $personId)
                    ->orWhere('school_id', $personId);
            })
            ->orderBy('timestamp', 'desc')
            ->first();

        return response()->json($log ?: null);
    }
}
