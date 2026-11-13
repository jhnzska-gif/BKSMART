# BKSmart — Platform Digital Bimbingan Konseling Sekolah

BKSmart adalah aplikasi web modern, profesional, dan aman untuk mengelola seluruh ekosistem layanan bimbingan konseling sekolah sesuai regulasi dan kode etik profesi konselor Indonesia.

---

## 1. Arsitektur & Teknologi

- **Frontend**: React 19 + TypeScript + Tailwind CSS (Vite / Nginx)
- **Backend**: Golang 1.22 REST API (Gorilla Mux, JWT Auth, RBAC Middleware)
- **Database**: PostgreSQL 16 Alpine
- **Container**: Docker & Docker Compose (Dioptimalkan untuk Docker Desktop di Windows)

---

## 2. Hak Akses 5 Role Pengguna (RBAC)

1. **Admin (`admin`)**:
   - Mengelola master pengguna (User), data siswa, data guru, rombel kelas, jurusan, dan tahun ajaran.
   - Mengawasi jejak audit sistem (*Audit Logs*) dan menjalankan sinkronisasi data via CSV.
2. **Guru BK / Konselor (`gurubk`)**:
   - Menjadwalkan dan mencatat layanan konseling (individual, kelompok, klasikal, kunjungan rumah).
   - Mengakses **catatan konseling privat rahasia** yang terlindungi dari pihak luar.
   - Mengelola bimbingan kasus, rujukan masuk dari wali kelas, program BK 4 bidang, dan asesmen kuesioner.
3. **Guru / Wali Kelas (`walikelas`)**:
   - Memantau siswa di kelas binaan (misal: XI RPL 1).
   - Mengajukan formulir rujukan (*referral*) peserta didik yang membutuhkan penanganan BK beserta alasannya.
   - Memantau status tindak lanjut rujukan tanpa melanggar catatan rahasia siswa.
4. **Siswa (`siswa`)**:
   - Mengajukan permohonan sesi konseling mandiri.
   - Mengisi kuesioner asesmen diagnostik non-kognitif (Gaya Belajar VAK, AKPD) dan menerima rekomendasi strategi belajar.
   - Membaca materi bimbingan dan mengumpulkan lembar kerja refleksi.
5. **Kepala Sekolah (`kepsek`)**:
   - Memantau dashboard eksekutif ketercapaian program tahunan BK.
   - Melihat rekapitulasi penanganan kasus secara agregat dan persentase penyelesaian.
   - Mencetak laporan resmi berkala untuk dinas/rapat evaluasi sekolah.

---

## 3. Cara Menjalankan dengan Docker Desktop di Windows

### A. Prasyarat di Windows:
1. Pasang [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
2. Pastikan opsi **WSL 2 based engine** telah diaktifkan di pengaturan Docker Desktop.
3. Pastikan status Docker Desktop berstatus **Running** (ikon paus hijau pada taskbar Windows).

### B. Langkah Menjalankan:
Buka **PowerShell**, **Command Prompt**, atau **Windows Terminal**, lalu jalankan:

```powershell
# 1. Pastikan docker compose aktif
docker compose version

# 2. Bangun dan jalankan seluruh container
docker compose up --build -d

# 3. Periksa status ketiga kontainer
docker compose ps
```

Anda akan melihat 3 kontainer aktif:
- `bksmart_frontend` (Port 3000)
- `bksmart_backend` (Port 8080)
- `bksmart_db` (Port 5432)

### C. Akses Aplikasi di Windows Browser:
- **Aplikasi Web**: Buka `http://localhost:3000` di Google Chrome atau Microsoft Edge.
- **Backend Health Check**: Buka `http://localhost:8080/api/health`.

### D. Menghentikan Kontainer:
```powershell
docker compose down
```

---

## 4. Akun Uji Bawaan (Default Credentials)

| Role | Username | Password | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Administrator Sekolah |
| **Guru BK** | `gurubk` | `bk123` | Siti Rahmawati, S.Pd., Kons. |
| **Wali Kelas** | `walikelas` | `wali123` | Ahmad Fauzi, S.Pd. (XI RPL 1) |
| **Siswa** | `siswa` | `siswa123` | Rizky Pratama (XI RPL 1) |
| **Kepala Sekolah** | `kepsek` | `kepsek123` | Dr. H. Mulyono, M.Pd. |

*Tersedia juga fitur Quick Switcher 1-klik di bagian atas antarmuka aplikasi.*

---

## 5. Struktur Direktori Proyek

```
/
├── backend/                  # Golang REST API Service
│   ├── config/               # Konfigurasi Environment & Port
│   ├── handlers/             # REST Endpoints & Controller
│   ├── middleware/           # JWT Authentication & RBAC Security
│   ├── models/               # Struct Data PostgreSQL
│   ├── Dockerfile            # Multi-stage Golang Alpine Dockerfile
│   ├── go.mod                # Go Modules
│   └── main.go               # HTTP Router & Server Entrypoint
├── database/                 # Skema & Migrasi Database
│   ├── migrations/           # 001_initial_schema.sql (DDL PostgreSQL)
│   └── seeds/                # 001_seed_data.sql (Seed Data SMK)
├── src/                      # React Frontend Source Code
│   ├── components/
│   │   ├── audit/            # Audit Log Viewer
│   │   ├── cases/            # Bimbingan Kasus & Intervensi
│   │   ├── common/           # Modal, ConfirmDialog, Badge, StatCard
│   │   ├── counseling/       # Sesi Konseling & Rujukan Wali Kelas
│   │   ├── dashboard/        # 5 Dashboard Peran (Admin, BK, Guru, Siswa, Kepsek)
│   │   ├── data/             # Manajemen Siswa, Pengguna, Guru, Kelas
│   │   ├── docker-guide/     # Modal Panduan Windows Docker Desktop
│   │   ├── import-export/    # Import CSV, Export CSV, Unduh Template
│   │   ├── layout/           # Navbar & Sidebar
│   │   └── programs/         # Program BK, Asesmen VAK/AKPD, Materi BK
│   ├── context/              # AuthContext & RBAC Permissions
│   ├── services/             # API Client & Persistent Store Engine
│   ├── types/                # TypeScript Interfaces & Types
│   ├── App.tsx               # Root App Component
│   ├── index.css             # Tailwind v4 & Print Styles
│   └── main.tsx              # React DOM Root
├── Dockerfile                # Multi-stage React Frontend (Nginx)
├── docker-compose.yml        # Orkestrasi Docker (DB, Backend, Frontend)
└── package.json              # Frontend Dependencies
```

---

## 6. Prinsip Keamanan & Privasi

1. **Perlindungan Catatan Privat**: Catatan konseling individu (*confidential notes*) dan rincian sensitif penyelidikan kasus dilindungi ketat dan hanya dapat dibuka oleh akun Guru BK.
2. **Redaksi Laporan Umum**: Laporan umum eksekutif untuk Kepala Sekolah menyajikan angka agregat tanpa memuat catatan pribadi siswa.
3. **Audit Log Otomatis**: Setiap aksi mutasi data, penghapusan, atau pembukaan rekam medis tercatat lengkap dengan identitas pengguna, cap waktu (*timestamp*), dan modul.
