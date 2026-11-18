# 🎓 KM100 School ID Scanner & Attendance Kiosk System

A real-time School ID verification and attendance tracking kiosk system built with **React.js** (Vite + Tailwind CSS) and **Supabase PostgreSQL**.

---

## 🚀 Key Features

1. **Tap & Go Screen Display (Kiosk Mode)**:
   - Live Digital Clock & Date header.
   - Large pulsing scanner radar ready for scans.
   - Instant visual identification: Displays high-res Student Photo, Full Name, Grade Level & Section, Course/Strand, and Emergency Contact upon tapping.
   - Distinct verified states:
     - 🟢 **TIME IN**: Green glowing status, "Welcome to Campus!", celebratory chime, and confetti.
     - 🔵 **TIME OUT**: Indigo glowing status, "Goodbye & safe trip home!", departure chime.
     - 🔴 **UNRECOGNIZED ID**: Audio buzzer alert with instructions to report to the registrar.
   - Auto-reset countdown (5 seconds) with progress bar before returning to the ready state.
   - Real-time side stream displaying recent taps with live campus headcount.

2. **Scanner Versatility**:
   - 🔌 **Physical Hardware USB / Bluetooth Scanner**: Supports any standard handheld laser barcode scanner or RFID/NFC keyboard wedge reader (auto-detects rapid input and Enter key globally without requiring cursor focus).
   - 📷 **Webcam / Device Camera Scanner**: Built-in camera scanner with real-time laser target box for barcodes & QR codes.
   - ⌨️ **Manual Entry & Quick Demo**: Type or paste any ID, or tap one-click demo test buttons.

3. **Supabase PostgreSQL Backend**:
   - `students` table: Unique school IDs, RFID card UIDs, personal info, photos, and emergency contacts.
   - `attendance_logs` table: Stores every scan event with timestamps, gate/kiosk identifier, and IN/OUT status.
   - Row Level Security (RLS) policies for kiosk security.
   - Realtime enabled on both tables.
   - Fallback to browser local database if offline or testing before Supabase setup.

4. **Digital & Printable ID Card Generator**:
   - Generates official PVC-style School ID badges with school header, student photo, details, Code128 Barcode, and QR Code.
   - One-click print button formatted for ID card or A4 paper printers.

5. **Attendance Reports & Audit Trail**:
   - Filter logs by date and Time In vs Time Out.
   - Search by student name or school ID.
   - One-click **Export to CSV**.

---

## 🛠️ Getting Started

### 1. Start the React Frontend
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Setting Up Supabase Backend

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In your Supabase dashboard, click **SQL Editor** on the left menu.
3. Open `supabase/schema.sql` (or copy it from the in-app Supabase Setup modal) and paste it into the SQL Editor.
4. Click **Run** to create the tables, indexes, RLS policies, and sample students.
5. In your Supabase project, navigate to **Project Settings > API**:
   - Copy **Project URL**
   - Copy **anon / public key**
6. In the app, click the **Supabase Setup** button in the top navigation bar, paste your URL and Key, and click **Save & Connect**!

*(Alternatively, you can create a `.env` file from `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)*.

---

## 🧑‍🎓 Sample Pre-seeded Demo School IDs (NC II Technology Programs)

| Student Name | School ID | RFID UID | Year & Section | NC II Technology Course |
|---|---|---|---|---|
| Sophia Marie Rodriguez | `2024-10001` | `RFID-99101` | 1st Year (CET-1A) | Computer Engineering Technology (NC II) |
| Alexander James Chen | `2024-10002` | `RFID-99102` | 2nd Year (HT-2B) | Hospitality Technology (NC II) |
| Isabella Grace Santos | `2024-10003` | `RFID-99103` | 1st Year (EET-1A) | Electrical Engineering Technology (NC II) |
| Marcus Daniel Johnson | `2024-10004` | `RFID-99104` | 2nd Year (ECET-2A) | Electronics Engineering Technology (NC II) |
| Chloe Anne Taylor | `2024-10005` | `RFID-99105` | 1st Year (TT-1A) | Tourism Technology (NC II) |
| Gabriel Cruz Velasco | `2024-10006` | `RFID-99106` | 2nd Year (CAT-2A) | Culinary Arts Technology (NC II) |
| Jasmine Rose Flores | `2024-10007` | `RFID-99107` | 1st Year (ROT-1B) | Restaurant Operations Technology (NC II) |

---

## 🖨️ How to Test Scanning

1. **Using Your Screen**:
   - Open the **Students Directory** tab and click the **Credit Card icon** on any student to view their digital badge.
   - Point your physical USB barcode scanner or phone camera scanner at the barcode or QR code on the screen!
2. **Using the Webcam**:
   - On the Tap Kiosk screen, click **Open Camera Scanner** and hold up a barcode or phone screen.
3. **Using Quick Tap Simulator**:
   - Click **Enter ID Manually** and select any demo student card to simulate an instant swipe!
