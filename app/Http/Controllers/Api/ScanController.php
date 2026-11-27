<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\Employee;
use App\Models\Student;
use Illuminate\Http\JsonResponse;

class ScanController extends Controller
{
    public function scan(string $value): JsonResponse
    {
        $clean = trim($value);
        if (!$clean) {
            return response()->json(['message' => 'Scanned code is empty.'], 400);
        }

        // 1. Check Students
        $student = Student::where('school_id', $clean)
            ->orWhere('rfid_uid', $clean)
            ->first();

        if ($student) {
            $data = $student->toArray();
            $data['person_type'] = 'STUDENT';
            
            // Attach latest attendance log to eliminate extra network roundtrips
            $lastLog = AttendanceLog::where('student_id', $student->id)
                ->orWhere('school_id', $student->school_id)
                ->orderBy('timestamp', 'desc')
                ->first();
            $data['last_attendance'] = $lastLog;

            return response()->json($data);
        }

        // 2. Check Employees / Staff / Instructors
        $employee = Employee::where('employee_id', $clean)
            ->orWhere('rfid_uid', $clean)
            ->first();

        if ($employee) {
            $data = $employee->toArray();
            $data['person_type'] = 'EMPLOYEE';
            $data['school_id'] = $employee->employee_id;

            // Attach latest attendance log
            $lastLog = AttendanceLog::where('employee_id', $employee->id)
                ->orWhere('school_id', $employee->employee_id)
                ->orderBy('timestamp', 'desc')
                ->first();
            $data['last_attendance'] = $lastLog;

            return response()->json($data);
        }

        return response()->json([
            'message' => "Unrecognized ID '{$clean}'. No student or employee found with this credential."
        ], 404);
    }
}

