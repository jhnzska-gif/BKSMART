import React, { useState } from 'react';
import { Teacher } from '../../types';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

export const TeacherManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>(APIService.getTeachers());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Partial<Teacher> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);

  const handleRefresh = () => {
    setTeachers(APIService.getTeachers());
    setSelectedIds(new Set());
  };

  const filteredTeachers = teachers.filter((t) => {
    return (
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nip.includes(searchTerm) ||
      (t.specialization && t.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedTeachers.map(t => t.id)));
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
    paginatedTeachers.length > 0 &&
    paginatedTeachers.every(t => selectedIds.has(t.id));

  const handleExecuteMultiDelete = () => {
    const ids = Array.from(selectedIds);
    APIService.deleteMultipleTeachers(ids);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'Admin',
      role,
      'MULTI_DELETE_TEACHERS',
      'SYSTEM',
      `Menghapus ${ids.length} data guru/konselor sekaligus`
    );
    setIsMultiDeleteModalOpen(false);
    handleRefresh();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher?.name) return;

    APIService.saveTeacher(editingTeacher);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'Admin',
      role,
      editingTeacher.id ? 'UPDATE_TEACHER' : 'CREATE_TEACHER',
      'SYSTEM',
      `Menyimpan data pengajar/konselor: ${editingTeacher.name}`
    );

    setIsModalOpen(false);
    setEditingTeacher(null);
    handleRefresh();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    APIService.deleteTeacher(deleteTarget.id);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'Admin',
      role,
      'DELETE_TEACHER',
      'SYSTEM',
      `Menghapus data pengajar/konselor: ${deleteTarget.name}`
    );
    setDeleteTarget(null);
    handleRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Data Guru & Konselor BK</h2>
          <p className="text-xs text-slate-500">
            Daftar tenaga pengajar, Guru BK (Konselor), dan penugasan Wali Kelas · Fitur multi-delete & paginasi
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTeacher({
              role: 'counselor',
              gender: 'L',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Guru / Konselor</span>
        </button>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama guru, NIP, atau spesialisasi..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredTeachers.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setIsMultiDeleteModalOpen(true)}
        itemName="guru/konselor"
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPaginatedSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Nama & Kontak</th>
                <th className="px-4 py-3">NIP</th>
                <th className="px-4 py-3">Peran / Penugasan</th>
                <th className="px-4 py-3">Spesialisasi / Kelas Binaan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTeachers.map((t) => {
                const isSelected = selectedIds.has(t.id);
                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isSelected ? 'bg-slate-50/90' : ''
                    }`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(t.id)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{t.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{t.email} · {t.phone}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 tabular-nums">{t.nip}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.role === 'counselor' ? 'emerald' : 'amber'}>
                        {t.role === 'counselor' ? 'Guru BK (Konselor)' : 'Wali Kelas / Guru Mapel'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {t.role === 'counselor' ? (
                        <span className="text-slate-800 font-medium">{t.specialization || 'Umum'}</span>
                      ) : (
                        <span className="text-slate-700">Wali Kelas: <strong>{t.assignedClass || '-'}</strong></span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeacher(t);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(t)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredTeachers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher?.id ? 'Ubah Data Tenaga Pendidik' : 'Tambah Guru / Konselor'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              required
              value={editingTeacher?.name || ''}
              onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="misal: Siti Rahmawati, S.Pd., Kons."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">NIP (18 Digit)</label>
              <input
                type="text"
                value={editingTeacher?.nip || ''}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, nip: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="1985..."
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={editingTeacher?.gender || 'L'}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, gender: e.target.value as 'L' | 'P' })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Peran</label>
              <select
                value={editingTeacher?.role || 'counselor'}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, role: e.target.value as 'teacher' | 'counselor' })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="counselor">Guru BK (Konselor)</option>
                <option value="teacher">Guru / Wali Kelas</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                {editingTeacher?.role === 'counselor' ? 'Spesialisasi BK' : 'Kelas Binaan (Wali Kelas)'}
              </label>
              <input
                type="text"
                value={editingTeacher?.role === 'counselor' ? (editingTeacher?.specialization || '') : (editingTeacher?.assignedClass || '')}
                onChange={(e) => {
                  if (editingTeacher?.role === 'counselor') {
                    setEditingTeacher({ ...editingTeacher, specialization: e.target.value });
                  } else {
                    setEditingTeacher({ ...editingTeacher, assignedClass: e.target.value });
                  }
                }}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder={editingTeacher?.role === 'counselor' ? 'misal: Karier & Pribadi' : 'misal: XI RPL 1'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={editingTeacher?.email || ''}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="guru@bksmart.sch.id"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">No HP / WhatsApp</label>
              <input
                type="text"
                value={editingTeacher?.phone || ''}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
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
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Tenaga Pendidik"
        message={`Apakah Anda yakin ingin menghapus data ${deleteTarget?.name}?`}
      />

      <ConfirmDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={handleExecuteMultiDelete}
        title="Konfirmasi Hapus Massal Guru"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.size} data guru/konselor yang dipilih?`}
        confirmLabel={`Hapus ${selectedIds.size} Guru`}
      />
    </div>
  );
};
