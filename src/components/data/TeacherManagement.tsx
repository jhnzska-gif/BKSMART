import React, { useState } from 'react';
import { Teacher } from '../../types';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import { Search, Plus, Edit2, Trash2, FileSpreadsheet } from 'lucide-react';

interface TeacherManagementProps {
  onOpenImport?: () => void;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({ onOpenImport }) => {
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
  const [createAccount, setCreateAccount] = useState(true);
  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const classes = APIService.getClasses();

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

  const handleExecuteMultiDelete = async () => {
    const ids = Array.from(selectedIds);
    setActionError(null);
    setIsSaving(true);
    try {
      await APIService.deleteMultipleTeachers(ids);
      await APIService.logAudit(
        currentUser?.id || 'sys',
        currentUser?.name || 'Admin',
        role,
        'MULTI_DELETE_TEACHERS',
        'SYSTEM',
        `Menghapus ${ids.length} data guru/konselor sekaligus`
      );
      setIsMultiDeleteModalOpen(false);
      handleRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menghapus data guru/konselor.');
      setIsMultiDeleteModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher?.name || isSaving) return;

    setActionError(null);
    setIsSaving(true);
    try {
      const saved = await APIService.saveTeacher(editingTeacher);
      if (!editingTeacher.id && createAccount && accountUsername.trim() && accountPassword.trim()) {
        await APIService.saveUser({
          username: accountUsername.trim().toLowerCase().replace(/\s+/g, ''),
          password: accountPassword.trim(),
          name: saved.name,
          email: saved.email,
          phone: saved.phone,
          nipOrNisn: saved.nip,
          assignedClass: saved.role === 'teacher' ? saved.assignedClass : undefined,
          role: saved.role,
          active: true,
        });
      }
      await APIService.logAudit(
        currentUser?.id || 'sys',
        currentUser?.name || 'Admin',
        role,
        editingTeacher.id ? 'UPDATE_TEACHER' : 'CREATE_TEACHER',
        'SYSTEM',
        `Menyimpan data pengajar/konselor: ${saved.name}`
      );

      setIsModalOpen(false);
      setEditingTeacher(null);
      setAccountUsername('');
      setAccountPassword('');
      handleRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menyimpan data guru/konselor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isSaving) return;
    setActionError(null);
    setIsSaving(true);
    try {
      await APIService.deleteTeacher(deleteTarget.id);
      await APIService.logAudit(
        currentUser?.id || 'sys',
        currentUser?.name || 'Admin',
        role,
        'DELETE_TEACHER',
        'SYSTEM',
        `Menghapus data pengajar/konselor: ${deleteTarget.name}`
      );
      setDeleteTarget(null);
      handleRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menghapus data guru/konselor.');
      setDeleteTarget(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Data Guru & Konselor BK</h2>
          <p className="text-xs text-slate-500">
            Daftar tenaga pengajar, Guru BK (Konselor), dan penugasan Wali Kelas · Bisa langsung membuat akun login
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenImport && (
            <button
              type="button"
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import Massal Guru (CSV)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setEditingTeacher({
                role: 'counselor',
                gender: 'L',
              });
              setCreateAccount(true);
              setAccountUsername('');
              setAccountPassword('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru / Konselor</span>
          </button>
        </div>
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
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingTeacher?.id ? 'Ubah Data Tenaga Pendidik' : 'Tambah Guru / Konselor'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          {actionError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {actionError}
            </div>
          )}
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
              {editingTeacher?.role === 'teacher' && classes.length > 0 ? (
                <select
                  value={editingTeacher?.assignedClass || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, assignedClass: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">-- Pilih Kelas Binaan --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              ) : (
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
              )}
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
                placeholder="guru@sekolah.sch.id"
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

          {!editingTeacher?.id && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <label className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span>Sekaligus buatkan akun login pengguna untuk guru ini</span>
              </label>
              {createAccount && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Username *</label>
                    <input
                      type="text"
                      required={createAccount}
                      value={accountUsername}
                      onChange={(e) =>
                        setAccountUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                      placeholder="misal: sitirahma"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Kata Sandi *</label>
                    <input
                      type="text"
                      required={createAccount}
                      minLength={4}
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                      placeholder="Minimal 4 karakter"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-60"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
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
