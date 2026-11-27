<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'students';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'school_id',
        'rfid_uid',
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'grade_level',
        'section',
        'course_strand',
        'email',
        'contact_number',
        'photo_url',
        'emergency_contact_name',
        'emergency_contact_phone',
        'blood_type',
        'status',
    ];

    public function attendanceLogs(): HasMany
    {
        return $this->hasMany(AttendanceLog::class, 'student_id', 'id');
    }
}
