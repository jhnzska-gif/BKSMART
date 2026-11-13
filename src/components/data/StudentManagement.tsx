import React, { useState, useEffect } from 'react';
import { Student } from '../../types';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import { Search, Plus, Edit2, Trash2, Download, Upload, Filter, CheckSquare, Send, User } from 'lucide-react';

interface StudentManagementProps {
  onOpenImport?: () => void;
  restrictedToClass?: string;
  onNavigateToReferral?: (studentId: string) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  onOpenImport,
  restrictedToClass,
}) => {
  const { currentUser, role } = useAuth();
  const [students, setStudents] = useState<Student[]>(() => {
    const list = APIService.getStudents();
    return restrictedToClass ? list.filter(s => s.className === restrictedToClass) : list;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Selection state for multi-delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const classes = APIService.getClasses();
  const majors = APIService.getMajors();

  const handleRefresh = () => {
    const list = APIService.getStudents();
    setStudents(restrictedToClass ? list.filter(s => s.className === restrictedToClass) : list);
    setSelectedIds(new Set());
  };

  // Sync state whenever restrictedToClass or role changes
  useEffect(() => {
    handleRefresh();
  }, [restrictedToClass, role]);

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.nis.includes(searchTerm);
    const matchesClass = filterClass === 'all' || s.className === filterClass;
    return matchesSearch && matchesClass;
  });

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allPaginated = new Set(paginatedStudents.map(s => s.id));
      setSelectedIds(allPaginated);
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
    paginatedStudents.length > 0 &&
    paginatedStudents.every(s => selectedIds.has(s.id));

  const handleExecuteMultiDelete = () => {
    const ids = Array.from(selectedIds);
    APIService.deleteMultipleStudents(ids);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'Admin',
      role,
      'MULTI_DELETE_STUDENTS',
      'STUDENTS',
      `Menghapus massal ${ids.length} data siswa`
    );
    setIsMultiDeleteModalOpen(false);
    handleRefresh();
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent?.name) return;

    APIService.saveStudent(editingStudent);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'Admin',
      role,
      editingStudent.id ? 'UPDATE_STUDENT' : 'CREATE_STUDENT',
      'STUDENTS',
      `Menyimpan data siswa: ${editingStudent.name} (${editingStudent.className || 'X RPL 1'})`
    );

    setIsModalOpen(false);
    setEditingStudent(null);
    handleRefresh();
  };

  const handleDeleteStudent = () => {
    if (!deleteTarget) return;
    APIService.deleteStudent(deleteTarget.id);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'Admin',
      role,
      'DELETE_STUDENT',
      'STUDENTS',
      `Menghapus siswa ${deleteTarget.name} (${deleteTarget.nisn})`
    );
    setDeleteTarget(null);
    handleRefresh();
  };

  const handleExportCSV = () => {
    const csvContent = APIService.exportStudentsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data_siswa_bksmart_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isHomeroomTeacher = role === 'teacher';
  const canEdit = role === 'admin' || role === 'counselor' || isHomeroomTeacher;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {restrictedToClass ? `Daftar Siswa Binaan Kelas ${restrictedToClass}` : 'Manajemen Data Siswa'}
            </h2>
            {isHomeroomTeacher && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium border border-amber-200">
                Akses Wali Kelas
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {filteredStudents.length} siswa terdata · Dilengkapi fitur Tambah, Edit, Hapus, Multi-Delete, dan Paginasi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {canEdit && onOpenImport && (
            <button
              type="button"
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setEditingStudent({
                  gender: 'L',
                  className: restrictedToClass || 'XI RPL 1',
                  majorName: 'Rekayasa Perangkat Lunak',
                  academicYear: '2024/2025',
                  status: 'active',
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isHomeroomTeacher ? 'Tambah Siswa Binaan' : 'Tambah Siswa'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, NISN, atau NIS siswa..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {!restrictedToClass && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Batch Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredStudents.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setIsMultiDeleteModalOpen(true)}
        itemName="siswa"
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                {canEdit && (
                  <th className="px-3 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPaginatedSelected}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                      title="Pilih Semua di Halaman Ini"
                    />
                  </th>
                )}
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3">NISN / NIS</th>
                <th className="px-4 py-3">Kelas & Jurusan</th>
                <th className="px-4 py-3">Orang Tua / Wali</th>
                <th className="px-4 py-3">Status</th>
                {canEdit && <th className="px-4 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data siswa yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => {
                  const isSelected = selectedIds.has(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isSelected ? 'bg-slate-50/90' : ''
                      }`}
                    >
                      {canEdit && (
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(s.id)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {s.name ? s.name.substring(0, 2).toUpperCase() : 'SW'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {s.name || 'Nama Belum Diisi'}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>JK: {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                              <span className="text-slate-300">·</span>
                              <span className="font-mono text-slate-600">NIS: {s.nis}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 tabular-nums">
                        <div>{s.nisn}</div>
                        <div className="text-[10px] text-slate-400">NIS: {s.nis}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{s.className}</div>
                        <div className="text-[11px] text-slate-500">{s.majorName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900">{s.parentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{s.parentPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === 'active' ? 'emerald' : 'slate'}>
                          {s.status === 'active' ? 'Aktif' : s.status}
                        </Badge>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudent(s);
                                setIsModalOpen(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                              title="Edit Data Siswa"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(s)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredStudents.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(limit) => {
            setItemsPerPage(limit);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent?.id ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}
        description="Lengkapi NISN dan nomor kontak untuk keperluan koordinasi konseling."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveStudent} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Nama Lengkap Siswa *</label>
              <input
                type="text"
                required
                value={editingStudent?.name || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="misal: Muhammad Alif"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={editingStudent?.gender || 'L'}
                onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as 'L' | 'P' })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">NISN (10 Digit)</label>
              <input
                type="text"
                value={editingStudent?.nisn || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, nisn: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="0061234567"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">NIS</label>
              <input
                type="text"
                value={editingStudent?.nis || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, nis: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="2425001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Kelas</label>
              <select
                value={editingStudent?.className || 'X RPL 1'}
                onChange={(e) => {
                  const selClass = classes.find(c => c.name === e.target.value);
                  setEditingStudent({
                    ...editingStudent,
                    className: e.target.value,
                    classId: selClass?.id || 'c-1',
                    majorName: selClass?.majorName || editingStudent?.majorName,
                  });
                }}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Jurusan</label>
              <select
                value={editingStudent?.majorName || 'Rekayasa Perangkat Lunak'}
                onChange={(e) => setEditingStudent({ ...editingStudent, majorName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {majors.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Nama Orang Tua / Wali</label>
              <input
                type="text"
                value={editingStudent?.parentName || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Nama ayah / ibu / wali"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">No HP Orang Tua / WhatsApp</label>
              <input
                type="text"
                value={editingStudent?.parentPhone || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="0812-xxxx-xxxx"
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
              Simpan Siswa
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Single Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteStudent}
        title="Hapus Data Siswa"
        message={`Apakah Anda yakin ingin menghapus data siswa "${deleteTarget?.name}"?`}
      />

      {/* Multi-Delete Confirmation */}
      <ConfirmDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={handleExecuteMultiDelete}
        title="Konfirmasi Hapus Massal (Multi-Delete)"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.size} siswa terpilih secara sekaligus? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={`Hapus ${selectedIds.size} Siswa`}
      />
    </div>
  );
};
