import React, { useState } from 'react';
import { BKMaterial, GuidanceDomain } from '../../types';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import { FileText, Plus, CheckCircle2, Trash2, Edit2 } from 'lucide-react';

export const MaterialManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [materials, setMaterials] = useState<BKMaterial[]>(APIService.getMaterials());
  const [selectedMaterial, setSelectedMaterial] = useState<BKMaterial | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // Multi-delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const [deleteSingleTarget, setDeleteSingleTarget] = useState<BKMaterial | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Partial<BKMaterial> | null>(null);

  // Student task reflection state
  const [taskAnswer, setTaskAnswer] = useState('');
  const [taskSubmitted, setTaskSubmitted] = useState(false);

  const handleRefresh = () => {
    setMaterials(APIService.getMaterials());
    setSelectedIds(new Set());
  };

  const paginatedMaterials = materials.slice(
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
    if (selectedIds.size === paginatedMaterials.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedMaterials.map(m => m.id)));
    }
  };

  const handleExecuteMultiDelete = () => {
    const ids = Array.from(selectedIds);
    APIService.deleteMultipleMaterials(ids);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      'MULTI_DELETE_MATERIALS',
      'SYSTEM',
      `Menghapus ${ids.length} materi bimbingan sekaligus`
    );
    setIsMultiDeleteModalOpen(false);
    handleRefresh();
  };

  const handleDeleteSingle = () => {
    if (!deleteSingleTarget) return;
    APIService.deleteMaterial(deleteSingleTarget.id);
    setDeleteSingleTarget(null);
    handleRefresh();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial?.title) return;

    APIService.saveMaterial({
      ...editingMaterial,
      authorName: currentUser?.name || 'Siti Rahmawati, S.Pd., Kons.',
    });

    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'User',
      role,
      'CREATE_BK_MATERIAL',
      'SYSTEM',
      `Mempublikasikan materi BK: ${editingMaterial.title}`
    );

    setIsModalOpen(false);
    setEditingMaterial(null);
    handleRefresh();
  };

  const canCreate = role === 'counselor' || role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Materi & Lembar Kerja Siswa BK</h2>
          <p className="text-xs text-slate-500">
            Modul bimbingan karier, persiapan PKL, dan refleksi siswa · Didukung multi-delete dan paginasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && paginatedMaterials.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {selectedIds.size === paginatedMaterials.length ? 'Batalkan Semua' : 'Pilih Semua'}
            </button>
          )}

          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setEditingMaterial({
                  domain: 'karier',
                  targetGrade: 'Semua Tingkat',
                  hasTask: false,
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Materi BK</span>
            </button>
          )}
        </div>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.size}
        totalCount={materials.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setIsMultiDeleteModalOpen(true)}
        itemName="materi BK"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedMaterials.map((mat) => {
          const isSelected = selectedIds.has(mat.id);
          return (
            <div
              key={mat.id}
              className={`bg-white rounded-xl border p-5 shadow-2xs flex flex-col justify-between transition-colors ${
                isSelected ? 'border-slate-900 bg-slate-50/70' : 'border-slate-200/90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {canCreate && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(mat.id)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                      />
                    )}
                    <Badge variant={
                      mat.domain === 'karier' ? 'indigo' :
                      mat.domain === 'belajar' ? 'amber' :
                      mat.domain === 'sosial' ? 'blue' : 'emerald'
                    }>
                      {mat.domain.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {mat.targetGrade}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{mat.title}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{mat.summary}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Oleh: {mat.authorName}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMaterial(mat);
                      setTaskSubmitted(false);
                      setTaskAnswer('');
                    }}
                    className="font-semibold text-slate-900 hover:underline flex items-center gap-1"
                  >
                    <span>Baca Modul</span>
                    {mat.hasTask && <span className="text-[10px] text-indigo-600 font-bold">(Tugas)</span>}
                  </button>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => setDeleteSingleTarget(mat)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Hapus Materi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
          totalItems={materials.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[4, 8, 16]}
        />
      </div>

      {/* Reader Modal */}
      <Modal
        isOpen={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        title={selectedMaterial?.title || 'Materi BK'}
        description={`Bidang: ${selectedMaterial?.domain.toUpperCase()} · Penulis: ${selectedMaterial?.authorName}`}
        maxWidth="2xl"
      >
        {selectedMaterial && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line font-sans">
              {selectedMaterial.content}
            </div>

            {selectedMaterial.hasTask && (
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div>
                  <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-700" />
                    <span>Lembar Kerja Refleksi Siswa:</span>
                  </h4>
                  <p className="text-indigo-900 text-xs mt-1 leading-relaxed">
                    {selectedMaterial.taskPrompt}
                  </p>
                </div>

                {taskSubmitted ? (
                  <div className="p-3 rounded-lg bg-emerald-100 text-emerald-900 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Jawaban refleksi Anda berhasil dikirim ke Guru BK!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={taskAnswer}
                      onChange={(e) => setTaskAnswer(e.target.value)}
                      placeholder="Tuliskan jawaban refleksi mandiri Anda di sini..."
                      className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={!taskAnswer.trim()}
                        onClick={() => setTaskSubmitted(true)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-xs"
                      >
                        Kirim Refleksi ke BK
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedMaterial(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Material Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publikasikan Materi BK Baru"
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Judul Materi *</label>
            <input
              type="text"
              required
              value={editingMaterial?.title || ''}
              onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="misal: Tips Lolos Wawancara Kerja & Magang Industri"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Bidang Bimbingan</label>
              <select
                value={editingMaterial?.domain || 'karier'}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, domain: e.target.value as GuidanceDomain })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="karier">Karier</option>
                <option value="belajar">Belajar</option>
                <option value="pribadi">Pribadi</option>
                <option value="sosial">Sosial</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Tingkat</label>
              <input
                type="text"
                value={editingMaterial?.targetGrade || 'Semua Tingkat'}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, targetGrade: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="misal: 11 & 12"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Ringkasan Singkat</label>
            <input
              type="text"
              value={editingMaterial?.summary || ''}
              onChange={(e) => setEditingMaterial({ ...editingMaterial, summary: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="Deskripsi 1 kalimat untuk tampilan kartu..."
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Konten Lengkap Modul</label>
            <textarea
              rows={5}
              value={editingMaterial?.content || ''}
              onChange={(e) => setEditingMaterial({ ...editingMaterial, content: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed"
              placeholder="Tuliskan materi edukatif, panduan atau artikel di sini..."
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-900 mb-2">
              <input
                type="checkbox"
                checked={editingMaterial?.hasTask || false}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, hasTask: e.target.checked })}
                className="rounded text-slate-900 focus:ring-0"
              />
              <span>Sertakan Lembar Kerja / Tugas Refleksi Mandiri</span>
            </label>

            {editingMaterial?.hasTask && (
              <textarea
                rows={2}
                value={editingMaterial?.taskPrompt || ''}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, taskPrompt: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Petunjuk tugas untuk dijawab siswa..."
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
              Publikasikan
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteSingleTarget}
        onClose={() => setDeleteSingleTarget(null)}
        onConfirm={handleDeleteSingle}
        title="Hapus Materi BK"
        message={`Apakah Anda yakin ingin menghapus materi "${deleteSingleTarget?.title}"?`}
      />

      <ConfirmDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={handleExecuteMultiDelete}
        title="Konfirmasi Hapus Massal Materi BK"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.size} materi bimbingan terpilih?`}
        confirmLabel={`Hapus ${selectedIds.size} Materi`}
      />
    </div>
  );
};
