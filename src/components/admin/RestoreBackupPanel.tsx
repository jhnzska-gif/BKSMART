import React, { useState } from 'react';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  HardDriveDownload,
} from 'lucide-react';

interface RestoreBackupPanelProps {
  onOpenCsvModal?: () => void;
}

export const RestoreBackupPanel: React.FC<RestoreBackupPanelProps> = ({ onOpenCsvModal }) => {
  const { currentUser, role } = useAuth();

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [parsedBackup, setParsedBackup] = useState<Record<string, unknown> | null>(null);
  const [backupFileName, setBackupFileName] = useState<string>('');
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const users = APIService.getUsers();
  const students = APIService.getStudents();
  const sessions = APIService.getCounselingSessions();
  const cases = APIService.getCases();

  const handleDownloadFullBackup = async () => {
    setIsBackingUp(true);
    setStatusMessage(null);
    try {
      const snapshot = await APIService.createFullBackup();
      const jsonStr = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `bksmart_backup_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      APIService.logAudit(
        currentUser?.id || 'sys',
        currentUser?.name || 'Admin',
        role,
        'BACKUP_DATABASE',
        'STUDENTS',
        'Mengunduh salinan backup penuh basis data BKSmart (.json)'
      );

      setStatusMessage({
        type: 'success',
        text: 'File backup lengkap (.json) berhasil dibuat dan diunduh.',
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Gagal membuat file backup basis data.',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExportStudentsCsv = () => {
    const csvData = APIService.exportStudentsCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `backup_siswa_bksmart_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setStatusMessage({
      type: 'success',
      text: 'Data siswa berhasil diekspor sebagai cadangan CSV.',
    });
  };

  const handleUploadBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        const json = JSON.parse(text);
        if (!json || typeof json !== 'object') {
          throw new Error('Struktur JSON tidak valid.');
        }
        const dataBlock = (json.data && typeof json.data === 'object' ? json.data : json) as Record<
          string,
          unknown
        >;
        const hasKnownArray =
          Array.isArray(dataBlock.students) ||
          Array.isArray(dataBlock.users) ||
          Array.isArray(dataBlock.counselingSessions);

        if (!hasKnownArray) {
          throw new Error('File bukan format backup resmi BKSmart.');
        }

        setParsedBackup(json as Record<string, unknown>);
        setBackupFileName(file.name);
      } catch (err) {
        setParsedBackup(null);
        setBackupFileName('');
        setStatusMessage({
          type: 'error',
          text:
            err instanceof Error
              ? err.message
              : 'Gagal membaca file backup. Pastikan formatnya .json valid.',
        });
      }
    };
    reader.readAsText(file);
  };

  const getPreviewCounts = () => {
    if (!parsedBackup) return null;
    const d = (
      parsedBackup.data && typeof parsedBackup.data === 'object'
        ? parsedBackup.data
        : parsedBackup
    ) as Record<string, unknown>;
    return {
      users: Array.isArray(d.users) ? d.users.length : 0,
      students: Array.isArray(d.students) ? d.students.length : 0,
      counselingSessions: Array.isArray(d.counselingSessions) ? d.counselingSessions.length : 0,
      cases: Array.isArray(d.cases) ? d.cases.length : 0,
      referrals: Array.isArray(d.referrals) ? d.referrals.length : 0,
    };
  };

  const handleConfirmRestore = async () => {
    if (!parsedBackup) return;
    setIsConfirmRestoreOpen(false);
    setIsRestoring(true);
    setStatusMessage(null);

    const result = await APIService.restoreFullBackup(parsedBackup);
    if (result.ok) {
      APIService.logAudit(
        currentUser?.id || 'sys',
        currentUser?.name || 'Admin',
        role,
        'RESTORE_DATABASE',
        'STUDENTS',
        `Memulihkan data dari backup ${backupFileName || 'JSON'}`
      );
      setStatusMessage({
        type: 'success',
        text: `Restore berhasil! Dipulihkan: ${result.counts.students || 0} siswa, ${result.counts.users || 0} pengguna, ${result.counts.counselingSessions || 0} sesi konseling, dan ${result.counts.cases || 0} kasus.`,
      });
      setParsedBackup(null);
      setBackupFileName('');
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error || 'Gagal memulihkan database dari file backup.',
      });
    }
    setIsRestoring(false);
  };

  const previewCounts = getPreviewCounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Restore & Backup Database
          </h2>
          <p className="text-xs text-slate-500">
            Pusat pencadangan berkala seluruh basis data sekolah dan pemulihan snapshot data
          </p>
        </div>

        {onOpenCsvModal && (
          <button
            type="button"
            onClick={onOpenCsvModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Batch Siswa (CSV)</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Data Pengguna</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{users.length}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Data Siswa</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{students.length}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Sesi Konseling</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{sessions.length}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium block">Kasus & Tindak Lanjut</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{cases.length}</span>
        </div>
      </div>

      {/* Backup & Restore Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                <HardDriveDownload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Backup Basis Data</h3>
                <p className="text-[11px] text-slate-500">
                  Unduh salinan arsip database BKSmart untuk penyimpanan aman
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
              Snapshot JSON menyimpan seluruh data pengguna, siswa, guru, kelas, sesi konseling,
              rujukan wali kelas, kasus, program BK, dan materi dalam satu berkas terstruktur.
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={isBackingUp}
              onClick={handleDownloadFullBackup}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>{isBackingUp ? 'Menyiapkan Backup...' : 'Unduh Full Backup Database (.json)'}</span>
              </span>
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleExportStudentsCsv}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                <span>Cadangkan Daftar Siswa Saja (.csv)</span>
              </span>
              <Download className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Restore Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Restore Basis Data</h3>
                <p className="text-[11px] text-slate-500">
                  Pulihkan data dari file backup snapshot (.json) ke database
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Pilih File Backup Snapshot (.json)
              </label>
              <input
                type="file"
                accept=".json, application/json"
                onChange={handleUploadBackupJson}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
              />
            </div>

            {previewCounts && (
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
                <p className="font-semibold text-emerald-950">
                  Pratinjau File: <span className="font-mono">{backupFileName}</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-emerald-900">
                  <span>Pengguna: {previewCounts.users}</span>
                  <span>Siswa: {previewCounts.students}</span>
                  <span>Konseling: {previewCounts.counselingSessions}</span>
                  <span>Rujukan: {previewCounts.referrals}</span>
                  <span>Kasus: {previewCounts.cases}</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!parsedBackup || isRestoring}
            onClick={() => setIsConfirmRestoreOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span>{isRestoring ? 'Memulihkan Data...' : 'Pulihkan Database dari Backup'}</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmRestoreOpen}
        onClose={() => setIsConfirmRestoreOpen(false)}
        onConfirm={handleConfirmRestore}
        title="Konfirmasi Restore Database"
        message={`Pulihkan dan perbarui data basis data dari file "${backupFileName}"? Data dengan ID yang sama akan disinkronkan dengan isi snapshot backup.`}
        confirmLabel="Ya, Pulihkan Sekarang"
      />
    </div>
  );
};
