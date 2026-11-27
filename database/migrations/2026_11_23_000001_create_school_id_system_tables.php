<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Students Table
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('school_id', 50)->unique();
            $table->string('rfid_uid', 100)->nullable()->unique();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('gender', 20)->default('Unspecified');
            $table->string('grade_level', 50)->default('N/A');
            $table->string('section', 50)->default('N/A');
            $table->string('course_strand', 150)->default('Computer Engineering Technology (NC II)');
            $table->string('email', 150)->nullable();
            $table->string('contact_number', 30)->nullable();
            $table->longText('photo_url')->nullable();
            $table->string('emergency_contact_name', 150)->nullable();
            $table->string('emergency_contact_phone', 50)->nullable();
            $table->string('blood_type', 10)->default('Unknown');
            $table->string('status', 30)->default('ACTIVE');
            $table->timestamps();

            $table->index('school_id');
            $table->index('rfid_uid');
            $table->index('status');
        });

        // 2. Attendance Logs Table
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->string('school_id', 50);
            $table->string('log_type', 10); // 'IN' or 'OUT'
            $table->dateTime('timestamp');
            $table->string('gate_station', 100)->default('Main Gate Kiosk');
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->index('school_id');
            $table->index('timestamp');
            $table->index('student_id');
        });

        // 3. Admin Users Table
        Schema::create('admin_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email', 150)->unique();
            $table->string('password_hash', 255);
            $table->string('full_name', 150);
            $table->string('role', 50)->default('admin');
            $table->string('status', 30)->default('ACTIVE');
            $table->dateTime('last_login')->nullable();
            $table->timestamps();

            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_logs');
        Schema::dropIfExists('students');
        Schema::dropIfExists('admin_users');
    }
};
