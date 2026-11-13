import React from 'react';
import { APIService } from '../../services/api';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Calendar, Clock, AlertTriangle, Send, PlusCircle, CheckCircle2 } from 'lucide-react';

interface CounselorDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const CounselorDashboard: React.FC<CounselorDashboardProps> = ({ onNavigate }) => {
  const sessions = APIService.getCounselingSessions();
  const referrals = APIService.getReferrals();
  const cases = APIService.getCases();
  const programs = APIService.getPrograms();

  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');
  const pendingReferrals = referrals.filter(r => r.status === 'pending');
  const activeCases = cases.filter(c => c.status !== 'selesai');
  const avgProgramCompletion = Math.round(
    programs.reduce((acc, p) => acc + p.completionPercentage, 0) / (programs.length || 1)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-emerald-900 text-white rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Ruang Kerja Bimbingan Konseling (Guru BK)</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-mono font-medium">Layanan Aktif</span>
          </div>
          <p className="text-sm text-emerald-100 mt-1 max-w-2xl">
            Pusat koordinasi layanan konseling individual, kelompok, asesmen diagnostik non-kognitif, dan pendampingan terpadu siswa.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('counseling')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Jadwalkan Konseling</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('cases')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800/80 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors border border-emerald-700"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Rekam Kasus Siswa</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Jadwal Konseling Aktif"
          value={scheduledSessions.length}
          subtitle="Sesi terdaftar minggu ini"
          color="emerald"
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          title="Rujukan Guru / Wali Kelas"
          value={pendingReferrals.length}
          subtitle={pendingReferrals.length > 0 ? "Perlu ditindaklanjuti segera" : "Semua rujukan terproses"}
          color="amber"
          icon={<Send className="w-5 h-5" />}
        />
        <StatCard
          title="Kasus Dalam Penanganan"
          value={activeCases.length}
          subtitle="Pendampingan intensif & mediasi"
          color="rose"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          title="Capaian Program BK"
          value={`${avgProgramCompletion}%`}
          subtitle="Target 4 Bidang Bimbingan"
          color="indigo"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Antrean Sesi Konseling Terdekat */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Agenda Layanan Konseling</h3>
              <p className="text-xs text-slate-500">Jadwal konseling individu dan kelompok siswa</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('counseling')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Kelola Sesi →
            </button>
          </div>

          <div className="space-y-3">
            {sessions.slice(0, 4).map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-lg border border-slate-200/90 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{session.studentName}</span>
                    <span className="text-slate-500">({session.studentClass})</span>
                    <Badge variant={
                      session.domain === 'karier' ? 'indigo' :
                      session.domain === 'belajar' ? 'amber' :
                      session.domain === 'sosial' ? 'blue' : 'emerald'
                    }>
                      {session.domain.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-1">{session.problemSummary}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {session.sessionDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {session.sessionTime} WIB
                    </span>
                    <span>· {session.location}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <Badge variant={
                    session.status === 'completed' ? 'emerald' :
                    session.status === 'in_progress' ? 'amber' : 'slate'
                  }>
                    {session.status === 'completed' ? 'Selesai' :
                     session.status === 'in_progress' ? 'Proses' : 'Dijadwalkan'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rujukan Masuk dari Wali Kelas & Kasus */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rujukan Masuk dari Guru/Wali Kelas</h3>
                <p className="text-xs text-slate-500">Laporan siswa yang memerlukan bantuan khusus BK</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('referrals')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Buka Rujukan →
              </button>
            </div>

            <div className="space-y-2.5">
              {referrals.slice(0, 3).map((ref) => (
                <div key={ref.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{ref.studentName}</span>
                      <span className="text-slate-500 font-mono">({ref.studentClass})</span>
                    </div>
                    <Badge variant={ref.urgency === 'high' ? 'crimson' : ref.urgency === 'medium' ? 'amber' : 'slate'}>
                      Urgensi: {ref.urgency.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-2">{ref.reason}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Diajukan oleh: {ref.referredByTeacherName}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notice on Data Privacy */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white">Prinsip Kerahasiaan BK Terlindungi</p>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Catatan konseling privat dan rincian sensitif hanya dapat dibuka oleh akun Guru BK. Laporan agregat untuk Kepala Sekolah tidak akan menampilkan catatan privat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
