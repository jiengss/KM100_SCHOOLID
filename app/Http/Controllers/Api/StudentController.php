<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Student::query();

        if ($request->filled('search')) {
            $term = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('school_id', 'LIKE', $term)
                  ->orWhere('rfid_uid', 'LIKE', $term)
                  ->orWhere('first_name', 'LIKE', $term)
                  ->orWhere('last_name', 'LIKE', $term)
                  ->orWhere('middle_name', 'LIKE', $term)
                  ->orWhere('section', 'LIKE', $term)
                  ->orWhere('course_strand', 'LIKE', $term);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('course_strand')) {
            $query->where('course_strand', $request->course_strand);
        }

        $students = $query->orderBy('created_at', 'desc')->get();

        return response()->json($students);
    }

    public function show(string $id): JsonResponse
    {
        $student = Student::with('attendanceLogs')->find($id);

        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        return response()->json($student);
    }

    public function scan(string $value): JsonResponse
    {
        $clean = trim($value);
        if (!$clean) {
            return response()->json(['message' => 'Scanned value is empty.'], 400);
        }

        $student = Student::where('school_id', $clean)
            ->orWhere('rfid_uid', $clean)
            ->first();

        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        return response()->json($student);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_id' => 'nullable|string|max:50',
            'rfid_uid' => 'nullable|string|max:100',
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'gender' => 'nullable|string|max:20',
            'grade_level' => 'nullable|string|max:50',
            'section' => 'nullable|string|max:50',
            'course_strand' => 'nullable|string|max:150',
            'email' => 'nullable|email|max:150',
            'contact_number' => 'nullable|string|max:30',
            'photo_url' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:150',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'blood_type' => 'nullable|string|max:10',
            'status' => 'nullable|string|max:30',
        ]);

        // Auto-generate a guaranteed unique school_id if empty or already exists
        if (empty($validated['school_id']) || Student::where('school_id', $validated['school_id'])->exists()) {
            $year = date('Y');
            $nextNum = Student::where('school_id', 'LIKE', "{$year}-%")->count() + 1;
            do {
                $candidateId = sprintf('%s-%05d', $year, $nextNum);
                $nextNum++;
            } while (Student::where('school_id', $candidateId)->exists());

            $validated['school_id'] = $candidateId;
        }

        // Auto-generate RFID if empty or already exists
        if (empty($validated['rfid_uid']) || Student::where('rfid_uid', $validated['rfid_uid'])->exists()) {
            $validated['rfid_uid'] = 'RFID-' . $validated['school_id'];
        }

        $validated['id'] = (string) Str::uuid();

        $student = Student::create($validated);

        return response()->json($student, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $student = Student::find($id);

        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        $validated = $request->validate([
            'school_id' => 'sometimes|required|string|max:50',
            'rfid_uid' => 'nullable|string|max:100',
            'first_name' => 'sometimes|required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'gender' => 'nullable|string|max:20',
            'grade_level' => 'nullable|string|max:50',
            'section' => 'nullable|string|max:50',
            'course_strand' => 'nullable|string|max:150',
            'email' => 'nullable|email|max:150',
            'contact_number' => 'nullable|string|max:30',
            'photo_url' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:150',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'blood_type' => 'nullable|string|max:10',
            'status' => 'nullable|string|max:30',
        ]);

        if (isset($validated['school_id']) && $validated['school_id'] !== $student->school_id) {
            if (Student::where('school_id', $validated['school_id'])->where('id', '!=', $id)->exists()) {
                return response()->json(['message' => 'School ID is already taken.'], 422);
            }
        }

        $student->update($validated);

        return response()->json($student);
    }

    public function destroy(string $id): JsonResponse
    {
        $student = Student::find($id);

        if (!$student) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        $student->delete();

        return response()->json(['message' => 'Student deleted successfully.']);
    }

    public function bulk(Request $request): JsonResponse
    {
        $studentsData = $request->input('students', []);
        if (!is_array($studentsData) || empty($studentsData)) {
            return response()->json(['message' => 'No student records provided.'], 400);
        }

        $created = 0;
        $updated = 0;
        $errors = [];

        foreach ($studentsData as $index => $row) {
            try {
                $schoolId = trim($row['school_id'] ?? '');
                $firstName = trim($row['first_name'] ?? '');
                $lastName = trim($row['last_name'] ?? '');

                if (!$firstName && !$lastName) {
                    continue;
                }

                if (!$schoolId) {
                    $year = date('Y');
                    $schoolId = sprintf('%s-%05d', $year, rand(10000, 99999));
                }

                $record = Student::where('school_id', $schoolId)->first();

                $payload = [
                    'school_id' => $schoolId,
                    'rfid_uid' => !empty($row['rfid_uid']) ? trim($row['rfid_uid']) : ($record ? $record->rfid_uid : 'RFID-' . strtoupper(Str::random(8))),
                    'first_name' => $firstName,
                    'middle_name' => !empty($row['middle_name']) ? trim($row['middle_name']) : null,
                    'last_name' => $lastName,
                    'gender' => $row['gender'] ?? 'Unspecified',
                    'grade_level' => $row['grade_level'] ?? 'N/A',
                    'section' => $row['section'] ?? 'N/A',
                    'course_strand' => $row['course_strand'] ?? 'Computer Engineering Technology (3 Year Diploma)',
                    'email' => !empty($row['email']) ? trim($row['email']) : null,
                    'contact_number' => !empty($row['contact_number']) ? trim($row['contact_number']) : null,
                    'photo_url' => !empty($row['photo_url']) ? trim($row['photo_url']) : null,
                    'emergency_contact_name' => !empty($row['emergency_contact_name']) ? trim($row['emergency_contact_name']) : null,
                    'emergency_contact_phone' => !empty($row['emergency_contact_phone']) ? trim($row['emergency_contact_phone']) : null,
                    'blood_type' => $row['blood_type'] ?? 'Unknown',
                    'status' => $row['status'] ?? 'ACTIVE',
                ];

                if ($record) {
                    $record->update($payload);
                    $updated++;
                } else {
                    $payload['id'] = (string) Str::uuid();
                    Student::create($payload);
                    $created++;
                }
            } catch (\Throwable $e) {
                $errors[] = "Row #{$index}: " . $e->getMessage();
            }
        }

        return response()->json([
            'message' => "Import complete. Created: {$created}, Updated: {$updated}.",
            'created' => $created,
            'updated' => $updated,
            'errors' => $errors
        ]);
    }

    public function purgeMock(): JsonResponse
    {
        $mockNames = ['Sophia', 'Alexander', 'Isabella', 'Marcus', 'Chloe', 'Gabriel', 'Jasmine'];
        
        $deleted = Student::whereIn('first_name', $mockNames)
            ->orWhere('school_id', 'LIKE', '2024-1000%')
            ->delete();

        return response()->json([
            'message' => "Purged {$deleted} mock student records.",
            'deleted' => $deleted
        ]);
    }
}
