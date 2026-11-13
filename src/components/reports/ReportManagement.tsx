import React, { useState } from 'react';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { Printer, Download, BarChart2, PieChart, ShieldCheck } from 'lucide-react';

export const ReportManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const sessions = APIService.getCounselingSessions();
  const cases = APIService.getCases();
  const programs = APIService.getPrograms();
  const referrals = APIService.getReferrals();
  const students = APIService.getStudents();

  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Calculate distributions
  const domainCounts = {
    pribadi: sessions.filter(s => s.domain === 'pribadi').length,
    sosial: sessions.filter(s => s.domain === 'sosial').length,
    belajar: sessions.filter(s => s.domain === 'belajar').length,
    karier: sessions.filter(s => s.domain === 'karier').length,
  };

  const typeCounts = {
    individual: sessions.filter(s => s.type === 'individual').length,
    group: sessions.filter(s => s.type === 'group').length,
    classical: sessions.filter(s => s.type === 'classical').length,
    home_visit: sessions.filter(s => s.type === 'home_visit').length,
  };

  const caseCategoryCounts = {
    kedisiplinan: cases.filter(c => c.category === 'kedisiplinan').length,
    akademik: cases.filter(c => c.category === 'akademik').length,
    sosial_perilaku: cases.filter(c => c.category === 'sosial_perilaku').length,
    emosional_pribadi: cases.filter(c => c.category === 'emosional_pribadi').length,
    bullying: cases.filter(c => c.category === 'bullying').length,
    keluarga: cases.filter(c => c.category === 'keluarga').length,
  };

  const handlePrint = () => {
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      'PRINT_REPORT',
      'REPORTS',
      'Mencetak Rekapitulasi Laporan Berkala Bimbingan Konseling'
    );
    window.print();
  };

  const handleExportCSVReport = () => {
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      'EXPORT_REPORT_CSV',
      'REPORTS',
      'Mengekspor Rekapitulasi Sesi Konseling Umum (Tanpa Catatan Privat)'
    );

    const headers = ['No Tiket', 'Nama Siswa', 'Kelas', 'Bidang Bimbingan', 'Jenis Konseling', 'Tanggal', 'Status', 'Ringkasan Umum Masalah', 'Rencana Tindak Lanjut'];
    const rows = sessions.map(s => [
      `"${s.ticketNumber}"`,
      `"${s.studentName}"`,
      `"${s.studentClass}"`,
      `"${s.domain}"`,
      `"${s.type}"`,
      `"${s.sessionDate}"`,
      `"${s.status}"`,
      `"${s.problemSummary.replace(/"/g, '""')}"`,
      `"${(s.actionPlan || '-').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_layanan_bk_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSessions = sessions.length || 1;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Laporan & Statistik Layanan BK</h2>
          <p className="text-xs text-slate-500">
            Rekapitulasi pelaksanaan konseling, distribusi penanganan kasus, dan capaian program sekolah
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSVReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Rekap</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-2xs print:border-none print:shadow-none print:p-0">
        <div className="border-b border-slate-200 pb-4 mb-5 text-center">
          <h1 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET DAN TEKNOLOGI
          </h1>
          <h2 className="text-sm font-semibold text-slate-800">SMK MERDEKA NUSANTARA</h2>
          <p className="text-xs text-slate-500">UNIT LAYANAN BIMBINGAN DAN KONSELING (BK)</p>
          <div className="mt-2 text-xs font-bold text-slate-900 uppercase">
            LAPORAN REKAPITULASI PELAYANAN BIMBINGAN KONSELING SEMESTER GENAP 2024/2025
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
          </p>
        </div>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Konseling</span>
            <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{sessions.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Rujukan Masuk</span>
            <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{referrals.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Kasus Tertangani</span>
            <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{cases.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Program Kerja</span>
            <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{programs.length} Program</p>
          </div>
        </div>

        {/* Visual Charts & Breakdown Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Chart 1: Bidang Bimbingan */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>Proporsi Bidang Bimbingan</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Total {sessions.length} Sesi</span>
            </div>

            <div className="space-y-2.5 pt-1 text-xs">
              {[
                { name: 'Karier & Minat', count: domainCounts.karier, color: 'bg-indigo-600', text: 'text-indigo-700' },
                { name: 'Belajar & Akademik', count: domainCounts.belajar, color: 'bg-amber-500', text: 'text-amber-700' },
                { name: 'Sosial & Teman Sebaya', count: domainCounts.sosial, color: 'bg-blue-600', text: 'text-blue-700' },
                { name: 'Pribadi & Emosi', count: domainCounts.pribadi, color: 'bg-emerald-600', text: 'text-emerald-700' },
              ].map((item) => {
                const pct = Math.round((item.count / totalSessions) * 100);
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-medium text-slate-800">{item.name}</span>
                      <span className="font-mono text-slate-600">{item.count} sesi ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Jenis Layanan Konseling */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span>Distribusi Modalitas Layanan</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Format</span>
            </div>

            <div className="space-y-2.5 pt-1 text-xs">
              {[
                { name: 'Konseling Individual', count: typeCounts.individual, color: 'bg-emerald-600' },
                { name: 'Konseling Kelompok', count: typeCounts.group, color: 'bg-blue-600' },
                { name: 'Bimbingan Klasikal (Kelas)', count: typeCounts.classical, color: 'bg-amber-600' },
                { name: 'Kunjungan Rumah (Home Visit)', count: typeCounts.home_visit, color: 'bg-rose-600' },
              ].map((item) => {
                const pct = Math.round((item.count / totalSessions) * 100);
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-medium text-slate-800">{item.name}</span>
                      <span className="font-mono text-slate-600">{item.count} kali ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recap Table of Sessions (Confidential Notes Redacted for General Report) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase">
              Rekapitulasi Sesi Konseling Terlaksana
            </h3>
            <span className="text-[10px] text-slate-400 italic">
              *Catatan konseling privat sengaja difilter demi privasi siswa
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2">No. Tiket</th>
                  <th className="px-3 py-2">Siswa</th>
                  <th className="px-3 py-2">Kelas</th>
                  <th className="px-3 py-2">Bidang</th>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Ringkasan Masalah</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{s.ticketNumber}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{s.studentName}</td>
                    <td className="px-3 py-2 text-slate-600">{s.studentClass}</td>
                    <td className="px-3 py-2 capitalize text-slate-700">{s.domain}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{s.sessionDate}</td>
                    <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{s.problemSummary}</td>
                    <td className="px-3 py-2">
                      <span className="text-[11px] font-medium text-slate-800 capitalize">{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="no-print">
            <Pagination
              currentPage={currentPage}
              totalItems={sessions.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Official Signatures for Printing */}
        <div className="hidden print:grid grid-cols-2 pt-10 text-xs text-center text-slate-900">
          <div>
            <p>Mengetahui,</p>
            <p className="font-semibold">Kepala SMK Merdeka Nusantara</p>
            <div className="h-16" />
            <p className="font-bold underline">Dr. H. Mulyono, M.Pd.</p>
            <p className="text-[11px] text-slate-600">NIP. 196904121994031001</p>
          </div>
          <div>
            <p>Jakarta, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            <p className="font-semibold">Koordinator Bimbingan Konseling</p>
            <div className="h-16" />
            <p className="font-bold underline">Siti Rahmawati, S.Pd., Kons.</p>
            <p className="text-[11px] text-slate-600">NIP. 198509152010012015</p>
          </div>
        </div>
      </div>
    </div>
  );
};
