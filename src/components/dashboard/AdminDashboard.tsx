import React from 'react';
import { APIService } from '../../services/api';
import { StatCard } from '../common/StatCard';
import { Users, GraduationCap, School, ShieldCheck, Database, Server, Clock, PlusCircle } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const users = APIService.getUsers();
  const students = APIService.getStudents();
  const teachers = APIService.getTeachers();
  const classes = APIService.getClasses();
  const auditLogs = APIService.getAuditLogs().slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Dashboard Administrator</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">RBAC Active</span>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            Kelola data master civitas sekolah, akun pengguna 5 peran, sinkronisasi PostgreSQL, dan pengawasan audit sistem.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('students')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Kelola Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('users')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
          >
            <Users className="w-4 h-4" />
            <span>Manajemen Pengguna</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Siswa Terdaftar"
          value={students.length}
          subtitle="Tahun Ajaran 2024/2025"
          color="indigo"
          icon={<GraduationCap className="w-5 h-5" />}
        />
        <StatCard
          title="Guru & Tenaga BK"
          value={teachers.length}
          subtitle="2 Guru BK, 3 Wali Kelas"
          color="emerald"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Rombongan Belajar (Kelas)"
          value={classes.length}
          subtitle="Tingkat X, XI, XII"
          color="amber"
          icon={<School className="w-5 h-5" />}
        />
        <StatCard
          title="Pengguna Sistem Aktif"
          value={users.filter(u => u.active).length}
          subtitle="5 Role Akses Terkonfigurasi"
          color="slate"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
      </div>

      {/* Operational & Data Security Status Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Status Operasional & Keamanan Sistem BKSmart</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 font-medium mb-1">
              <span>Keamanan & Hak Akses</span>
              <span className="text-emerald-700 font-semibold">Aktif</span>
            </div>
            <p className="font-semibold text-slate-800">RBAC 5 Role & Proteksi Catatan Privat</p>
            <p className="text-[11px] text-slate-500 mt-1">Catatan rahasia siswa hanya dapat diakses Guru BK & Admin berwenang</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 font-medium mb-1">
              <span>Kelengkapan Master Data</span>
              <span className="text-emerald-700 font-semibold">Lengkap</span>
            </div>
            <p className="font-semibold text-slate-800">Siswa, Rombel, & Penugasan Wali Kelas</p>
            <p className="text-[11px] text-slate-500 mt-1">Dukungan pagination, seleksi multi-delete, dan export/import CSV</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 font-medium mb-1">
              <span>Alur Layanan & Audit Trail</span>
              <span className="text-indigo-700 font-semibold">Tercatat</span>
            </div>
            <p className="font-semibold text-slate-800">Rujukan Masuk & Monitoring Kasus</p>
            <p className="text-[11px] text-slate-500 mt-1">Seluruh mutasi data dan aksi sensitif tercatat di log audit otomatis</p>
          </div>
        </div>
      </div>

      {/* Lower Row: Recent Audits & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Aktivitas Audit Keamanan Terakhir</h3>
              <p className="text-xs text-slate-500">Mencatat autentikasi, akses rekam medis/kasus, dan mutasi data.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('audit_logs')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Lihat Semua Log →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{log.userName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-mono">
                      {log.userRole}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 font-mono">[{log.action}]</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{log.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Nav Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Aksi Cepat Admin</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <p className="text-xs font-semibold text-slate-900">Master Data Siswa</p>
              <p className="text-[11px] text-slate-500">Tambah siswa baru atau perbarui biodata</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('academic')}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <p className="text-xs font-semibold text-slate-900">Kelas, Jurusan & Tahun Ajaran</p>
              <p className="text-[11px] text-slate-500">Atur struktur rombel dan semester aktif</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('import_export')}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <p className="text-xs font-semibold text-slate-900">Import / Export CSV Data</p>
              <p className="text-[11px] text-slate-500">Unduh template CSV atau ekspor data siswa</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
