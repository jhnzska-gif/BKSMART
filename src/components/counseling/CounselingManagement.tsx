import React, { useState } from 'react';
import { CounselingSession, CounselingType, GuidanceDomain, CounselingStatus } from '../../types';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import {
  Calendar, Clock, Plus, Search, Filter, Lock, Unlock,
  Shield, Trash2, Edit2
} from 'lucide-react';

interface CounselingManagementProps {
  studentMode?: boolean;
}

export const CounselingManagement: React.FC<CounselingManagementProps> = ({ studentMode = false }) => {
  const { currentUser, role, canViewConfidentialNotes } = useAuth();
  const [sessions, setSessions] = useState<CounselingSession[]>(() => {
    const list = APIService.getCounselingSessions();
    if (studentMode && currentUser?.name) {
      return list.filter(s => s.studentName.toLowerCase().includes(currentUser.name.toLowerCase()) || s.studentId === currentUser.id);
    }
    return list;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Multi-delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<CounselingSession> | null>(null);
  const [detailModalSession, setDetailModalSession] = useState<CounselingSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CounselingSession | null>(null);

  const students = APIService.getStudents();

  const handleRefresh = () => {
    const list = APIService.getCounselingSessions();
    if (studentMode && currentUser?.name) {
      setSessions(list.filter(s => s.studentName.toLowerCase().includes(currentUser.name.toLowerCase()) || s.studentId === currentUser.id));
    } else {
      setSessions(list);
    }
    setSelectedIds(new Set());
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.problemSummary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesDomain = domainFilter === 'all' || s.domain === domainFilter;
    return matchesSearch && matchesStatus && matchesDomain;
  });

  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedSessions.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const isAllPaginatedSelected =
    paginatedSessions.length > 0 &&
    paginatedSessions.every(s => selectedIds.has(s.id));

  const handleExecuteMultiDelete = () => {
    const ids = Array.from(selectedIds);
    APIService.deleteMultipleCounselingSessions(ids);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      'MULTI_DELETE_COUNSELING',
      'COUNSELING',
      `Menghapus ${ids.length} sesi konseling sekaligus`
    );
    setIsMultiDeleteModalOpen(false);
    handleRefresh();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession?.problemSummary) return;

    const saved = APIService.saveCounselingSession(editingSession);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      editingSession.id ? 'UPDATE_COUNSELING' : 'CREATE_COUNSELING',
      'COUNSELING',
      `Layanan Konseling ${saved.ticketNumber} (${saved.studentName} - ${saved.domain.toUpperCase()})`
    );

    setIsModalOpen(false);
    setEditingSession(null);
    handleRefresh();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    APIService.deleteCounselingSession(deleteTarget.id);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      'DELETE_COUNSELING',
      'COUNSELING',
      `Menghapus sesi konseling ${deleteTarget.ticketNumber}`
    );
    setDeleteTarget(null);
    handleRefresh();
  };

  const getDomainBadge = (d: GuidanceDomain) => {
    switch (d) {
      case 'karier': return <Badge variant="indigo">Karier</Badge>;
      case 'belajar': return <Badge variant="amber">Belajar</Badge>;
      case 'sosial': return <Badge variant="blue">Sosial</Badge>;
      case 'pribadi': return <Badge variant="emerald">Pribadi</Badge>;
    }
  };

  const getStatusBadge = (s: CounselingStatus) => {
    switch (s) {
      case 'completed': return <Badge variant="emerald">Selesai</Badge>;
      case 'in_progress': return <Badge variant="amber">Berlangsung</Badge>;
      case 'scheduled': return <Badge variant="blue">Terjadwal</Badge>;
      case 'follow_up': return <Badge variant="crimson">Tindak Lanjut</Badge>;
      case 'cancelled': return <Badge variant="slate">Dibatalkan</Badge>;
    }
  };

  const canEdit = role === 'counselor' || role === 'admin';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {studentMode ? 'Jadwal & Konseling Saya' : 'Layanan Bimbingan Konseling'}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono border border-emerald-200">
              {filteredSessions.length} Sesi
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Pencatatan sesi individual, kelompok, bimbingan klasikal · Dilengkapi multi-delete dan paginasi
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (studentMode && currentUser) {
              setEditingSession({
                studentId: currentUser.id,
                studentName: currentUser.name,
                studentClass: currentUser.assignedClass || 'XI RPL 1',
                counselorId: 'u-2',
                counselorName: 'Siti Rahmawati, S.Pd., Kons.',
                type: 'individual',
                domain: 'karier',
                sessionDate: new Date().toISOString().split('T')[0],
                sessionTime: '10:00',
                location: 'Ruang BK - Konseling Individu 1',
                status: 'scheduled',
                problemSummary: '',
              });
            } else {
              setEditingSession({
                type: 'individual',
                domain: 'pribadi',
                sessionDate: new Date().toISOString().split('T')[0],
                sessionTime: '09:00',
                location: 'Ruang BK - Konseling Individu 1',
                status: 'scheduled',
              });
            }
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{studentMode ? 'Ajukan Konseling Baru' : 'Jadwalkan Layanan'}</span>
        </button>
      </div>

      {/* Confidentiality Reminder Banner */}
      {!studentMode && (
        <div className="p-3 rounded-xl bg-slate-900 text-slate-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Kerahasiaan Data Terjamin:</strong> Catatan konseling privat hanya dapat dibuka oleh akun Guru BK. Laporan umum difilter otomatis.
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono border border-slate-700 whitespace-nowrap hidden sm:inline">
            ABKIN Standard
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor tiket, nama siswa, atau masalah..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Semua Status</option>
            <option value="scheduled">Terjadwal</option>
            <option value="in_progress">Berlangsung</option>
            <option value="completed">Selesai</option>
            <option value="follow_up">Tindak Lanjut</option>
          </select>

          <select
            value={domainFilter}
            onChange={(e) => {
              setDomainFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Semua Bidang</option>
            <option value="pribadi">Pribadi</option>
            <option value="sosial">Sosial</option>
            <option value="belajar">Belajar</option>
            <option value="karier">Karier</option>
          </select>
        </div>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredSessions.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setIsMultiDeleteModalOpen(true)}
        itemName="sesi konseling"
      />

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                {canEdit && (
                  <th className="px-3 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPaginatedSelected}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-4 py-3">No. Tiket & Siswa</th>
                <th className="px-4 py-3">Bidang & Layanan</th>
                <th className="px-4 py-3">Jadwal & Lokasi</th>
                <th className="px-4 py-3">Ringkasan Masalah</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada sesi konseling yang cocok.
                  </td>
                </tr>
              ) : (
                paginatedSessions.map((session) => {
                  const isSelected = selectedIds.has(session.id);
                  return (
                    <tr
                      key={session.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isSelected ? 'bg-slate-50/90' : ''
                      }`}
                    >
                      {canEdit && (
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(session.id)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="font-mono text-slate-500 text-[11px]">{session.ticketNumber}</div>
                        <div className="font-semibold text-slate-900 mt-0.5">{session.studentName}</div>
                        <div className="text-[11px] text-slate-500">{session.studentClass}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          {getDomainBadge(session.domain)}
                        </div>
                        <div className="text-[11px] text-slate-600 capitalize">
                          {session.type === 'individual' ? 'Konseling Individu' :
                           session.type === 'group' ? 'Konseling Kelompok' :
                           session.type === 'classical' ? 'Bimbingan Klasikal' : 'Kunjungan Rumah'}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{session.sessionDate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{session.sessionTime} WIB</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">{session.location}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="line-clamp-2 text-slate-700 leading-relaxed">{session.problemSummary}</p>
                        {session.confidentialNotes && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                            {canViewConfidentialNotes ? (
                              <>
                                <Unlock className="w-3 h-3" />
                                <span>Catatan privat tersimpan</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-400">Catatan privat terkunci</span>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailModalSession(session)}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          >
                            Detail
                          </button>

                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSession(session);
                                  setIsModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                              >
                                Catat Hasil
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(session)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Hapus Sesi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredSessions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>

      {/* Detail Modal with Confidential Notes Protection */}
      <Modal
        isOpen={!!detailModalSession}
        onClose={() => setDetailModalSession(null)}
        title={`Rincian Layanan Konseling: ${detailModalSession?.ticketNumber}`}
        description={`${detailModalSession?.studentName} (${detailModalSession?.studentClass})`}
        maxWidth="2xl"
      >
        {detailModalSession && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Bidang</span>
                <p className="font-semibold text-slate-900 capitalize">{detailModalSession.domain}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Tipe</span>
                <p className="font-semibold text-slate-900 capitalize">{detailModalSession.type}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Waktu</span>
                <p className="font-mono text-slate-900">{detailModalSession.sessionDate} {detailModalSession.sessionTime} WIB</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Status</span>
                <div className="mt-0.5">{getStatusBadge(detailModalSession.status)}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Deskripsi & Ringkasan Umum</h4>
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-700 leading-relaxed">
                {detailModalSession.problemSummary}
              </div>
            </div>

            {/* CONFIDENTIAL PRIVATE NOTES (RESTRICTED ROLE CHECK) */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  {canViewConfidentialNotes ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-slate-500" />}
                  <span>Catatan Khusus / Privat Konselor BK (Sangat Rahasia)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900 font-mono">
                  {canViewConfidentialNotes ? 'Akses Terbuka: Guru BK' : 'Akses Terbatas: Terkunci'}
                </span>
              </div>

              {canViewConfidentialNotes ? (
                <div className="text-slate-800 text-xs leading-relaxed bg-white p-3 rounded-lg border border-emerald-100">
                  {detailModalSession.confidentialNotes || 'Belum ada catatan rahasia yang direkam untuk sesi ini.'}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 italic text-[11px] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Catatan privat dilindungi Kode Etik Bimbingan & Konseling dan tidak ditampilkan kepada selain Guru BK / Konselor yang bertugas.
                  </span>
                </div>
              )}
            </div>

            {/* Action Plan & Outcome */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Rencana Tindak Lanjut</h4>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                  {detailModalSession.actionPlan || 'Belum dirumuskan.'}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Hasil & Capaian Sesi</h4>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                  {detailModalSession.outcomeSummary || 'Belum ada evaluasi akhir.'}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Konselor: {detailModalSession.counselorName}</span>
              <button
                type="button"
                onClick={() => setDetailModalSession(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSession?.id ? `Catat Hasil Konseling: ${editingSession.ticketNumber}` : 'Jadwalkan Sesi Konseling Baru'}
        description="Lengkapi informasi sesi bimbingan konseling dan rencana penanganan siswa."
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {!studentMode && (
            <div>
              <label className="block font-medium text-slate-700 mb-1">Pilih Peserta Didik *</label>
              <select
                required
                value={editingSession?.studentId || ''}
                onChange={(e) => {
                  const s = students.find(st => st.id === e.target.value);
                  if (s) {
                    setEditingSession({
                      ...editingSession,
                      studentId: s.id,
                      studentName: s.name,
                      studentClass: s.className,
                    });
                  }
                }}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">-- Pilih Siswa --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.className} (NISN: {s.nisn})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Bidang Bimbingan *</label>
              <select
                value={editingSession?.domain || 'pribadi'}
                onChange={(e) => setEditingSession({ ...editingSession, domain: e.target.value as GuidanceDomain })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="pribadi">Bimbingan Pribadi</option>
                <option value="sosial">Bimbingan Sosial</option>
                <option value="belajar">Bimbingan Belajar</option>
                <option value="karier">Bimbingan Karier & Minat</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Jenis Layanan Konseling *</label>
              <select
                value={editingSession?.type || 'individual'}
                onChange={(e) => setEditingSession({ ...editingSession, type: e.target.value as CounselingType })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="individual">Konseling Individu</option>
                <option value="group">Konseling Kelompok</option>
                <option value="classical">Bimbingan Klasikal</option>
                <option value="home_visit">Kunjungan Rumah (Home Visit)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tanggal Pertemuan</label>
              <input
                type="date"
                required
                value={editingSession?.sessionDate || ''}
                onChange={(e) => setEditingSession({ ...editingSession, sessionDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Waktu / Jam (WIB)</label>
              <input
                type="time"
                value={editingSession?.sessionTime || '09:00'}
                onChange={(e) => setEditingSession({ ...editingSession, sessionTime: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Status Sesi</label>
              <select
                value={editingSession?.status || 'scheduled'}
                onChange={(e) => setEditingSession({ ...editingSession, status: e.target.value as CounselingStatus })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="scheduled">Terjadwal</option>
                <option value="in_progress">Sedang Berlangsung</option>
                <option value="completed">Selesai</option>
                <option value="follow_up">Perlu Tindak Lanjut</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Lokasi Sesi</label>
            <input
              type="text"
              value={editingSession?.location || 'Ruang BK - Konseling Individu 1'}
              onChange={(e) => setEditingSession({ ...editingSession, location: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Ringkasan Masalah / Topik Konseling *</label>
            <textarea
              required
              rows={3}
              value={editingSession?.problemSummary || ''}
              onChange={(e) => setEditingSession({ ...editingSession, problemSummary: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed"
              placeholder="Jelaskan pokok permasalahan..."
            />
          </div>

          {canViewConfidentialNotes && (
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <label className="block font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Catatan Privat Rahasia Guru BK (Hanya Terlihat Oleh Tim Konselor)</span>
              </label>
              <textarea
                rows={2}
                value={editingSession?.confidentialNotes || ''}
                onChange={(e) => setEditingSession({ ...editingSession, confidentialNotes: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                placeholder="Rincian observasi psikologis atau catatan sensitif lainnya..."
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Rencana Tindak Lanjut</label>
              <textarea
                rows={2}
                value={editingSession?.actionPlan || ''}
                onChange={(e) => setEditingSession({ ...editingSession, actionPlan: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Langkah nyata yang disepakati..."
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Hasil yang Dicapai</label>
              <textarea
                rows={2}
                value={editingSession?.outcomeSummary || ''}
                onChange={(e) => setEditingSession({ ...editingSession, outcomeSummary: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Evaluasi ketercapaian..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Simpan Layanan Konseling
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Sesi Konseling"
        message={`Apakah Anda yakin ingin menghapus data sesi ${deleteTarget?.ticketNumber}?`}
      />

      <ConfirmDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={handleExecuteMultiDelete}
        title="Konfirmasi Hapus Massal Sesi Konseling"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.size} sesi konseling terpilih?`}
        confirmLabel={`Hapus ${selectedIds.size} Sesi`}
      />
    </div>
  );
};
