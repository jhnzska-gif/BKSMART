import React, { useState } from 'react';
import { SchoolClass, Major, AcademicYear } from '../../types';
import { APIService } from '../../services/api';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import { Plus, Edit2, Trash2, FolderTree, BookOpen, Calendar } from 'lucide-react';

export const AcademicManagement: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>(APIService.getClasses());
  const [majors, setMajors] = useState<Major[]>(APIService.getMajors());
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(APIService.getAcademicYears());
  const teachers = APIService.getTeachers();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);

  // Class modal & delete
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<SchoolClass> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);

  // Major modal & delete
  const [isMajorModalOpen, setIsMajorModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Partial<Major> | null>(null);
  const [deleteMajorTarget, setDeleteMajorTarget] = useState<Major | null>(null);

  // AcademicYear modal & delete
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<Partial<AcademicYear> | null>(null);
  const [deleteYearTarget, setDeleteYearTarget] = useState<AcademicYear | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRefresh = () => {
    setClasses(APIService.getClasses());
    setMajors(APIService.getMajors());
    setAcademicYears(APIService.getAcademicYears());
    setSelectedIds(new Set());
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.majorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.homeroomTeacherName &&
        c.homeroomTeacherName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedClasses.map((c) => c.id)));
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
    paginatedClasses.length > 0 && paginatedClasses.every((c) => selectedIds.has(c.id));

  const handleExecuteMultiDelete = async () => {
    const ids = Array.from(selectedIds);
    setActionError(null);
    setIsSaving(true);
    try {
      await APIService.deleteMultipleClasses(ids);
      setIsMultiDeleteModalOpen(false);
      handleRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menghapus kelas terpilih.');
      setIsMultiDeleteModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass?.name || isSaving) return;
    setActionError(null);
    setIsSaving(true);
    try {
      await APIService.saveClass(editingClass);
      setIsModalOpen(false);
      setEditingClass(null);
      handleRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menyimpan data kelas.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteTarget || isSaving) return;
    setActionError(null);
    setIsSaving(true);
    try {
      await APIService.deleteClass(deleteTarget.id);
      setDeleteTarget(null);
      handleRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menghapus kelas.');
      setDeleteTarget(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMajor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMajor?.code || !editingMajor?.name || isSaving) return;
    setActionError(null);
    setIsSaving(true);
    try {
      await APIService.saveMajor(editingMajor);
      setIsMajorModalOpen(false);
      setEditingMajor(null);
      handleRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menyimpan jurusan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMajor = async () => {
    if (!deleteMajorTarget || isSaving) return;
    setActionError(null);
    setIsSaving(true);
    try {
      await APIService.deleteMajor(deleteMajorTarget.id);
      setDeleteMajorTarget(null);
      handleRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menghapus jurusan.');
      setDeleteMajorTarget(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYear?.year || isSaving) return;
    setActionError(null);
    setIsSaving(true);
    try {
      await APIService.saveAcademicYear(editingYear);
      setIsYearModalOpen(false);
      setEditingYear(null);
      handleRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menyimpan tahun ajaran.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteYear = async () => {
    if (!deleteYearTarget || isSaving) return;
    setActionError(null);
    setIsSaving(true);
    try {
      await APIService.deleteAcademicYear(deleteYearTarget.id);
      setDeleteYearTarget(null);
      handleRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menghapus tahun ajaran.');
      setDeleteYearTarget(null);
    } finally {
      setIsSaving(false);
    }
  };

  const defaultYearString = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
  const homeroomTeachers = teachers.filter((t) => t.role === 'teacher');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Kelas, Jurusan & Tahun Ajaran
        </h2>
        <p className="text-xs text-slate-500">
          Lengkapi Tahun Ajaran, Program Keahlian / Jurusan, dan Rombongan Belajar (Kelas) sesuai data asli sekolah Anda
        </p>
      </div>

      {actionError && !isModalOpen && !isMajorModalOpen && !isYearModalOpen && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {actionError}
        </div>
      )}

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
                    setActionError(null);
                    setEditingClass({
                      grade: '10',
                      studentCount: 0,
                      academicYear:
                        academicYears.find((a) => a.isActive)?.year || defaultYearString,
                      majorId: majors[0]?.id || '',
                      majorName: majors[0]?.name || '',
                    });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kelas</span>
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
                        Belum ada data kelas. Klik &quot;Tambah Kelas&quot; untuk menambahkan rombel sekolah.
                      </td>
                    </tr>
                  ) : (
                    paginatedClasses.map((c) => {
                      const isSelected = selectedIds.has(c.id);
                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-slate-50/60 ${isSelected ? 'bg-slate-50/90' : ''}`}
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
                          <td className="px-4 py-2.5 text-slate-800 font-medium">
                            {c.homeroomTeacherName || 'Belum Ditentukan'}
                          </td>
                          <td className="px-4 py-2.5 font-mono tabular-nums text-slate-700">
                            {c.studentCount} Siswa
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActionError(null);
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

        {/* Sidebar: Majors & Academic Years CRUD */}
        <div className="space-y-4">
          {/* Majors */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Program Keahlian / Jurusan</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActionError(null);
                  setEditingMajor({ code: '', name: '', headOfMajor: '' });
                  setIsMajorModalOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah</span>
              </button>
            </div>
            <div className="space-y-2">
              {majors.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Belum ada data jurusan. Tambahkan misalnya IPA, IPS, RPL, atau TKJ.
                </p>
              ) : (
                majors.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900">{m.code}</span> ·{' '}
                      <span className="text-slate-800">{m.name}</span>
                      <p className="text-[11px] text-slate-400 truncate">
                        Kaprog: {m.headOfMajor || '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          setEditingMajor(m);
                          setIsMajorModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded"
                        title="Edit Jurusan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteMajorTarget(m)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Hapus Jurusan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Academic Years */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Tahun Ajaran & Semester</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActionError(null);
                  setEditingYear({
                    year: defaultYearString,
                    semester: 'Ganjil',
                    isActive: academicYears.length === 0,
                  });
                  setIsYearModalOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah</span>
              </button>
            </div>
            <div className="space-y-2">
              {academicYears.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Belum ada data tahun ajaran. Tambahkan tahun pelajaran aktif.
                </p>
              ) : (
                academicYears.map((ay) => (
                  <div
                    key={ay.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{ay.year}</span>
                      <span className="text-slate-500 font-medium">Semester {ay.semester}</span>
                      {ay.isActive && <Badge variant="emerald">Aktif</Badge>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          setEditingYear(ay);
                          setIsYearModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded"
                        title="Edit Tahun Ajaran"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteYearTarget(ay)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Hapus Tahun Ajaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Class */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingClass?.id ? 'Ubah Data Kelas' : 'Tambah Rombongan Belajar'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {actionError}
            </div>
          )}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Nama Rombel / Kelas *</label>
            <input
              type="text"
              required
              value={editingClass?.name || ''}
              onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="misal: X RPL 1 atau XI IPA 2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tingkat</label>
              <select
                value={editingClass?.grade || '10'}
                onChange={(e) =>
                  setEditingClass({
                    ...editingClass,
                    grade: e.target.value as '10' | '11' | '12',
                  })
                }
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
                min={0}
                value={editingClass?.studentCount ?? 0}
                onChange={(e) =>
                  setEditingClass({
                    ...editingClass,
                    studentCount: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Jurusan / Program Keahlian
            </label>
            {majors.length > 0 ? (
              <select
                value={editingClass?.majorName || ''}
                onChange={(e) => {
                  const found = majors.find((m) => m.name === e.target.value);
                  setEditingClass({
                    ...editingClass,
                    majorId: found?.id || '',
                    majorName: e.target.value,
                  });
                }}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">-- Pilih Jurusan --</option>
                {majors.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={editingClass?.majorName || ''}
                onChange={(e) => setEditingClass({ ...editingClass, majorName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="misal: Rekayasa Perangkat Lunak / IPA"
              />
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Nama Wali Kelas</label>
            {homeroomTeachers.length > 0 ? (
              <select
                value={editingClass?.homeroomTeacherName || ''}
                onChange={(e) => {
                  const found = homeroomTeachers.find((t) => t.name === e.target.value);
                  setEditingClass({
                    ...editingClass,
                    homeroomTeacherId: found?.id || '',
                    homeroomTeacherName: e.target.value,
                  });
                }}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">-- Pilih Wali Kelas (Opsional) --</option>
                {homeroomTeachers.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={editingClass?.homeroomTeacherName || ''}
                onChange={(e) =>
                  setEditingClass({ ...editingClass, homeroomTeacherName: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="misal: Budi Santoso, S.Pd."
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Kelas'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Major */}
      <Modal
        isOpen={isMajorModalOpen}
        onClose={() => !isSaving && setIsMajorModalOpen(false)}
        title={editingMajor?.id ? 'Ubah Jurusan / Program Keahlian' : 'Tambah Jurusan / Program Keahlian'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveMajor} className="space-y-3 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {actionError}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Kode *</label>
              <input
                type="text"
                required
                value={editingMajor?.code || ''}
                onChange={(e) =>
                  setEditingMajor({ ...editingMajor, code: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="RPL / IPA"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Nama Jurusan *</label>
              <input
                type="text"
                required
                value={editingMajor?.name || ''}
                onChange={(e) => setEditingMajor({ ...editingMajor, name: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="misal: Rekayasa Perangkat Lunak"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Kepala Program / Jurusan</label>
            <input
              type="text"
              value={editingMajor?.headOfMajor || ''}
              onChange={(e) => setEditingMajor({ ...editingMajor, headOfMajor: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="Opsional, misal: Drs. Hendra Wijaya"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsMajorModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Jurusan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Academic Year */}
      <Modal
        isOpen={isYearModalOpen}
        onClose={() => !isSaving && setIsYearModalOpen(false)}
        title={editingYear?.id ? 'Ubah Tahun Ajaran' : 'Tambah Tahun Ajaran'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveYear} className="space-y-3 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {actionError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tahun Pelajaran *</label>
              <input
                type="text"
                required
                value={editingYear?.year || ''}
                onChange={(e) => setEditingYear({ ...editingYear, year: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="misal: 2025/2026"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Semester *</label>
              <select
                value={editingYear?.semester || 'Ganjil'}
                onChange={(e) =>
                  setEditingYear({
                    ...editingYear,
                    semester: e.target.value as 'Ganjil' | 'Genap',
                  })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={Boolean(editingYear?.isActive)}
              onChange={(e) => setEditingYear({ ...editingYear, isActive: e.target.checked })}
              className="rounded border-slate-300 text-slate-900 focus:ring-0"
            />
            <span>Tetapkan sebagai Tahun Ajaran Aktif saat ini</span>
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsYearModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Tahun Ajaran'}
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

      <ConfirmDialog
        isOpen={!!deleteMajorTarget}
        onClose={() => setDeleteMajorTarget(null)}
        onConfirm={handleDeleteMajor}
        title="Hapus Jurusan"
        message={`Apakah Anda yakin ingin menghapus jurusan ${deleteMajorTarget?.name}?`}
      />

      <ConfirmDialog
        isOpen={!!deleteYearTarget}
        onClose={() => setDeleteYearTarget(null)}
        onConfirm={handleDeleteYear}
        title="Hapus Tahun Ajaran"
        message={`Apakah Anda yakin ingin menghapus tahun ajaran ${deleteYearTarget?.year} (${deleteYearTarget?.semester})?`}
      />
    </div>
  );
};
