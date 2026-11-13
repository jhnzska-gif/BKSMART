import React from 'react';
import { APIService } from '../../services/api';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Building2, Award, Printer, Shield, CheckCircle2 } from 'lucide-react';

interface PrincipalDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ onNavigate }) => {
  const sessions = APIService.getCounselingSessions();
  const cases = APIService.getCases();
  const programs = APIService.getPrograms();
  const students = APIService.getStudents();

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const resolvedCases = cases.filter(c => c.status === 'selesai');
  const avgProgramCompletion = Math.round(
    programs.reduce((acc, p) => acc + p.completionPercentage, 0) / (programs.length || 1)
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-rose-950 text-white rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Dashboard Eksekutif Kepala Sekolah</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 font-mono font-medium">Monitoring & Evaluasi</span>
          </div>
          <p className="text-sm text-rose-100 mt-1 max-w-2xl">
            Ikhtisar capaian program kerja layanan bimbingan konseling, rekapitulasi penanganan kasus siswa, dan agregasi data manajerial.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Laporan BK</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('programs')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-900/80 hover:bg-rose-900 text-white text-xs font-semibold rounded-lg transition-colors border border-rose-800"
          >
            <Award className="w-4 h-4" />
            <span>Evaluasi Program Kerja</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tingkat Ketercapaian Program"
          value={`${avgProgramCompletion}%`}
          subtitle="4 Bidang Bimbingan Semester Ini"
          color="indigo"
          icon={<Award className="w-5 h-5" />}
        />
        <StatCard
          title="Layanan Konseling Selesai"
          value={completedSessions.length}
          subtitle={`Dari total ${sessions.length} pengajuan`}
          color="emerald"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          title="Kasus Terselesaikan"
          value={`${resolvedCases.length} / ${cases.length}`}
          subtitle="Tingkat mediasi & tindak lanjut"
          color="amber"
          icon={<Shield className="w-5 h-5" />}
        />
        <StatCard
          title="Peserta Didik Terlayani"
          value={`${students.length} Siswa`}
          subtitle="SMK Merdeka Nusantara"
          color="slate"
          icon={<Building2 className="w-5 h-5" />}
        />
      </div>

      {/* Visual Analytics Summary for Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ketercapaian per Bidang Bimbingan */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Distribusi Program Kerja Bimbingan Konseling</h3>
              <p className="text-xs text-slate-500">Status realisasi program bimbingan terpadu</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('programs')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-800"
            >
              Rincian Program →
            </button>
          </div>

          <div className="space-y-4">
            {programs.map((p) => (
              <div key={p.id} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 truncate max-w-[280px]">{p.title}</span>
                  <span className="font-mono font-medium text-slate-700">{p.completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.completionPercentage >= 70
                        ? 'bg-emerald-600'
                        : p.completionPercentage >= 30
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${p.completionPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Bidang: <strong className="capitalize">{p.domain}</strong></span>
                  <span>Jadwal: {p.scheduledMonth}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agregasi Kasus dan Pemantauan Tertutup */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pemantauan Penanganan Kasus Sekolah</h3>
              <p className="text-xs text-slate-500">Rekap status penanganan oleh tim Guru BK</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('cases')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-800"
            >
              Daftar Kasus →
            </button>
          </div>

          <div className="space-y-3">
            {cases.map((c) => (
              <div key={c.id} className="p-3 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{c.title}</span>
                  <Badge variant={c.priority === 'tinggi' ? 'crimson' : 'amber'}>
                    Prioritas {c.priority.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-slate-600 mt-1 line-clamp-1">{c.chronologySummary}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Siswa: <strong>{c.studentName}</strong> ({c.studentClass})</span>
                  <span>Penanggung Jawab: {c.assignedCounselorName}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong>Catatan Kebijakan:</strong> Sesuai Kode Etik Bimbingan & Konseling Nasional (ABKIN), detail catatan konseling bersifat konfidensial dan tidak dipublikasikan ke forum terbuka.
          </div>
        </div>
      </div>
    </div>
  );
};
