import React, { useState } from 'react';
import { BKProgram, GuidanceDomain } from '../../types';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export const BKProgramManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [programs, setPrograms] = useState<BKProgram[]>(APIService.getPrograms());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // Multi-delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const [deleteSingleTarget, setDeleteSingleTarget] = useState<BKProgram | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<Partial<BKProgram> | null>(null);

  const handleRefresh = () => {
    setPrograms(APIService.getPrograms());
    setSelectedIds(new Set());
  };

  const paginatedPrograms = programs.slice(
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
    if (selectedIds.size === paginatedPrograms.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPrograms.map(p => p.id)));
    }
  };

  const handleExecuteMultiDelete = () => {
    const ids = Array.from(selectedIds);
    APIService.deleteMultiplePrograms(ids);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      'MULTI_DELETE_BK_PROGRAMS',
      'SYSTEM',
      `Menghapus ${ids.length} program kerja BK sekaligus`
    );
    setIsMultiDeleteModalOpen(false);
    handleRefresh();
  };

  const handleDeleteSingle = () => {
    if (!deleteSingleTarget) return;
    APIService.deleteProgram(deleteSingleTarget.id);
    setDeleteSingleTarget(null);
    handleRefresh();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProg?.title) return;

    APIService.saveProgram(editingProg);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      editingProg.id ? 'UPDATE_BK_PROGRAM' : 'CREATE_BK_PROGRAM',
      'SYSTEM',
      `Menyimpan Program Kerja BK: ${editingProg.title}`
    );

    setIsModalOpen(false);
    setEditingProg(null);
    handleRefresh();
  };

  const canEdit = role === 'counselor' || role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Program Bimbingan Konseling (4 Bidang)</h2>
          <p className="text-xs text-slate-500">
            Perencanaan dan ketercapaian program bimbingan · Dilengkapi multi-delete dan navigasi halaman
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && paginatedPrograms.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {selectedIds.size === paginatedPrograms.length ? 'Batalkan Semua' : 'Pilih Semua'}
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setEditingProg({
                  domain: 'pribadi',
                  targetGrade: 'Semua',
                  semester: 'Genap',
                  academicYear: '2024/2025',
                  status: 'planned',
                  completionPercentage: 0,
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Program</span>
            </button>
          )}
        </div>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.size}
        totalCount={programs.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setIsMultiDeleteModalOpen(true)}
        itemName="program BK"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedPrograms.map((p) => {
          const isSelected = selectedIds.has(p.id);
          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl border p-5 shadow-2xs flex flex-col justify-between transition-colors ${
                isSelected ? 'border-slate-900 bg-slate-50/70' : 'border-slate-200/90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(p.id)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                      />
                    )}
                    <Badge variant={
                      p.domain === 'karier' ? 'indigo' :
                      p.domain === 'belajar' ? 'amber' :
                      p.domain === 'sosial' ? 'blue' : 'emerald'
                    }>
                      {p.domain.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Kelas {p.targetGrade} · Sem. {p.semester}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{p.title}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{p.objectives}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Capaian Realisasi:</span>
                  <span className="font-mono font-bold text-slate-900">{p.completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.completionPercentage >= 70 ? 'bg-emerald-600' :
                      p.completionPercentage >= 30 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${p.completionPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Pelaksanaan: {p.scheduledMonth}</span>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProg(p);
                          setIsModalOpen(true);
                        }}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSingleTarget(p)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Hapus Program"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Pagination
          currentPage={currentPage}
          totalItems={programs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[4, 8, 16]}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProg?.id ? 'Ubah Program Kerja BK' : 'Tambah Program Kerja BK'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Judul Program BK *</label>
            <input
              type="text"
              required
              value={editingProg?.title || ''}
              onChange={(e) => setEditingProg({ ...editingProg, title: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="misal: Workshop Kesiapan Karier & Portofolio SMK"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Bidang Bimbingan</label>
              <select
                value={editingProg?.domain || 'pribadi'}
                onChange={(e) => setEditingProg({ ...editingProg, domain: e.target.value as GuidanceDomain })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="pribadi">Bimbingan Pribadi</option>
                <option value="sosial">Bimbingan Sosial</option>
                <option value="belajar">Bimbingan Belajar</option>
                <option value="karier">Bimbingan Karier</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Tingkat</label>
              <select
                value={editingProg?.targetGrade || 'Semua'}
                onChange={(e) => setEditingProg({ ...editingProg, targetGrade: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="Semua">Semua Tingkat</option>
                <option value="10">Kelas 10 (X)</option>
                <option value="11">Kelas 11 (XI)</option>
                <option value="12">Kelas 12 (XII)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Jadwal Pelaksanaan</label>
              <input
                type="text"
                value={editingProg?.scheduledMonth || 'Maret 2025'}
                onChange={(e) => setEditingProg({ ...editingProg, scheduledMonth: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="misal: Maret 2025"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Persentase Capaian (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={editingProg?.completionPercentage || 0}
                onChange={(e) => setEditingProg({ ...editingProg, completionPercentage: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Tujuan & Deskripsi Program</label>
            <textarea
              rows={3}
              value={editingProg?.objectives || ''}
              onChange={(e) => setEditingProg({ ...editingProg, objectives: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="Jelaskan output bimbingan..."
            />
          </div>

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
              Simpan Program
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteSingleTarget}
        onClose={() => setDeleteSingleTarget(null)}
        onConfirm={handleDeleteSingle}
        title="Hapus Program Kerja BK"
        message={`Apakah Anda yakin ingin menghapus program "${deleteSingleTarget?.title}"?`}
      />

      <ConfirmDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={handleExecuteMultiDelete}
        title="Konfirmasi Hapus Massal Program BK"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.size} program kerja BK terpilih?`}
        confirmLabel={`Hapus ${selectedIds.size} Program`}
      />
    </div>
  );
};
