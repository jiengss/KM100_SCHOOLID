<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        AdminUser::firstOrCreate(
            ['email' => 'admin@km100.edu.ph'],
            [
                'id' => (string) Str::uuid(),
                'password_hash' => Hash::make('admin123'),
                'full_name' => 'KM100 Head Administrator',
                'role' => 'super_admin',
                'status' => 'ACTIVE',
            ]
        );
    }
}
