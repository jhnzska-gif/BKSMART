import React, { useState } from 'react';
import { SchoolClass, Major, AcademicYear } from '../../types';
import { APIService } from '../../services/api';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import { Plus, Edit2, Trash2, FolderTree, BookOpen, Calendar, Search } from 'lucide-react';

export const AcademicManagement: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>(APIService.getClasses());
  const majors = APIService.getMajors();
  const academicYears = APIService.getAcademicYears();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<SchoolClass> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);

  const handleRefresh = () => {
    setClasses(APIService.getClasses());
    setSelectedIds(new Set());
  };

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.majorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.homeroomTeacherName && c.homeroomTeacherName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedClasses.map(c => c.id)));
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
    paginatedClasses.length > 0 &&
    paginatedClasses.every(c => selectedIds.has(c.id));

  const handleExecuteMultiDelete = () => {
    const ids = Array.from(selectedIds);
    APIService.deleteMultipleClasses(ids);
    setIsMultiDeleteModalOpen(false);
    handleRefresh();
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass?.name) return;

    APIService.saveClass(editingClass);
    setIsModalOpen(false);
    setEditingClass(null);
    handleRefresh();
  };

  const handleDeleteClass = () => {
    if (!deleteTarget) return;
    APIService.deleteClass(deleteTarget.id);
    setDeleteTarget(null);
    handleRefresh();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Kelas, Jurusan & Tahun Ajaran</h2>
        <p className="text-xs text-slate-500">Struktur rombongan belajar dan konfigurasi kalender akademik sekolah</p>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredClasses.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setIsMultiDeleteModalOpen(true)}
        itemName="kelas"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Table (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between">
          <div>
            <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Rombongan Belajar (Kelas)</h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari kelas..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditingClass({
                      grade: '10',
                      studentCount: 36,
                      academicYear: '2024/2025',
                      majorName: 'Rekayasa Perangkat Lunak',
                    });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="px-3 py-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllPaginatedSelected}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-2.5">Nama Kelas</th>
                    <th className="px-4 py-2.5">Jurusan</th>
                    <th className="px-4 py-2.5">Wali Kelas</th>
                    <th className="px-4 py-2.5">Jml Siswa</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedClasses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        Tidak ada kelas yang cocok.
                      </td>
                    </tr>
                  ) : (
                    paginatedClasses.map((c) => {
                      const isSelected = selectedIds.has(c.id);
                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-slate-50/60 ${
                            isSelected ? 'bg-slate-50/90' : ''
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(c.id)}
                              className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-900">{c.name}</td>
                          <td className="px-4 py-2.5 text-slate-600">{c.majorName}</td>
                          <td className="px-4 py-2.5 text-slate-800 font-medium">{c.homeroomTeacherName || 'Belum Ditentukan'}</td>
                          <td className="px-4 py-2.5 font-mono tabular-nums text-slate-700">{c.studentCount} Siswa</td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingClass(c);
                                  setIsModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-800 rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(c)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredClasses.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>

        {/* Sidebar info: Majors & Academic Years */}
        <div className="space-y-4">
          {/* Majors */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Program Keahlian / Jurusan</h3>
            </div>
            <div className="space-y-2">
              {majors.map((m) => (
                <div key={m.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{m.code}</span> · {m.name}
                    <p className="text-[11px] text-slate-400">Kaprog: {m.headOfMajor || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Years */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Tahun Ajaran & Semester</h3>
            </div>
            <div className="space-y-2">
              {academicYears.map((ay) => (
                <div key={ay.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{ay.year}</span>
                    <span className="text-slate-500 ml-1.5 font-medium">Semester {ay.semester}</span>
                  </div>
                  {ay.isActive && <Badge variant="emerald">Aktif</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass?.id ? 'Ubah Data Kelas' : 'Tambah Rombongan Belajar'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Nama Rombel / Kelas *</label>
            <input
              type="text"
              required
              value={editingClass?.name || ''}
              onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="misal: X RPL 2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tingkat</label>
              <select
                value={editingClass?.grade || '10'}
                onChange={(e) => setEditingClass({ ...editingClass, grade: e.target.value as '10' | '11' | '12' })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="10">Kelas 10 (X)</option>
                <option value="11">Kelas 11 (XI)</option>
                <option value="12">Kelas 12 (XII)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Jumlah Siswa</label>
              <input
                type="number"
                value={editingClass?.studentCount || 36}
                onChange={(e) => setEditingClass({ ...editingClass, studentCount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Nama Wali Kelas</label>
            <input
              type="text"
              value={editingClass?.homeroomTeacherName || ''}
              onChange={(e) => setEditingClass({ ...editingClass, homeroomTeacherName: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="misal: Ahmad Fauzi, S.Pd."
            />
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
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteClass}
        title="Hapus Kelas"
        message={`Apakah Anda yakin ingin menghapus rombel ${deleteTarget?.name}?`}
      />

      <ConfirmDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={handleExecuteMultiDelete}
        title="Konfirmasi Hapus Massal Kelas"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.size} rombel kelas terpilih?`}
        confirmLabel={`Hapus ${selectedIds.size} Kelas`}
      />
    </div>
  );
};
