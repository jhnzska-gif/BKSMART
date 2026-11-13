import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { APIService } from '../../services/api';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Calendar, BookOpen, Sparkles, PlusCircle, CheckCircle, FileText } from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const studentName = currentUser?.name || 'Rizky Pratama';

  const mySessions = APIService.getCounselingSessions().filter(s => s.studentName.toLowerCase().includes('rizky'));
  const assessments = APIService.getAssessments().filter(a => a.status === 'active');
  const mySubmissions = APIService.getSubmissions().filter(s => s.studentName.toLowerCase().includes('rizky'));
  const materials = APIService.getMaterials();

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-blue-950 text-white rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Halo, {studentName}!</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono font-medium">Siswa XI RPL 1</span>
          </div>
          <p className="text-sm text-blue-100 mt-1 max-w-2xl">
            Selamat datang di BKSmart. Ruang bimbingan konseling hadir untuk mendukung kesuksesan belajar, pengembangan bakat, dan rencana masa depanmu.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('student_counseling')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ajukan Jadwal Konseling</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('assessments')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900/80 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg transition-colors border border-blue-800"
          >
            <BookOpen className="w-4 h-4" />
            <span>Kuesioner BK</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Sesi Konseling Saya"
          value={mySessions.length}
          subtitle="Riwayat pertemuan bimbingan"
          color="indigo"
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          title="Asesmen / Kuesioner Selesai"
          value={mySubmissions.length}
          subtitle={`${assessments.length} asesmen aktif tersedia`}
          color="emerald"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard
          title="Materi Bimbingan Terbaca"
          value={materials.length}
          subtitle="Modul karier & motivasi"
          color="amber"
          icon={<FileText className="w-5 h-5" />}
        />
      </div>

      {/* Main Two Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jadwal Konseling Saya */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Jadwal & Riwayat Konseling Saya</h3>
              <p className="text-xs text-slate-500">Percakapan rahasia dan aman bersama Guru BK</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('student_counseling')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Ajukan Baru →
            </button>
          </div>

          <div className="space-y-3">
            {mySessions.map((s) => (
              <div key={s.id} className="p-3.5 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{s.ticketNumber} · {s.counselorName}</span>
                  <Badge variant={s.status === 'completed' ? 'emerald' : 'blue'}>
                    {s.status === 'completed' ? 'Selesai' : 'Dijadwalkan'}
                  </Badge>
                </div>
                <p className="text-slate-600 mt-1">{s.problemSummary}</p>
                {s.actionPlan && (
                  <div className="mt-2 p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                    <strong>Rencana Tindak Lanjut:</strong> {s.actionPlan}
                  </div>
                )}
                <div className="mt-2 text-[11px] text-slate-400 font-mono">
                  {s.sessionDate} pukul {s.sessionTime} WIB · {s.location}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asesmen Aktif & Materi Terkini */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Kuesioner Pemetaan Siswa</h3>
              <button
                type="button"
                onClick={() => onNavigate('assessments')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Lihat Semua →
              </button>
            </div>
            <div className="space-y-2.5">
              {assessments.map((a) => {
                const isDone = mySubmissions.some(sub => sub.assessmentId === a.id);
                return (
                  <div key={a.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{a.title}</p>
                      <p className="text-slate-500 mt-0.5 text-[11px] line-clamp-1">{a.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('assessments')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isDone ? 'Sudah Diisi' : 'Mulai Isi'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Friendly Guidance Card */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white">Butuh Teman Cerita atau Bimbingan?</p>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Guru BK siap mendengarkan cerita, keluh kesah akademik, atau rencana kariermu secara ramah, bersahabat, dan tanpa penghakiman.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
