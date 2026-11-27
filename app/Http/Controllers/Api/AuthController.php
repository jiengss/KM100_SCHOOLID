<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $cleanEmail = strtolower(trim($validated['email']));

        $user = AdminUser::where('email', $cleanEmail)->first();

        if (!$user) {
            return response()->json(['message' => 'No administrator account found with this email.'], 404);
        }

        if ($user->status !== 'ACTIVE') {
            return response()->json(['message' => 'This admin account is currently inactive. Contact school administration.'], 403);
        }

        // Verify password with Hash::check, fallback to sha256 or plain
        $passwordMatch = Hash::check($validated['password'], $user->password_hash)
            || hash('sha256', $validated['password']) === $user->password_hash
            || $validated['password'] === $user->password_hash;

        if (!$passwordMatch) {
            return response()->json(['message' => 'Invalid password. Please check your credentials.'], 401);
        }

        $user->last_login = Carbon::now();
        $user->save();

        if ($request->hasSession()) {
            $request->session()->put('admin_user_id', $user->id);
        }

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->full_name,
            'role' => $user->role ?? 'admin',
            'status' => $user->status,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|max:150',
            'password' => 'required|string|min:6',
            'full_name' => 'required|string|max:150',
            'role' => 'nullable|string|max:50',
            'securityKey' => 'nullable|string',
        ]);

        // Security key check if provided
        $securityKey = trim($validated['securityKey'] ?? '');
        if ($securityKey && !in_array($securityKey, ['KM100-ADMIN-2024', 'KM100-2024', 'KM100-2025', 'KM100-2026'])) {
            return response()->json(['message' => 'Invalid Registration Passcode. Please contact the administrator.'], 403);
        }

        $cleanEmail = strtolower(trim($validated['email']));

        if (AdminUser::where('email', $cleanEmail)->exists()) {
            return response()->json(['message' => 'An administrator with this email is already registered.'], 422);
        }

        $user = AdminUser::create([
            'id' => (string) Str::uuid(),
            'email' => $cleanEmail,
            'password_hash' => Hash::make($validated['password']),
            'full_name' => trim($validated['full_name']),
            'role' => $validated['role'] ?? 'admin',
            'status' => 'ACTIVE',
            'last_login' => Carbon::now(),
        ]);

        if ($request->hasSession()) {
            $request->session()->put('admin_user_id', $user->id);
        }

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->full_name,
            'role' => $user->role,
            'status' => $user->status,
        ], 201);
    }

    public function me(Request $request): JsonResponse
    {
        if (!$request->hasSession()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $userId = $request->session()->get('admin_user_id');

        if (!$userId) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = AdminUser::find($userId);
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 401);
        }

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->full_name,
            'role' => $user->role,
            'status' => $user->status,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        if ($request->hasSession()) {
            $request->session()->forget('admin_user_id');
        }
        return response()->json(['message' => 'Logged out successfully.']);
    }
}
