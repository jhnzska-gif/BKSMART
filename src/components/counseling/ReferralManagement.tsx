import React, { useState } from 'react';
import { Referral, ReferralStatus } from '../../types';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import { Plus, MessageSquare, Trash2, CheckSquare } from 'lucide-react';

export const ReferralManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>(() => {
    const list = APIService.getReferrals();
    if (role === 'teacher' && currentUser?.assignedClass) {
      return list.filter(r => r.studentClass === currentUser.assignedClass || r.referredByTeacherId === currentUser.id);
    }
    return list;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // Multi-delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const [deleteSingleTarget, setDeleteSingleTarget] = useState<Referral | null>(null);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedRef, setSelectedRef] = useState<Referral | null>(null);

  // New referral form state
  const [newReferral, setNewReferral] = useState<Partial<Referral>>({
    urgency: 'medium',
    indicators: [],
  });

  // Feedback form state for Guru BK
  const [feedbackText, setFeedbackText] = useState('');
  const [newStatus, setNewStatus] = useState<ReferralStatus>('scheduled');

  const students = APIService.getStudents();
  const availableStudents = (role === 'teacher' && currentUser?.assignedClass)
    ? students.filter(s => s.className === currentUser.assignedClass)
    : students;

  const handleRefresh = () => {
    const list = APIService.getReferrals();
    if (role === 'teacher' && currentUser?.assignedClass) {
      setReferrals(list.filter(r => r.studentClass === currentUser.assignedClass || r.referredByTeacherId === currentUser.id));
    } else {
      setReferrals(list);
    }
    setSelectedIds(new Set());
  };

  const paginatedReferrals = referrals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedReferrals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedReferrals.map(r => r.id)));
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
    setDeleteSingleTarget(null);
    handleRefresh();
  };

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReferral.studentId || !newReferral.reason) return;

    const student = students.find(s => s.id === newReferral.studentId);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Rujukan & Tindak Lanjut Siswa</h2>
          <p className="text-xs text-slate-500">
            Jembatan kolaborasi antara Guru/Wali Kelas dan Guru BK · Fitur multi-delete dan paginasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && paginatedReferrals.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {selectedIds.size === paginatedReferrals.length ? 'Batalkan Semua' : 'Pilih Semua'}
            </button>
          )}

          {(role === 'teacher' || role === 'counselor' || role === 'admin') && (
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan Rujukan Baru</span>
            </button>
          )}
        </div>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.size}
        totalCount={referrals.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setIsMultiDeleteModalOpen(true)}
        itemName="rujukan"
      />

      {/* Referrals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedReferrals.length === 0 ? (
          <div className="md:col-span-2 p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Belum ada data rujukan.
          </div>
        ) : (
          paginatedReferrals.map((ref) => {
            const isSelected = selectedIds.has(ref.id);
            return (
              <div
                key={ref.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition-colors ${
                  isSelected ? 'border-slate-900 bg-slate-50/70' : 'border-slate-200/90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2">
                      {canManage && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(ref.id)}
                          className="mt-1 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                        />
                      )}
                      <div>
                        <span className="font-mono text-[11px] text-slate-400">{ref.referralNumber}</span>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">{ref.studentName}</h3>
                        <span className="text-[11px] text-slate-500 font-mono">Kelas: {ref.studentClass}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={
                        ref.urgency === 'high' ? 'crimson' :
                        ref.urgency === 'medium' ? 'amber' : 'slate'
                      }>
                        Urgensi: {ref.urgency.toUpperCase()}
                      </Badge>
                      <Badge variant={
                        ref.status === 'resolved' ? 'emerald' :
                        ref.status === 'scheduled' ? 'indigo' :
                        ref.status === 'accepted' ? 'blue' : 'slate'
                      }>
                        {ref.status === 'resolved' ? 'Selesai' :
                         ref.status === 'scheduled' ? 'Terjadwal' :
                         ref.status === 'accepted' ? 'Diterima BK' : 'Menunggu'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="font-medium text-slate-900 mb-1">Alasan / Catatan Pengamatan Wali Kelas:</p>
                    <p className="leading-relaxed">{ref.reason}</p>
                  </div>

                  {ref.indicators && ref.indicators.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {ref.indicators.map((ind, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {ind}
                        </span>
                      ))}
                    </div>
                  )}

                  {ref.counselorFeedback && (
                    <div className="mt-3 text-xs bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100 text-emerald-900">
                      <p className="font-semibold flex items-center gap-1.5 text-emerald-950 mb-0.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Umpan Balik Guru BK ({ref.counselorName || 'Konselor'}):</span>
                      </p>
                      <p className="leading-relaxed">{ref.counselorFeedback}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[180px]">Oleh: {ref.referredByTeacherName}</span>
                  <div className="flex items-center gap-1">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRef(ref);
                            setFeedbackText(ref.counselorFeedback || '');
                            setNewStatus(ref.status);
                            setIsFeedbackModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
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
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Pagination
          currentPage={currentPage}
          totalItems={referrals.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[4, 8, 16]}
        />
      </div>

      {/* Submit Referral Modal (Wali Kelas) */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Ajukan Rujukan Siswa ke Guru BK"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateReferral} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Pilih Siswa yang Dirujuk *</label>
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
            <label className="block font-medium text-slate-700 mb-1">Indikator Gejala Pengamatan</label>
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
                          setNewReferral({ ...newReferral, indicators: current.filter(x => x !== opt) });
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
            <label className="block font-medium text-slate-700 mb-1">Alasan Rujukan & Catatan Pengamatan *</label>
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
            <label className="block font-medium text-slate-700 mb-1">Status Penanganan Rujukan</label>
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
