import React, { useState } from 'react';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [csvContent, setCsvContent] = useState('');
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDownloadTemplate = () => {
    const template = APIService.getStudentCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_siswa_bksmart.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStudents = () => {
    const csvData = APIService.exportStudentsCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data_siswa_lengkap_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!csvContent.trim()) {
      setResultMessage({ type: 'error', text: 'Pilih file CSV atau tempel teks data CSV terlebih dahulu.' });
      return;
    }

    const { importedCount, errors } = APIService.importStudentsFromCSV(csvContent);
    if (importedCount > 0) {
      APIService.logAudit(
        currentUser?.id || 'sys',
        currentUser?.name || 'User',
        role,
        'IMPORT_STUDENTS_CSV',
        'STUDENTS',
        `Berhasil mengimpor ${importedCount} data siswa dari file CSV`
      );
      setResultMessage({
        type: 'success',
        text: `Berhasil mengimpor ${importedCount} siswa ke dalam basis data sekolah.`
      });
      setCsvContent('');
      onSuccess();
    } else {
      setResultMessage({
        type: 'error',
        text: errors.join('\n') || 'Gagal mengimpor file CSV. Periksa format kolom.'
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pusat Import & Export Data Sekolah"
      description="Sinkronisasi data master siswa menggunakan format standar CSV/Excel."
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Tab switch */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setResultMessage(null);
            }}
            className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Import Data Siswa (CSV)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setResultMessage(null);
            }}
            className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Export Data Siswa & Layanan
          </button>
        </div>

        {activeTab === 'import' ? (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="font-semibold text-slate-900">Format Template CSV Resmi</p>
                <p className="text-slate-500 text-[11px]">
                  Gunakan format kolom yang telah disesuaikan dengan struktur PostgreSQL.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template</span>
              </button>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Unggah File CSV / XLSX</label>
              <input
                type="file"
                accept=".csv, text/csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Atau Tempel (Paste) Konten CSV:
              </label>
              <textarea
                rows={4}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="NISN,NIS,Nama Lengkap,Jenis Kelamin,Kelas,Jurusan,Tahun Ajaran,Nama Orang Tua,No HP Ortu,No HP Siswa"
                className="w-full font-mono text-[11px] p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {resultMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  resultMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {resultMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{resultMessage.text}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                Proses Import Siswa
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-600 leading-relaxed">
              Unduh salinan data sekolah dalam format berkas CSV standar untuk kebutuhan backup berkala atau pengolahan di Microsoft Excel.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExportStudents}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold text-slate-900">Export Seluruh Data Peserta Didik</p>
                  <p className="text-[11px] text-slate-500">Mencakup NISN, biodata, rombel, dan kontak darurat</p>
                </div>
                <Download className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
