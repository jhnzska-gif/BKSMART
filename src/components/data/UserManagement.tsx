import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [users, setUsers] = useState<User[]>(APIService.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Multi-delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const handleRefresh = () => {
    setUsers(APIService.getUsers());
    setSelectedIds(new Set());
  };

  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Don't select the current logged-in user for deletion safety
      const validIds = paginatedUsers
        .filter(u => u.id !== currentUser?.id)
        .map(u => u.id);
      setSelectedIds(new Set(validIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    if (id === currentUser?.id) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const isAllPaginatedSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.filter(u => u.id !== currentUser?.id).every(u => selectedIds.has(u.id));

  const handleExecuteMultiDelete = () => {
    const ids = Array.from(selectedIds);
    APIService.deleteMultipleUsers(ids);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'Admin',
      role,
      'MULTI_DELETE_USERS',
      'AUTH',
      `Menghapus ${ids.length} akun pengguna sekaligus`
    );
    setIsMultiDeleteModalOpen(false);
    handleRefresh();
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.name || !editingUser?.username) return;

    APIService.saveUser(editingUser);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'Admin',
      role,
      editingUser.id ? 'UPDATE_USER' : 'CREATE_USER',
      'AUTH',
      `Menyimpan akun pengguna: ${editingUser.name} (${editingUser.role})`
    );

    setIsModalOpen(false);
    setEditingUser(null);
    handleRefresh();
  };

  const handleDeleteUser = () => {
    if (!deleteTarget) return;
    APIService.deleteUser(deleteTarget.id);
    APIService.logAudit(
      currentUser?.id || 'sys',
      currentUser?.name || 'Admin',
      role,
      'DELETE_USER',
      'AUTH',
      `Menghapus pengguna: ${deleteTarget.name} (${deleteTarget.username})`
    );
    setDeleteTarget(null);
    handleRefresh();
  };

  const roleBadges: Record<UserRole, { variant: 'indigo' | 'emerald' | 'amber' | 'blue' | 'crimson'; label: string }> = {
    admin: { variant: 'indigo', label: 'Administrator' },
    counselor: { variant: 'emerald', label: 'Guru BK' },
    teacher: { variant: 'amber', label: 'Wali Kelas' },
    student: { variant: 'blue', label: 'Siswa' },
    principal: { variant: 'crimson', label: 'Kepala Sekolah' },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Manajemen Pengguna & RBAC</h2>
          <p className="text-xs text-slate-500">
            Kelola hak akses 5 role (Admin, Guru BK, Wali Kelas, Siswa, Kepala Sekolah) · Didukung multi-delete
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingUser({
              role: 'counselor',
              active: true,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pengguna berdasarkan nama, username, atau role..."
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
        totalCount={filteredUsers.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setIsMultiDeleteModalOpen(true)}
        itemName="pengguna"
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
                <th className="px-4 py-3">Nama & Email</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Peran (Role)</th>
                <th className="px-4 py-3">NIP / NISN</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const conf = roleBadges[u.role] || { variant: 'slate', label: u.role };
                  const isSelected = selectedIds.has(u.id);
                  const isSelf = u.id === currentUser?.id;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isSelected ? 'bg-slate-50/90' : ''
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isSelf}
                          checked={isSelected}
                          onChange={() => handleToggleSelect(u.id)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isSelf ? 'Tidak dapat menghapus akun Anda sendiri' : ''}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">@{u.username}</td>
                      <td className="px-4 py-3">
                        <Badge variant={conf.variant}>{conf.label}</Badge>
                        {u.assignedClass && (
                          <span className="block text-[10px] text-slate-500 mt-0.5">Rombel: {u.assignedClass}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 tabular-nums">
                        {u.nipOrNisn || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.active ? 'emerald' : 'slate'}>
                          {u.active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(u)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            title="Hapus Pengguna"
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

        <Pagination
          currentPage={currentPage}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>

      {/* Modal Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser?.id ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              required
              value={editingUser?.name || ''}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="misal: Siti Nurhaliza, S.Pd."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={editingUser?.username || ''}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="sitinurhaliza"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Role / Peran Akses *</label>
              <select
                value={editingUser?.role || 'counselor'}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="admin">Admin</option>
                <option value="counselor">Guru BK</option>
                <option value="teacher">Guru / Wali Kelas</option>
                <option value="student">Siswa</option>
                <option value="principal">Kepala Sekolah</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Alamat Email</label>
            <input
              type="email"
              value={editingUser?.email || ''}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="nama@sekolah.sch.id"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">NIP atau NISN</label>
              <input
                type="text"
                value={editingUser?.nipOrNisn || ''}
                onChange={(e) => setEditingUser({ ...editingUser, nipOrNisn: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="1985..."
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Kelas Binaan (Wali Kelas)</label>
              <input
                type="text"
                value={editingUser?.assignedClass || ''}
                onChange={(e) => setEditingUser({ ...editingUser, assignedClass: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="misal: XI RPL 1"
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
              Simpan Pengguna
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title="Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun ${deleteTarget?.name} (@${deleteTarget?.username})?`}
      />

      <ConfirmDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={handleExecuteMultiDelete}
        title="Konfirmasi Hapus Massal Akun"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.size} akun pengguna yang dipilih?`}
        confirmLabel={`Hapus ${selectedIds.size} Akun`}
      />
    </div>
  );
};
