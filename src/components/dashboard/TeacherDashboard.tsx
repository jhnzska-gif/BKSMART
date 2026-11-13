import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { APIService } from '../../services/api';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { GraduationCap, Send, Clock, UserCheck, ShieldCheck } from 'lucide-react';

interface TeacherDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const assignedClass = currentUser?.assignedClass || 'XI RPL 1';

  const students = APIService.getStudents().filter(s => s.className === assignedClass);
  const myReferrals = APIService.getReferrals().filter(r => r.studentClass === assignedClass);
  const materials = APIService.getMaterials().slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-amber-950 text-white rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Portal Guru / Wali Kelas</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 font-mono font-medium">{assignedClass}</span>
          </div>
          <p className="text-sm text-amber-100 mt-1 max-w-2xl">
            Pantau perkembangan peserta didik di kelas binaan Anda dan ajukan rujukan penanganan bimbingan konseling secara terstruktur.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('referrals')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>Ajukan Rujukan Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('my_students')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-900/80 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg transition-colors border border-amber-800"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Daftar Siswa Kelas</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={`Total Siswa ${assignedClass}`}
          value={students.length}
          subtitle="Siswa aktif di rombel Anda"
          color="amber"
          icon={<UserCheck className="w-5 h-5" />}
        />
        <StatCard
          title="Rujukan Diajukan"
          value={myReferrals.length}
          subtitle="Terkirim ke tim Guru BK"
          color="indigo"
          icon={<Send className="w-5 h-5" />}
        />
        <StatCard
          title="Status Penanganan BK"
          value={myReferrals.filter(r => r.status === 'scheduled' || r.status === 'resolved').length}
          subtitle="Telah ditindaklanjuti Guru BK"
          color="emerald"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Rujukan Siswa */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Perkembangan Rujukan Siswa Kelas {assignedClass}</h3>
              <p className="text-xs text-slate-500">Monitoring status penanganan tanpa membuka catatan rahasia</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('referrals')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              Lihat Riwayat →
            </button>
          </div>

          {myReferrals.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Belum ada rujukan yang diajukan untuk kelas ini.</p>
          ) : (
            <div className="space-y-3">
              {myReferrals.map((ref) => (
                <div key={ref.id} className="p-3 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{ref.studentName}</span>
                    <Badge variant={
                      ref.status === 'resolved' ? 'emerald' :
                      ref.status === 'scheduled' ? 'indigo' :
                      ref.status === 'accepted' ? 'blue' : 'amber'
                    }>
                      {ref.status === 'resolved' ? 'Selesai' :
                       ref.status === 'scheduled' ? 'Terjadwal' :
                       ref.status === 'accepted' ? 'Diterima BK' : 'Menunggu Respon'}
                    </Badge>
                  </div>
                  <p className="text-slate-600 mt-1">{ref.reason}</p>
                  {ref.counselorFeedback && (
                    <div className="mt-2 p-2 rounded bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-800">
                      <strong>Respon Guru BK:</strong> {ref.counselorFeedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Siswa Kelas Preview & Privacy Note */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Daftar Ringkas Siswa {assignedClass}</h3>
              <button
                type="button"
                onClick={() => onNavigate('my_students')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                Lihat Lengkap →
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {students.slice(0, 4).map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">NISN: {s.nisn} · Ortu: {s.parentName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('referrals')}
                    className="px-2 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors"
                  >
                    Rujuk BK
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white">Akses Data Terbatas Wali Kelas</p>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Anda memiliki hak memantau status tindak lanjut rujukan, namun rekam konseling personal dilindungi kode etik kerahasiaan konselor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
