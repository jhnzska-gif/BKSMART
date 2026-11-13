import React, { useState } from 'react';
import { Referral, ReferralStatus } from '../../types';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import {
  Plus,
  MessageSquare,
  Trash2,
  Search,
  Filter,
  Eye,
  Clock,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

export const ReferralManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>(() => {
    const list = APIService.getReferrals();
    if (role === 'teacher' && currentUser?.assignedClass) {
      return list.filter(
        (r) =>
          r.studentClass === currentUser.assignedClass ||
          r.referredByTeacherId === currentUser.id
      );
    }
    return list;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Multi-delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const [deleteSingleTarget, setDeleteSingleTarget] = useState<Referral | null>(null);

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedRef, setSelectedRef] = useState<Referral | null>(null);
  const [detailRef, setDetailRef] = useState<Referral | null>(null);

  // New referral form state
  const [newReferral, setNewReferral] = useState<Partial<Referral>>({
    urgency: 'medium',
    indicators: [],
  });

  // Feedback form state for Guru BK
  const [feedbackText, setFeedbackText] = useState('');
  const [newStatus, setNewStatus] = useState<ReferralStatus>('scheduled');

  const students = APIService.getStudents();
  const availableStudents =
    role === 'teacher' && currentUser?.assignedClass
      ? students.filter((s) => s.className === currentUser.assignedClass)
      : students;

  const handleRefresh = () => {
    const list = APIService.getReferrals();
    if (role === 'teacher' && currentUser?.assignedClass) {
      setReferrals(
        list.filter(
          (r) =>
            r.studentClass === currentUser.assignedClass ||
            r.referredByTeacherId === currentUser.id
        )
      );
    } else {
      setReferrals(list);
    }
    setSelectedIds(new Set());
  };

  const filteredReferrals = referrals.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.referralNumber.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      r.studentClass.toLowerCase().includes(q) ||
      r.referredByTeacherName.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || r.urgency === urgencyFilter;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const totalPages = Math.max(1, Math.ceil(filteredReferrals.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedReferrals = filteredReferrals.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const isAllPaginatedSelected =
    paginatedReferrals.length > 0 &&
    paginatedReferrals.every((r) => selectedIds.has(r.id));

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedReferrals.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleExecuteMultiDelete = () => {
    const ids = Array.from(selectedIds);
    APIService.deleteMultipleReferrals(ids);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      'MULTI_DELETE_REFERRALS',
      'REFERRALS',
      `Menghapus ${ids.length} rujukan siswa sekaligus`
    );
    setIsMultiDeleteModalOpen(false);
    handleRefresh();
  };

  const handleDeleteSingle = () => {
    if (!deleteSingleTarget) return;
    APIService.deleteReferral(deleteSingleTarget.id);
    if (detailRef?.id === deleteSingleTarget.id) {
      setDetailRef(null);
    }
    setDeleteSingleTarget(null);
    handleRefresh();
  };

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReferral.studentId || !newReferral.reason) return;

    const student = students.find((s) => s.id === newReferral.studentId);
    const created = APIService.saveReferral({
      ...newReferral,
      studentName: student?.name || '',
      studentClass: student?.className || '',
      referredByTeacherId: currentUser?.id || 'u-3',
      referredByTeacherName: `${currentUser?.name || 'Wali Kelas'} (Wali Kelas ${student?.className})`,
    });

    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'Guru',
      role,
      'CREATE_REFERRAL',
      'REFERRALS',
      `Mengajukan rujukan ${created.referralNumber} untuk siswa ${created.studentName}`
    );

    setIsSubmitModalOpen(false);
    setNewReferral({ urgency: 'medium', indicators: [] });
    handleRefresh();
  };

  const openFeedbackModal = (ref: Referral) => {
    setSelectedRef(ref);
    setFeedbackText(ref.counselorFeedback || '');
    setNewStatus(ref.status === 'pending' ? 'scheduled' : ref.status);
    setIsFeedbackModalOpen(true);
  };

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRef) return;

    APIService.saveReferral({
      id: selectedRef.id,
      status: newStatus,
      counselorFeedback: feedbackText,
      counselorId: currentUser?.id,
      counselorName: currentUser?.name,
    });

    if (newStatus === 'scheduled') {
      APIService.saveCounselingSession({
        studentId: selectedRef.studentId,
        studentName: selectedRef.studentName,
        studentClass: selectedRef.studentClass,
        counselorId: currentUser?.id || 'u-2',
        counselorName: currentUser?.name || 'Siti Rahmawati, S.Pd., Kons.',
        domain: 'belajar',
        type: 'individual',
        sessionDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        sessionTime: '10:00',
        location: 'Ruang BK - Konseling Individu 1',
        status: 'scheduled',
        problemSummary: `Tindak lanjut rujukan ${selectedRef.referralNumber}: ${selectedRef.reason}`,
      });
    }

    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'Guru BK',
      role,
      'UPDATE_REFERRAL_FEEDBACK',
      'REFERRALS',
      `Menindaklanjuti rujukan ${selectedRef.referralNumber} dengan status ${newStatus}`
    );

    setIsFeedbackModalOpen(false);
    setSelectedRef(null);
    handleRefresh();
  };

  const indicatorOptions = [
    'Penurunan Prestasi Belajar',
    'Sering Terlambat Masuk Sekolah',
    'Ketidakhadiran Tanpa Keterangan',
    'Menarik Diri / Mengisolasi Diri',
    'Tampak Lelah / Mengantuk di Kelas',
    'Konflik dengan Teman Sebaya',
    'Indikasi Masalah Keluarga',
    'Perilaku Agresif / Mudah Marah',
  ];

  const canManage = role === 'counselor' || role === 'admin';

  const getStatusLabel = (status: ReferralStatus) => {
    switch (status) {
      case 'resolved':
        return 'Selesai';
      case 'scheduled':
        return 'Terjadwal';
      case 'accepted':
        return 'Diterima BK';
      case 'declined':
        return 'Dialihkan';
      default:
        return 'Menunggu';
    }
  };

  const getStatusVariant = (status: ReferralStatus) => {
    switch (status) {
      case 'resolved':
        return 'emerald';
      case 'scheduled':
        return 'indigo';
      case 'accepted':
        return 'blue';
      case 'declined':
        return 'crimson';
      default:
        return 'slate';
    }
  };

  const getUrgencyLabel = (urgency: Referral['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'Tinggi';
      case 'medium':
        return 'Sedang';
      default:
        return 'Rendah';
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Rujukan & Tindak Lanjut Siswa
          </h2>
          <p className="text-xs text-slate-500">
            Klik baris rujukan untuk melihat detail pengamatan & umpan balik · Fitur multi-delete & paginasi
          </p>
        </div>

        {(role === 'teacher' || role === 'counselor' || role === 'admin') && (
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Rujukan Baru</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. rujukan, nama siswa, kelas, pengaju, atau alasan..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 sm:flex-none px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="accepted">Diterima BK</option>
            <option value="scheduled">Terjadwal</option>
            <option value="resolved">Selesai</option>
            <option value="declined">Dialihkan</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => {
              setUrgencyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 sm:flex-none px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Semua Urgensi</option>
            <option value="high">Urgensi Tinggi</option>
            <option value="medium">Urgensi Sedang</option>
            <option value="low">Urgensi Rendah</option>
          </select>
        </div>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredReferrals.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setIsMultiDeleteModalOpen(true)}
        itemName="rujukan"
      />

      {/* Referrals Row Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                {canManage && (
                  <th className="px-3 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPaginatedSelected}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-4 py-3">No. Rujukan & Siswa</th>
                <th className="px-4 py-3">Pengaju (Wali Kelas)</th>
                <th className="px-4 py-3">Alasan & Indikator</th>
                <th className="px-4 py-3">Urgensi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReferrals.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 7 : 6}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Belum ada data rujukan yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedReferrals.map((ref) => {
                  const isSelected = selectedIds.has(ref.id);
                  return (
                    <tr
                      key={ref.id}
                      onClick={() => setDetailRef(ref)}
                      className={`cursor-pointer hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-slate-50/95' : ''
                      }`}
                    >
                      {canManage && (
                        <td
                          className="px-3 py-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(ref.id)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono text-slate-500 text-[11px]">
                          {ref.referralNumber}
                        </div>
                        <div className="font-semibold text-slate-900 mt-0.5">
                          {ref.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {ref.studentClass}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium line-clamp-2 max-w-[190px]">
                          {ref.referredByTeacherName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(ref.createdAt)}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <p className="line-clamp-2 text-slate-700 leading-relaxed">
                          {ref.reason}
                        </p>
                        {ref.indicators && ref.indicators.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {ref.indicators.slice(0, 2).map((ind, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                              >
                                {ind}
                              </span>
                            ))}
                            {ref.indicators.length > 2 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                                +{ref.indicators.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={
                            ref.urgency === 'high'
                              ? 'crimson'
                              : ref.urgency === 'medium'
                              ? 'amber'
                              : 'slate'
                          }
                        >
                          {getUrgencyLabel(ref.urgency)}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={getStatusVariant(ref.status)}>
                          {getStatusLabel(ref.status)}
                        </Badge>
                      </td>

                      <td
                        className="px-4 py-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailRef(ref)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Detail</span>
                          </button>

                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => openFeedbackModal(ref)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                              >
                                Tanggapi
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteSingleTarget(ref)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Hapus Rujukan"
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
          currentPage={safeCurrentPage}
          totalItems={filteredReferrals.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>

      {/* Referral Detail Popup Modal */}
      <Modal
        isOpen={!!detailRef}
        onClose={() => setDetailRef(null)}
        title={`Detail Rujukan: ${detailRef?.referralNumber || ''}`}
        description={
          detailRef ? `${detailRef.studentName} (${detailRef.studentClass})` : undefined
        }
        maxWidth="2xl"
      >
        {detailRef && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                  Siswa & Kelas
                </span>
                <p className="font-semibold text-slate-900">{detailRef.studentName}</p>
                <p className="text-[11px] text-slate-500 font-mono">{detailRef.studentClass}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                  Tanggal Pengajuan
                </span>
                <p className="font-semibold text-slate-900">{formatDate(detailRef.createdAt)}</p>
                <p className="text-[10px] text-slate-400">
                  Update: {formatDate(detailRef.updatedAt)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Urgensi
                </span>
                <Badge
                  variant={
                    detailRef.urgency === 'high'
                      ? 'crimson'
                      : detailRef.urgency === 'medium'
                      ? 'amber'
                      : 'slate'
                  }
                >
                  Urgensi {getUrgencyLabel(detailRef.urgency)}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Status Penanganan
                </span>
                <Badge variant={getStatusVariant(detailRef.status)}>
                  {getStatusLabel(detailRef.status)}
                </Badge>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Diajukan Oleh Guru / Wali Kelas
                </span>
                <span className="font-semibold text-slate-900">
                  {detailRef.referredByTeacherName}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Indikator Gejala Pengamatan</span>
              </h4>
              {detailRef.indicators && detailRef.indicators.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {detailRef.indicators.map((ind, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/70"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">Tidak ada indikator khusus yang dicentang.</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1.5">
                Alasan Rujukan & Catatan Pengamatan Wali Kelas
              </h4>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line">
                {detailRef.reason}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  Umpan Balik & Tindak Lanjut Guru BK
                  {detailRef.counselorName ? ` (${detailRef.counselorName})` : ''}
                </span>
              </h4>
              {detailRef.counselorFeedback ? (
                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 leading-relaxed whitespace-pre-line">
                  {detailRef.counselorFeedback}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-amber-800">
                  Belum ada tanggapan resmi dari Guru BK untuk rujukan ini.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailRef(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    const target = detailRef;
                    setDetailRef(null);
                    openFeedbackModal(target);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  Tanggapi / Ubah Status
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Submit Referral Modal (Wali Kelas) */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Ajukan Rujukan Siswa ke Guru BK"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateReferral} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Pilih Siswa yang Dirujuk *
            </label>
            <select
              required
              value={newReferral.studentId || ''}
              onChange={(e) => setNewReferral({ ...newReferral, studentId: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="">-- Pilih Siswa --</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.className} (NISN: {s.nisn})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Tingkat Urgensi *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setNewReferral({ ...newReferral, urgency: u })}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-medium capitalize text-center transition-colors ${
                    newReferral.urgency === u
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {u === 'low' ? 'Rendah' : u === 'medium' ? 'Sedang' : 'Tinggi'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Indikator Gejala Pengamatan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
              {indicatorOptions.map((opt) => {
                const checked = (newReferral.indicators || []).includes(opt);
                return (
                  <label key={opt} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const current = newReferral.indicators || [];
                        if (e.target.checked) {
                          setNewReferral({ ...newReferral, indicators: [...current, opt] });
                        } else {
                          setNewReferral({
                            ...newReferral,
                            indicators: current.filter((x) => x !== opt),
                          });
                        }
                      }}
                      className="rounded text-slate-900 focus:ring-0"
                    />
                    <span className="text-[11px]">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Alasan Rujukan & Catatan Pengamatan *
            </label>
            <textarea
              required
              rows={4}
              value={newReferral.reason || ''}
              onChange={(e) => setNewReferral({ ...newReferral, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed"
              placeholder="Jelaskan secara objektif pengamatan perubahan perilaku, nilai akademik, atau absensi siswa..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Kirim Rujukan ke BK
            </button>
          </div>
        </form>
      </Modal>

      {/* Counselor Feedback Modal (Guru BK) */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title={`Tanggapi Rujukan: ${selectedRef?.referralNumber}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveFeedback} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Status Penanganan Rujukan
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ReferralStatus)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="accepted">Diterima (Sedang Ditelaah)</option>
              <option value="scheduled">Jadwalkan Sesi Konseling Segera</option>
              <option value="resolved">Terselesaikan (Selesai Bimbingan)</option>
              <option value="declined">Ditolak / Dialihkan</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Catatan Umpan Balik untuk Wali Kelas *
            </label>
            <textarea
              required
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="Berikan kabar status penjadwalan atau saran pendampingan kelas umum..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Simpan Respon
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteSingleTarget}
        onClose={() => setDeleteSingleTarget(null)}
        onConfirm={handleDeleteSingle}
        title="Hapus Rujukan"
        message={`Apakah Anda yakin ingin menghapus rujukan ${deleteSingleTarget?.referralNumber}?`}
      />

      <ConfirmDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={handleExecuteMultiDelete}
        title="Konfirmasi Hapus Massal Rujukan"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.size} rujukan siswa terpilih?`}
        confirmLabel={`Hapus ${selectedIds.size} Rujukan`}
      />
    </div>
  );
};
