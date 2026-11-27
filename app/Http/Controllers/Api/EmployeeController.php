<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Employee::query();

        if ($request->filled('role') && $request->role !== 'ALL') {
            $query->where('role', $request->role);
        }

        if ($request->filled('department') && $request->department !== 'ALL') {
            $query->where('department', $request->department);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                    ->orWhere('last_name', 'like', "%{$s}%")
                    ->orWhere('employee_id', 'like', "%{$s}%")
                    ->orWhere('position_title', 'like', "%{$s}%");
            });
        }

        $employees = $query->orderBy('last_name', 'asc')->get();

        return response()->json($employees);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|string|max:50|unique:employees,employee_id',
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'suffix' => 'nullable|string|max:20',
            'role' => 'required|string|in:INSTRUCTOR,STAFF,EMPLOYEE',
            'department' => 'nullable|string|max:150',
            'position_title' => 'nullable|string|max:150',
            'contact_number' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:150',
            'address' => 'nullable|string',
            'photo_url' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:150',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'blood_type' => 'nullable|string|max:10',
            'status' => 'nullable|string|max:20',
        ]);

        if (empty($validated['employee_id'])) {
            $year = Carbon::now()->format('Y');
            $prefix = match ($validated['role']) {
                'INSTRUCTOR' => 'INST',
                'STAFF' => 'STF',
                default => 'EMP',
            };
            $count = Employee::where('role', $validated['role'])->count() + 1;
            $validated['employee_id'] = sprintf('%s-%s-%04d', $prefix, $year, $count);
        }

        $validated['id'] = (string) Str::uuid();
        $validated['status'] = $validated['status'] ?? 'ACTIVE';

        $employee = Employee::create($validated);

        return response()->json($employee, 201);
    }

    public function show(string $id): JsonResponse
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found.'], 404);
        }
        return response()->json($employee);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found.'], 404);
        }

        $validated = $request->validate([
            'employee_id' => 'nullable|string|max:50|unique:employees,employee_id,' . $employee->id,
            'first_name' => 'sometimes|required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'suffix' => 'nullable|string|max:20',
            'role' => 'sometimes|required|string|in:INSTRUCTOR,STAFF,EMPLOYEE',
            'department' => 'nullable|string|max:150',
            'position_title' => 'nullable|string|max:150',
            'contact_number' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:150',
            'address' => 'nullable|string',
            'photo_url' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:150',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'blood_type' => 'nullable|string|max:10',
            'status' => 'nullable|string|max:20',
        ]);

        $employee->update($validated);

        return response()->json($employee);
    }

    public function destroy(string $id): JsonResponse
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found.'], 404);
        }

        $employee->delete();

        return response()->json(['message' => 'Employee deleted successfully.']);
    }
}

