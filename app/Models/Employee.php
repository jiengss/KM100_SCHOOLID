<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'employees';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'employee_id',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'role', // INSTRUCTOR, STAFF, EMPLOYEE
        'department',
        'position_title',
        'contact_number',
        'email',
        'address',
        'photo_url',
        'emergency_contact_name',
        'emergency_contact_phone',
        'blood_type',
        'status',
    ];

    public function attendanceLogs(): HasMany
    {
        return $this->hasMany(AttendanceLog::class, 'employee_id', 'id');
    }
}

