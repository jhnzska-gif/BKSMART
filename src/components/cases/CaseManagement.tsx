import React, { useState } from 'react';
import { StudentCase, CaseCategory, CasePriority, CaseStatus } from '../../types';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import { Plus, Search, Filter, Lock, Unlock, History, Trash2, Edit2 } from 'lucide-react';

export const CaseManagement: React.FC = () => {
  const { currentUser, role, canViewConfidentialNotes } = useAuth();
  const [cases, setCases] = useState<StudentCase[]>(APIService.getCases());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Multi-delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Partial<StudentCase> | null>(null);
  const [detailCase, setDetailCase] = useState<StudentCase | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentCase | null>(null);

  // Intervention modal
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [newInterventionAction, setNewInterventionAction] = useState('');
  const [newInterventionResult, setNewInterventionResult] = useState('');

  const students = APIService.getStudents();

  const handleRefresh = () => {
    setCases(APIService.getCases());
    setSelectedIds(new Set());
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedCases.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const isAllPaginatedSelected =
    paginatedCases.length > 0 &&
    paginatedCases.every(c => selectedIds.has(c.id));

  const handleExecuteMultiDelete = () => {
    const ids = Array.from(selectedIds);
    APIService.deleteMultipleCases(ids);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      'MULTI_DELETE_CASES',
      'CASES',
      `Menghapus ${ids.length} kasus siswa sekaligus`
    );
    setIsMultiDeleteModalOpen(false);
    handleRefresh();
  };

  const handleSaveCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase?.title || !editingCase?.studentId) return;

    const student = students.find(s => s.id === editingCase.studentId);
    const saved = APIService.saveCase({
      ...editingCase,
      studentName: student?.name || editingCase.studentName,
      studentClass: student?.className || editingCase.studentClass,
      assignedCounselorId: currentUser?.id || 'u-2',
      assignedCounselorName: currentUser?.name || 'Siti Rahmawati, S.Pd., Kons.',
    });

    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      editingCase.id ? 'UPDATE_CASE' : 'CREATE_CASE',
      'CASES',
      `Menyimpan data bimbingan kasus ${saved.caseNumber} (${saved.studentName})`
    );

    setIsModalOpen(false);
    setEditingCase(null);
    handleRefresh();
  };

  const handleAddIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailCase || !newInterventionAction) return;

    const updatedInterventions = [
      ...(detailCase.interventions || []),
      {
        date: new Date().toISOString().split('T')[0],
        action: newInterventionAction,
        by: currentUser?.name || 'Guru BK',
        result: newInterventionResult || 'Tahap awal penanganan',
      }
    ];

    const updated = APIService.saveCase({
      ...detailCase,
      interventions: updatedInterventions,
    });

    setDetailCase(updated);
    setIsInterventionModalOpen(false);
    setNewInterventionAction('');
    setNewInterventionResult('');
    handleRefresh();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    APIService.deleteCase(deleteTarget.id);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      'DELETE_CASE',
      'CASES',
      `Menghapus bimbingan kasus ${deleteTarget.caseNumber}`
    );
    setDeleteTarget(null);
    handleRefresh();
  };

  const getPriorityBadge = (p: CasePriority) => {
    switch (p) {
      case 'darurat': return <Badge variant="crimson">Darurat</Badge>;
      case 'tinggi': return <Badge variant="crimson">Tinggi</Badge>;
      case 'sedang': return <Badge variant="amber">Sedang</Badge>;
      case 'rendah': return <Badge variant="slate">Rendah</Badge>;
    }
  };

  const getStatusBadge = (s: CaseStatus) => {
    switch (s) {
      case 'investigasi': return <Badge variant="amber">Investigasi Awal</Badge>;
      case 'penanganan': return <Badge variant="indigo">Dalam Penanganan</Badge>;
      case 'tindak_lanjut': return <Badge variant="blue">Tindak Lanjut</Badge>;
      case 'selesai': return <Badge variant="emerald">Selesai</Badge>;
    }
  };

  const canEdit = role === 'counselor' || role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Bimbingan & Rekam Kasus Siswa</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono border border-rose-200">
              {filteredCases.length} Kasus
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Penanganan kasus kedisiplinan, sosial, emosional, dan bullying · Dilengkapi multi-delete dan paginasi
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setEditingCase({
                category: 'kedisiplinan',
                priority: 'sedang',
                status: 'investigasi',
                incidentDate: new Date().toISOString().split('T')[0],
                interventions: [],
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Rekam Kasus Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor kasus, judul, atau nama siswa..."
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
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Semua Kategori</option>
            <option value="kedisiplinan">Kedisiplinan</option>
            <option value="akademik">Akademik</option>
            <option value="sosial_perilaku">Sosial & Perilaku</option>
            <option value="emosional_pribadi">Emosional & Pribadi</option>
            <option value="bullying">Bullying & Perundungan</option>
            <option value="keluarga">Lingkungan Keluarga</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Semua Status</option>
            <option value="investigasi">Investigasi</option>
            <option value="penanganan">Penanganan</option>
            <option value="tindak_lanjut">Tindak Lanjut</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredCases.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setIsMultiDeleteModalOpen(true)}
        itemName="kasus siswa"
      />

      {/* Table */}
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
                <th className="px-4 py-3">Kasus & Siswa</th>
                <th className="px-4 py-3">Kategori & Prioritas</th>
                <th className="px-4 py-3">Tanggal & Status</th>
                <th className="px-4 py-3">Penanggung Jawab</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCases.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada kasus yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedCases.map((c) => {
                  const isSelected = selectedIds.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isSelected ? 'bg-slate-50/90' : ''
                      }`}
                    >
                      {canEdit && (
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(c.id)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-400 text-[11px]">{c.caseNumber}</span>
                        <p className="font-semibold text-slate-900 mt-0.5">{c.title}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{c.studentName} ({c.studentClass})</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          {getPriorityBadge(c.priority)}
                        </div>
                        <span className="text-[11px] text-slate-600 capitalize">
                          {c.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <div className="text-slate-600">{c.incidentDate}</div>
                        <div className="mt-1">{getStatusBadge(c.status)}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium">{c.assignedCounselorName}</div>
                        <span className="text-[10px] text-slate-400">{c.interventions.length} kali intervensi</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailCase(c)}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          >
                            Detail
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCase(c);
                                  setIsModalOpen(true);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 rounded"
                                title="Ubah Kasus"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(c)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Hapus Kasus"
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
          totalItems={filteredCases.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>

      {/* Detail Modal with Interventions Log & Privacy Lock */}
      <Modal
        isOpen={!!detailCase}
        onClose={() => setDetailCase(null)}
        title={`Rincian Bimbingan Kasus: ${detailCase?.caseNumber}`}
        description={`${detailCase?.title} · Siswa: ${detailCase?.studentName}`}
        maxWidth="3xl"
      >
        {detailCase && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Kategori</span>
                <p className="font-semibold text-slate-900 capitalize">{detailCase.category.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Prioritas</span>
                <div className="mt-0.5">{getPriorityBadge(detailCase.priority)}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Status</span>
                <div className="mt-0.5">{getStatusBadge(detailCase.status)}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Konselor</span>
                <p className="font-semibold text-slate-900 truncate">{detailCase.assignedCounselorName}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Kronologi Singkat / Ringkasan Kasus</h4>
              <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                {detailCase.chronologySummary}
              </p>
            </div>

            {/* CONFIDENTIAL DETAILS */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-rose-950">
                  {canViewConfidentialNotes ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
                  <span>Detail Konfidensial Penyelidikan (Kerahasiaan Tertutup)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono">
                  {canViewConfidentialNotes ? 'Akses Konselor BK Aktif' : 'Akses Terkunci'}
                </span>
              </div>

              {canViewConfidentialNotes ? (
                <div className="text-slate-800 text-xs leading-relaxed bg-white p-3 rounded-lg border border-rose-100">
                  {detailCase.confidentialDetails || 'Tidak ada catatan tertutup khusus.'}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-100 text-slate-500 italic text-[11px] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Detail privat kasus dilindungi etika profesi bimbingan konseling dan dirahasiakan.</span>
                </div>
              )}
            </div>

            {/* Interventions History */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Riwayat Tindak Lanjut & Intervensi ({detailCase.interventions.length})</span>
                </h4>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsInterventionModalOpen(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    + Tambah Intervensi
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {detailCase.interventions.map((inv, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-mono">{inv.date} · Oleh: <strong>{inv.by}</strong></span>
                    </div>
                    <p className="font-semibold text-slate-900">{inv.action}</p>
                    <p className="text-slate-600 mt-1"><strong className="text-slate-700">Hasil:</strong> {inv.result}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailCase(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Intervention Sub-Modal */}
      <Modal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        title="Catat Langkah Intervensi / Mediasi"
        maxWidth="md"
      >
        <form onSubmit={handleAddIntervention} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Tindakan / Langkah Penanganan *</label>
            <input
              type="text"
              required
              value={newInterventionAction}
              onChange={(e) => setNewInterventionAction(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="misal: Pemanggilan orang tua atau mediasi siswa"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Hasil & Kesepakatan yang Dicapai *</label>
            <textarea
              required
              rows={3}
              value={newInterventionResult}
              onChange={(e) => setNewInterventionResult(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="misal: Siswa bersedia menandatangani surat komitmen..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInterventionModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              Simpan Intervensi
            </button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Case Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCase?.id ? 'Ubah Bimbingan Kasus' : 'Rekam Kasus Siswa Baru'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveCase} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Judul Ringkas Kasus *</label>
            <input
              type="text"
              required
              value={editingCase?.title || ''}
              onChange={(e) => setEditingCase({ ...editingCase, title: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="misal: Penanganan Ketidakhadiran Berulang Siswa"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Peserta Didik Terkait *</label>
              <select
                required
                value={editingCase?.studentId || ''}
                onChange={(e) => setEditingCase({ ...editingCase, studentId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">-- Pilih Siswa --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Kategori Masalah *</label>
              <select
                value={editingCase?.category || 'kedisiplinan'}
                onChange={(e) => setEditingCase({ ...editingCase, category: e.target.value as CaseCategory })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="kedisiplinan">Kedisiplinan</option>
                <option value="akademik">Akademik</option>
                <option value="sosial_perilaku">Sosial & Perilaku</option>
                <option value="emosional_pribadi">Emosional & Pribadi</option>
                <option value="bullying">Bullying & Perundungan</option>
                <option value="keluarga">Lingkungan Keluarga</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tingkat Prioritas</label>
              <select
                value={editingCase?.priority || 'sedang'}
                onChange={(e) => setEditingCase({ ...editingCase, priority: e.target.value as CasePriority })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="rendah">Rendah</option>
                <option value="sedang">Sedang</option>
                <option value="tinggi">Tinggi</option>
                <option value="darurat">Darurat</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tahap / Status</label>
              <select
                value={editingCase?.status || 'investigasi'}
                onChange={(e) => setEditingCase({ ...editingCase, status: e.target.value as CaseStatus })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="investigasi">Investigasi Awal</option>
                <option value="penanganan">Dalam Penanganan</option>
                <option value="tindak_lanjut">Tindak Lanjut</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tanggal Kejadian / Laporan</label>
              <input
                type="date"
                value={editingCase?.incidentDate || ''}
                onChange={(e) => setEditingCase({ ...editingCase, incidentDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Kronologi Ringkas / Deskripsi Kasus</label>
            <textarea
              rows={3}
              value={editingCase?.chronologySummary || ''}
              onChange={(e) => setEditingCase({ ...editingCase, chronologySummary: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="Deskripsi objektif kejadian..."
            />
          </div>

          {canViewConfidentialNotes && (
            <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200">
              <label className="block font-bold text-rose-950 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-700" />
                <span>Detail Privat / Fakta Tertutup (Hanya Konselor BK)</span>
              </label>
              <textarea
                rows={2}
                value={editingCase?.confidentialDetails || ''}
                onChange={(e) => setEditingCase({ ...editingCase, confidentialDetails: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-600"
                placeholder="Rincian latar belakang sensitif..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              Simpan Kasus
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kasus"
        message={`Apakah Anda yakin ingin menghapus bimbingan kasus ${deleteTarget?.caseNumber}?`}
      />

      <ConfirmDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={handleExecuteMultiDelete}
        title="Konfirmasi Hapus Massal Kasus Siswa"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.size} kasus siswa terpilih?`}
        confirmLabel={`Hapus ${selectedIds.size} Kasus`}
      />
    </div>
  );
};
