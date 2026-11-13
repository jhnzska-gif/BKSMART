import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { APIService } from '../../services/api';
import { Badge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { BatchActionBar } from '../common/BatchActionBar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Search, Filter, Trash2 } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(APIService.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Multi-delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);

  const handleRefresh = () => {
    setLogs(APIService.getAuditLogs());
    setSelectedIds(new Set());
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedLogs.map(l => l.id)));
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
    paginatedLogs.length > 0 &&
    paginatedLogs.every(l => selectedIds.has(l.id));

  const handleExecuteMultiDelete = () => {
    const ids = Array.from(selectedIds);
    APIService.deleteMultipleAuditLogs(ids);
    setIsMultiDeleteModalOpen(false);
    handleRefresh();
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Audit Log Keamanan & Aktivitas Sistem</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono border border-emerald-200">
            {filteredLogs.length} Entri Log
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Pencatatan transparan untuk autentikasi, mutasi data siswa, dan akses data privat · Dilengkapi fitur filter, paginasi dan pembersihan massal
        </p>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari user, aksi, atau keterangan log..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Semua Modul</option>
            <option value="AUTH">Autentikasi (AUTH)</option>
            <option value="COUNSELING">Layanan Konseling</option>
            <option value="CASES">Bimbingan Kasus</option>
            <option value="STUDENTS">Data Siswa</option>
            <option value="REFERRALS">Rujukan Wali Kelas</option>
            <option value="REPORTS">Laporan & Ekspor</option>
            <option value="SYSTEM">Sistem Master</option>
          </select>
        </div>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredLogs.length}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteSelected={() => setIsMultiDeleteModalOpen(true)}
        itemName="entri log"
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPaginatedSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Waktu Kejadian</th>
                <th className="px-4 py-3">Pelaku (Pengguna)</th>
                <th className="px-4 py-3">Modul & Aksi</th>
                <th className="px-4 py-3">Rincian Perubahan / Akses</th>
                <th className="px-4 py-3 text-right">Alamat Klien</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-sans">
                    Tidak ada catatan audit yang cocok.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isSelected = selectedIds.has(log.id);
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/60 ${
                        isSelected ? 'bg-slate-50/90' : ''
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(log.id)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500 tabular-nums whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <span className="font-semibold text-slate-900 block">{log.userName}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Role: {log.userRole}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="slate">{log.module}</Badge>
                          <span className="font-bold text-slate-800">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-700 max-w-sm">
                        {log.description}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {log.ipAddress}
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
          totalItems={filteredLogs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[10, 25, 50]}
        />
      </div>

      <ConfirmDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={handleExecuteMultiDelete}
        title="Konfirmasi Hapus Massal Audit Log"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.size} entri log yang dipilih?`}
        confirmLabel={`Hapus ${selectedIds.size} Log`}
      />
    </div>
  );
};
