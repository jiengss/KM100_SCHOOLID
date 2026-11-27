<?php

namespace Tests\Feature;

use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolIdSystemTest extends TestCase
{
    use RefreshDatabase;
    public function test_health_check_returns_success(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'backend' => 'Laravel (Laragon MySQL)',
            ]);
    }

    public function test_can_create_and_scan_student(): void
    {
        $studentData = [
            'school_id' => '2026-TEST01',
            'rfid_uid' => 'RFID-TEST01',
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'course_strand' => 'Computer Engineering Technology (NC II)',
            'section' => 'CET-1A',
            'grade_level' => '1st Year',
        ];

        // 1. Create Student
        $createResponse = $this->postJson('/api/students', $studentData);
        $createResponse->assertStatus(201)
            ->assertJsonFragment(['school_id' => '2026-TEST01']);

        $studentId = $createResponse->json('id');

        // 2. Scan by School ID
        $scanResponse = $this->getJson('/api/students/scan/2026-TEST01');
        $scanResponse->assertStatus(200)
            ->assertJsonFragment(['first_name' => 'Juan']);

        // 3. Scan by RFID UID
        $scanRfidResponse = $this->getJson('/api/students/scan/RFID-TEST01');
        $scanRfidResponse->assertStatus(200)
            ->assertJsonFragment(['first_name' => 'Juan']);

        // 4. Record Attendance
        $attendanceResponse = $this->postJson('/api/attendance', [
            'student_id' => $studentId,
            'school_id' => '2026-TEST01',
            'log_type' => 'IN',
            'gate_station' => 'Main Gate Kiosk',
        ]);
        $attendanceResponse->assertStatus(201)
            ->assertJsonFragment(['log_type' => 'IN']);

        // 5. Clean up test record
        $this->deleteJson('/api/students/' . $studentId)->assertStatus(200);
    }

    public function test_can_create_and_scan_employee(): void
    {
        $employeeData = [
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'role' => 'INSTRUCTOR',
            'department' => 'Academic Faculty',
            'position_title' => 'Senior Instructor',
            'email' => 'maria.santos@km100.edu.ph',
        ];

        // 1. Create Employee (Auto ID generated)
        $createResponse = $this->postJson('/api/employees', $employeeData);
        $createResponse->assertStatus(201)
            ->assertJsonFragment(['first_name' => 'Maria'])
            ->assertJsonFragment(['role' => 'INSTRUCTOR']);

        $employeeId = $createResponse->json('id');
        $generatedCode = $createResponse->json('employee_id');

        // 2. Scan via unified /api/scan/{value}
        $scanResponse = $this->getJson('/api/scan/' . $generatedCode);
        $scanResponse->assertStatus(200)
            ->assertJsonFragment(['person_type' => 'EMPLOYEE'])
            ->assertJsonFragment(['first_name' => 'Maria']);

        // 3. Record Employee Attendance
        $attendanceResponse = $this->postJson('/api/attendance', [
            'person_type' => 'EMPLOYEE',
            'employee_id' => $employeeId,
            'school_id' => $generatedCode,
            'log_type' => 'IN',
            'gate_station' => 'Main Gate Kiosk',
        ]);
        $attendanceResponse->assertStatus(201)
            ->assertJsonFragment(['person_type' => 'EMPLOYEE']);

        // 4. Delete Employee
        $this->deleteJson('/api/employees/' . $employeeId)->assertStatus(200);
    }

    public function test_admin_auth_flow(): void
    {
        $adminData = [
            'email' => 'admin_test@km100.edu.ph',
            'password' => 'password123',
            'full_name' => 'Test Admin',
            'role' => 'admin',
            'securityKey' => 'KM100-ADMIN-2024',
        ];

        // Register
        $regResponse = $this->postJson('/api/auth/register', $adminData);
        $regResponse->assertStatus(201)
            ->assertJsonFragment(['email' => 'admin_test@km100.edu.ph']);

        // Login
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'admin_test@km100.edu.ph',
            'password' => 'password123',
        ]);
        $loginResponse->assertStatus(200)
            ->assertJsonFragment(['email' => 'admin_test@km100.edu.ph']);
    }

    public function test_frontend_home_page_renders_with_root(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertSee('<div id="root"></div>', false);
    }
}
