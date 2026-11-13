import React, { useState } from 'react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Shield,
  UserCheck,
  GraduationCap,
  Building2,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Info
} from 'lucide-react';

interface RoleDetail {
  role: UserRole;
  title: string;
  badge: string;
  username: string;
  passwordDefault: string;
  name: string;
  nipNisn: string;
  assignedClass?: string;
  themeColor: {
    primary: string;
    bgLight: string;
    border: string;
    textDark: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
  };
  description: string;
  permissions: string[];
}

export const ROLE_DETAILS: Record<UserRole, RoleDetail> = {
  counselor: {
    role: 'counselor',
    title: 'Guru BK (Konselor Sekolah)',
    badge: 'Akses Konseling Penuh',
    username: 'gurubk',
    passwordDefault: 'bk123',
    name: 'Siti Rahmawati, S.Pd., Kons.',
    nipNisn: 'NIP. 198509152010012015',
    themeColor: {
      primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      bgLight: 'bg-emerald-50/80',
      border: 'border-emerald-300',
      textDark: 'text-emerald-950',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      accent: 'emerald',
    },
    description:
      'Penanggung jawab utama layanan bimbingan konseling pribadi, sosial, belajar, karier, intervensi kasus, asesmen non-kognitif, dan kerahasiaan catatan konseling.',
    permissions: [
      'Pencatatan konseling individual, kelompok & kunjungan rumah',
      'Akses eksklusif catatan konseling privat & konfidensial',
      'Pengelolaan asesmen diagnostik gaya belajar (VAK & AKPD)',
      'Penanganan rujukan wali kelas & tindak lanjut kasus siswa',
    ],
  },
  admin: {
    role: 'admin',
    title: 'Administrator Sistem',
    badge: 'Pengelola Master Data & Sistem',
    username: 'admin',
    passwordDefault: 'admin123',
    name: 'Drs. Bambang Hidayat, M.Kom',
    nipNisn: 'NIP. 197805122003121002',
    themeColor: {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      bgLight: 'bg-indigo-50/80',
      border: 'border-indigo-300',
      textDark: 'text-indigo-950',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-800',
      accent: 'indigo',
    },
    description:
      'Mengelola data master civitas sekolah, konfigurasi akun pengguna 5 peran, rombel kelas, import/export data CSV, serta pengawasan keamanan melalui audit log.',
    permissions: [
      'Manajemen akun pengguna & pembagian 5 peran (RBAC)',
      'Kelola data siswa, guru, kelas, jurusan & tahun ajaran',
      'Import dan export batch data siswa berformat CSV/Excel',
      'Pengawasan jejak aktivitas audit log keamanan sistem',
    ],
  },
  teacher: {
    role: 'teacher',
    title: 'Guru / Wali Kelas',
    badge: 'Pemantau Siswa Binaan',
    username: 'walikelas',
    passwordDefault: 'wali123',
    name: 'Ahmad Fauzi, S.Pd.',
    nipNisn: 'NIP. 198802202015041003',
    assignedClass: 'Wali Kelas XI RPL 1',
    themeColor: {
      primary: 'bg-amber-600 hover:bg-amber-700 text-white',
      bgLight: 'bg-amber-50/80',
      border: 'border-amber-300',
      textDark: 'text-amber-950',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      accent: 'amber',
    },
    description:
      'Mengawasi perkembangan dan kedisiplinan siswa di kelas binaan, mengidentifikasi kendala belajar atau perilaku, serta mengajukan rujukan ke Guru BK.',
    permissions: [
      'Melihat daftar dan profil siswa binaan di kelas XI RPL 1',
      'Mengajukan rujukan konseling siswa ke Guru BK secara resmi',
      'Memantau status penanganan rujukan dan tindak lanjut',
      'Koordinasi pendampingan belajar bersama konselor',
    ],
  },
  student: {
    role: 'student',
    title: 'Siswa (Peserta Didik)',
    badge: 'Layanan Bimbingan Siswa',
    username: 'siswa',
    passwordDefault: 'siswa123',
    name: 'Rizky Pratama',
    nipNisn: 'NISN. 0067829102',
    assignedClass: 'Kelas XI RPL 1',
    themeColor: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      bgLight: 'bg-blue-50/80',
      border: 'border-blue-300',
      textDark: 'text-blue-950',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800',
      accent: 'blue',
    },
    description:
      'Mendapatkan layanan bimbingan konseling yang ramah dan suportif, mengajukan jadwal konseling mandiri, mengerjakan asesmen minat, serta membaca materi BK.',
    permissions: [
      'Pengajuan jadwal temu konseling secara mandiri & terjadwal',
      'Mengerjakan kuesioner asesmen diagnostik gaya belajar (VAK)',
      'Melihat hasil pemetaan rekomendasi belajar dari Guru BK',
      'Mengunduh lembar kerja dan membaca modul edukasi BK',
    ],
  },
  principal: {
    role: 'principal',
    title: 'Kepala Sekolah',
    badge: 'Pimpinan & Evaluasi Manajerial',
    username: 'kepsek',
    passwordDefault: 'kepsek123',
    name: 'Dr. H. Mulyono, M.Pd.',
    nipNisn: 'NIP. 196904121994031001',
    themeColor: {
      primary: 'bg-rose-700 hover:bg-rose-800 text-white',
      bgLight: 'bg-rose-50/80',
      border: 'border-rose-300',
      textDark: 'text-rose-950',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-800',
      accent: 'rose',
    },
    description:
      'Melihat ringkasan eksekutif, mengevaluasi capaian program bimbingan konseling semesteran, meninjau statistik kasus siswa, dan mengesahkan laporan berkala.',
    permissions: [
      'Dashboard eksekutif visual statistik konseling & sebaran kasus',
      'Pemantauan ketercapaian program kerja 4 bidang BK',
      'Rekapitulasi berkala layanan tanpa catatan privat siswa',
      'Cetak dan validasi laporan resmi Bimbingan Konseling',
    ],
  },
};

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('counselor');
  const [username, setUsername] = useState(ROLE_DETAILS.counselor.username);
  const [password, setPassword] = useState(ROLE_DETAILS.counselor.passwordDefault);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // When user switches role tab, update form with default demo credentials
  const handleSelectRoleTab = (r: UserRole) => {
    setSelectedRole(r);
    setUsername(ROLE_DETAILS[r].username);
    setPassword(ROLE_DETAILS[r].passwordDefault);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Silakan masukkan username pengguna.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      const success = login(username.trim(), selectedRole);
      if (!success) {
        setErrorMessage(
          'Username atau kata sandi tidak sesuai. Silakan pilih salah satu peran demo di bawah untuk masuk otomatis.'
        );
        setIsLoading(false);
      }
    }, 250);
  };

  const handleInstantQuickLogin = (r: UserRole) => {
    setIsLoading(true);
    setSelectedRole(r);
    setUsername(ROLE_DETAILS[r].username);
    setPassword(ROLE_DETAILS[r].passwordDefault);
    setTimeout(() => {
      login(ROLE_DETAILS[r].username, r);
    }, 150);
  };

  const currentRoleInfo = ROLE_DETAILS[selectedRole];

  const getRoleIcon = (role: UserRole, className: string = 'w-5 h-5') => {
    switch (role) {
      case 'counselor':
        return <BookOpen className={className} />;
      case 'admin':
        return <Shield className={className} />;
      case 'teacher':
        return <UserCheck className={className} />;
      case 'student':
        return <GraduationCap className={className} />;
      case 'principal':
        return <Building2 className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-emerald-950">
              BK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  BKSmart
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  SMK Merdeka Nusantara
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Platform Digital Bimbingan Konseling Sekolah Berbasis 5 Peran (RBAC)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Sistem Terenkripsi & Mematuhi Kode Etik BK</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pilih Peran Akun Anda untuk Masuk ke Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Menu Masuk Multi-Peran BKSmart
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Silakan pilih peran pengguna di bawah ini untuk mengakses ruang kerja, hak wewenang, dan layanan bimbingan konseling yang sesuai.
          </p>
        </div>

        {/* 5-Role Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-8">
          {(Object.keys(ROLE_DETAILS) as UserRole[]).map((r) => {
            const isSelected = selectedRole === r;
            const item = ROLE_DETAILS[r];
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleSelectRoleTab(r)}
                className={`flex flex-col items-start text-left p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-800/95 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/40 translate-y-[-2px]'
                    : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800/70 hover:border-slate-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/20 rounded-bl-xl flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-700/70 text-slate-300'
                  }`}
                >
                  {getRoleIcon(r, 'w-4 h-4')}
                </div>
                <div className="w-full">
                  <span className="block font-bold text-xs sm:text-sm text-white truncate">
                    {item.title.split(' (')[0]}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    @{item.username}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Role Showcase & Login Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Role Overview & Permissions (5 or 6 cols) */}
          <div className="lg:col-span-5 bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between backdrop-blur-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${currentRoleInfo.themeColor.badgeBg} ${currentRoleInfo.themeColor.badgeText}`}>
                  {currentRoleInfo.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Role: <strong className="text-white uppercase">{selectedRole}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <div className="w-12 h-12 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  {getRoleIcon(selectedRole, 'w-6 h-6')}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {currentRoleInfo.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {currentRoleInfo.nipNisn}
                    {currentRoleInfo.assignedClass && ` · ${currentRoleInfo.assignedClass}`}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                {currentRoleInfo.description}
              </p>

              <div className="mt-5 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Wewenang & Cakupan Akses Role:</span>
                </h3>
                <ul className="space-y-2">
                  {currentRoleInfo.permissions.map((perm, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                <span>Kredensial Demo:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {currentRoleInfo.username} / {currentRoleInfo.passwordDefault}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Login Form (7 cols) */}
          <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Masuk Sebagai {currentRoleInfo.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gunakan kredensial bawaan atau isi nama pengguna terdaftar
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Lock className="w-5 h-5 text-slate-600" />
                </div>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Gagal Masuk</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pengguna (Username)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Contoh: gurubk / admin / walikelas"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono text-slate-800 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kata Sandi (Password)
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Bawaan: {currentRoleInfo.passwordDefault}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-800 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 py-3 px-4 font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                      currentRoleInfo.themeColor.primary
                    } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <span>Memproses Masuk...</span>
                    ) : (
                      <>
                        <span>Masuk Sebagai {currentRoleInfo.title.split(' (')[0]}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInstantQuickLogin(selectedRole)}
                    className="py-3 px-4 font-semibold text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors shrink-0 flex items-center justify-center gap-1.5"
                    title="Masuk seketika tanpa harus klik tombol formulir"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>1-Klik Cepat</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Helper for other roles */}
            <div className="mt-8 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Atau Masuk Instan ke Role Lainnya:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(ROLE_DETAILS) as UserRole[]).map((r) => {
                  if (r === selectedRole) return null;
                  const item = ROLE_DETAILS[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleInstantQuickLogin(r)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                    >
                      {getRoleIcon(r, 'w-3 h-3 text-slate-500')}
                      <span>{item.title.split(' (')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Informative Footer & Security Notice */}
        <div className="mt-10 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              <strong>Kepatuhan Etika Bimbingan Konseling:</strong> Setiap sesi konseling, asesmen gaya belajar, dan penanganan kasus dilindungi oleh sistem otorisasi RBAC 5 peran. Catatan privat konseling dilindungi dan tidak ditampilkan pada laporan umum.
            </p>
          </div>
          <span className="text-[10px] text-slate-500 font-mono shrink-0">
            BKSmart v1.0 · Build 2026
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>© 2026 SMK Merdeka Nusantara — Platform Bimbingan Konseling Digital Terpadu.</p>
      </footer>
    </div>
  );
};
