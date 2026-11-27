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
        if (!Schema::hasTable('employees')) {
            Schema::create('employees', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('employee_id')->unique();
                $table->string('first_name');
                $table->string('middle_name')->nullable();
                $table->string('last_name');
                $table->string('suffix')->nullable();
                $table->string('role')->default('EMPLOYEE'); // INSTRUCTOR, STAFF, EMPLOYEE
                $table->string('department')->nullable();
                $table->string('position_title')->nullable();
                $table->string('contact_number')->nullable();
                $table->string('email')->nullable();
                $table->text('address')->nullable();
                $table->longText('photo_url')->nullable();
                $table->string('emergency_contact_name')->nullable();
                $table->string('emergency_contact_phone')->nullable();
                $table->string('blood_type')->nullable();
                $table->string('status')->default('ACTIVE');
                $table->timestamps();
            });
        }

        Schema::table('attendance_logs', function (Blueprint $table) {
            if (Schema::hasColumn('attendance_logs', 'student_id')) {
                $table->uuid('student_id')->nullable()->change();
            }
            if (!Schema::hasColumn('attendance_logs', 'employee_id')) {
                $table->uuid('employee_id')->nullable()->after('student_id');
                $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            }
            if (!Schema::hasColumn('attendance_logs', 'person_type')) {
                $table->string('person_type')->default('STUDENT')->after('id'); // STUDENT or EMPLOYEE
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            if (Schema::hasColumn('attendance_logs', 'employee_id')) {
                $table->dropForeign(['employee_id']);
                $table->dropColumn('employee_id');
            }
            if (Schema::hasColumn('attendance_logs', 'person_type')) {
                $table->dropColumn('person_type');
            }
        });

        Schema::dropIfExists('employees');
    }
};

