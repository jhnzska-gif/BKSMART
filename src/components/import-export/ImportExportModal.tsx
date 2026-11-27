import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import {
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  School,
  Users,
  GraduationCap,
} from 'lucide-react';

export type ImportModalTab = 'academic' | 'teachers' | 'students' | 'export';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: ImportModalTab;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'students',
}) => {
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState<ImportModalTab>(initialTab);
  const [csvContent, setCsvContent] = useState('');
  const [createUserAccounts, setCreateUserAccounts] = useState(true);
  const [autoCreateAcademic, setAutoCreateAcademic] = useState(true);
  const [defaultPassword, setDefaultPassword] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setResultMessage(null);
    }
  }, [isOpen, initialTab]);

  const switchTab = (tab: ImportModalTab) => {
    setActiveTab(tab);
    setCsvContent('');
    setResultMessage(null);
  };

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadWorkbook = (rows: string[][], sheetName: string, filename: string) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const colWidths = (rows[0] || []).map((header, colIdx) => {
      const maxLen = Math.max(
        String(header || '').length,
        ...rows.map((r) => String(r[colIdx] || '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 4, 14), 34) };
    });
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };

  const handleDownloadExcelTemplate = () => {
    if (activeTab === 'academic') {
      downloadWorkbook(
        APIService.getAcademicTemplateRows(),
        'Kelas & Jurusan',
        'template_kelas_jurusan_bksmart.xlsx'
      );
    } else if (activeTab === 'teachers') {
      downloadWorkbook(
        APIService.getTeacherTemplateRows(),
        'Guru & Konselor',
        'template_guru_bksmart.xlsx'
      );
    } else {
      downloadWorkbook(
        APIService.getStudentTemplateRows(),
        'Data Siswa',
        'template_siswa_bksmart.xlsx'
      );
    }
  };

  const handleDownloadCsvTemplate = () => {
    if (activeTab === 'academic') {
      triggerDownload(APIService.getAcademicCSVTemplate(), 'template_kelas_jurusan_bksmart.csv');
    } else if (activeTab === 'teachers') {
      triggerDownload(APIService.getTeacherCSVTemplate(), 'template_guru_bksmart.csv');
    } else {
      triggerDownload(APIService.getStudentCSVTemplate(), 'template_siswa_bksmart.csv');
    }
  };

  const handleExportStudentsExcel = () => {
    downloadWorkbook(
      APIService.getExportStudentRows(),
      'Data Siswa',
      `data_siswa_lengkap_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const handleExportStudents = () => {
    triggerDownload(
      APIService.exportStudentsCSV(),
      `data_siswa_lengkap_${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResultMessage(null);

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
            header: 1,
            raw: false,
            defval: '',
          });
          const lines = aoa
            .filter((row) => Array.isArray(row) && row.some((c) => String(c ?? '').trim().length > 0))
            .map((row) => row.map((c) => String(c ?? '').replace(/[\r\n\t]+/g, ' ').trim()).join('\t'));
          setCsvContent(lines.join('\n'));
        } catch (err) {
          setResultMessage({
            type: 'error',
            text:
              err instanceof Error
                ? `Gagal membaca file Excel: ${err.message}`
                : 'Gagal membaca file Excel (.xlsx / .xls).',
          });
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!csvContent.trim() || isImporting) {
      setResultMessage({
        type: 'error',
        text: 'Unggah file Excel (.xlsx) / CSV atau tempel (paste) data dari Excel terlebih dahulu.',
      });
      return;
    }

    setIsImporting(true);
    setResultMessage(null);

    try {
      if (activeTab === 'academic') {
        const res = await APIService.importAcademicFromCSV(csvContent);
        const total = res.academicYearsCreated + res.majorsCreated + res.classesCreated;
        if (total > 0) {
          await APIService.logAudit(
            currentUser?.id || 'sys',
            currentUser?.name || 'Admin',
            role,
            'IMPORT_ACADEMIC_CSV',
            'SYSTEM',
            `Import massal akademik: ${res.academicYearsCreated} tahun ajaran, ${res.majorsCreated} jurusan, ${res.classesCreated} kelas`
          );
          setResultMessage({
            type: 'success',
            text: `Berhasil menyimpan ${res.academicYearsCreated} tahun ajaran, ${res.majorsCreated} jurusan, dan ${res.classesCreated} kelas ke NeonDB.`,
          });
          setCsvContent('');
          onSuccess();
        } else {
          setResultMessage({
            type: 'error',
            text:
              res.errors.join(' ') ||
              'Tidak ada data baru yang tersimpan. Periksa format kolom Excel/CSV Anda.',
          });
        }
      } else if (activeTab === 'teachers') {
        const res = await APIService.importTeachersFromCSV(csvContent, {
          createUserAccounts: role === 'admin' && createUserAccounts,
          defaultPassword,
        });
        if (res.importedCount > 0) {
          await APIService.logAudit(
            currentUser?.id || 'sys',
            currentUser?.name || 'Admin',
            role,
            'IMPORT_TEACHERS_CSV',
            'SYSTEM',
            `Import massal ${res.importedCount} guru/konselor (${res.accountsCreated} akun login dibuat)`
          );
          setResultMessage({
            type: 'success',
            text: `Berhasil mengimpor ${res.importedCount} Guru BK / Wali Kelas${
              res.classesCreated > 0 ? `, ${res.classesCreated} kelas baru` : ''
            }${res.accountsCreated > 0 ? `, serta ${res.accountsCreated} akun login` : ''} ke NeonDB.`,
          });
          setCsvContent('');
          onSuccess();
        } else {
          setResultMessage({
            type: 'error',
            text: res.errors.join(' ') || 'Gagal mengimpor data guru. Periksa format kolom.',
          });
        }
      } else if (activeTab === 'students') {
        const res = await APIService.importStudentsFromCSV(csvContent, {
          createUserAccounts: role === 'admin' && createUserAccounts,
          defaultPassword,
          autoCreateClassesAndMajors: autoCreateAcademic,
        });
        if (res.importedCount > 0) {
          await APIService.logAudit(
            currentUser?.id || 'sys',
            currentUser?.name || 'User',
            role,
            'IMPORT_STUDENTS_CSV',
            'STUDENTS',
            `Import massal ${res.importedCount} siswa (${res.classesCreated} kelas, ${res.majorsCreated} jurusan, ${res.accountsCreated} akun)`
          );
          const extras: string[] = [];
          if (res.majorsCreated > 0) extras.push(`${res.majorsCreated} jurusan`);
          if (res.classesCreated > 0) extras.push(`${res.classesCreated} kelas`);
          if (res.accountsCreated > 0) extras.push(`${res.accountsCreated} akun login`);
          setResultMessage({
            type: 'success',
            text: `Berhasil mengimpor ${res.importedCount} siswa ke NeonDB${
              extras.length > 0 ? ` (otomatis dibuat: ${extras.join(', ')})` : ''
            }.`,
          });
          setCsvContent('');
          onSuccess();
        } else {
          setResultMessage({
            type: 'error',
            text: res.errors.join(' ') || 'Gagal mengimpor file. Periksa format kolom.',
          });
        }
      }
    } catch (err) {
      setResultMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menyimpan data massal ke NeonDB.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getTabMeta = () => {
    if (activeTab === 'academic') {
      return {
        title: 'Template Excel Kelas, Jurusan & Tahun Ajaran',
        desc: 'Unduh file .xlsx agar setiap kolom langsung rapi di kolom A–I Excel, isi baris ke bawah, lalu unggah kembali.',
        placeholder:
          'Tahun Ajaran\tSemester\tAktif\tKode Jurusan\tNama Jurusan\tKepala Jurusan\tNama Kelas\tTingkat\tWali Kelas',
        cta: 'Proses Import Kelas & Jurusan',
      };
    }
    if (activeTab === 'teachers') {
      return {
        title: 'Template Excel Guru BK & Wali Kelas',
        desc: 'Unduh file .xlsx, isi seluruh nama Guru BK (counselor) & Wali Kelas (teacher) beserta akun loginnya.',
        placeholder:
          'NIP\tNama Lengkap\tJenis Kelamin\tPeran (counselor/teacher)\tSpesialisasi / Kelas Binaan\tEmail\tNo HP\tUsername\tKata Sandi',
        cta: 'Proses Import Guru & Konselor',
      };
    }
    return {
      title: 'Template Excel Data Siswa Asli',
      desc: 'Unduh file .xlsx, isi atau tempel daftar siswa dari Dapodik/Excel — kelas, jurusan & akun siswa dibuat otomatis.',
      placeholder:
        'NISN\tNIS\tNama Lengkap\tJenis Kelamin (L/P)\tKelas\tJurusan\tTahun Ajaran\tNama Orang Tua\tNo HP Ortu\tNo HP Siswa',
      cta: 'Proses Import Siswa',
    };
  };

  const meta = getTabMeta();

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isImporting && onClose()}
      title="Pusat Import Massal Data Sekolah (Excel / CSV)"
      description="Masukkan seluruh data asli sekolah sekaligus tanpa input manual satu per satu."
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Tip Banner */}
        <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 text-indigo-950 flex items-start gap-2.5">
          <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Cara paling rapi di Excel Indonesia:</span>{' '}
            Klik <strong>Unduh Template (.xlsx)</strong> supaya kolom A, B, C langsung terpisah rapi di
            Microsoft Excel (tidak menumpuk di kolom A). Setelah diisi dan di-Save di Excel, langsung
            unggah file <code className="font-mono">.xlsx</code> tersebut di bawah ini.
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex flex-wrap border-b border-slate-200 gap-1">
          {role === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => switchTab('academic')}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
                  activeTab === 'academic'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>1. Kelas & Jurusan</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab('teachers')}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
                  activeTab === 'teachers'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>2. Guru BK & Wali Kelas</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => switchTab('students')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{role === 'admin' ? '3. Data Siswa' : 'Import Siswa (Excel / CSV)'}</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('export')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Export Data
          </button>
        </div>

        {activeTab !== 'export' ? (
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="font-semibold text-slate-900">{meta.title}</p>
                <p className="text-slate-500 text-[11px]">{meta.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 transition-colors"
                  title="Unduh versi CSV"
                >
                  .csv
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Unggah File Excel (.xlsx / .xls) atau CSV (.csv)
              </label>
              <input
                type="file"
                accept=".xlsx, .xls, .csv, text/csv, .txt"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Pratinjau / Copy-Paste Langsung dari Excel & Google Sheets:
              </label>
              <textarea
                rows={5}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={meta.placeholder}
                className="w-full font-mono text-[11px] p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {activeTab === 'students' && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCreateAcademic}
                    onChange={(e) => setAutoCreateAcademic(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Otomatis buatkan Kelas, Jurusan & Tahun Ajaran jika belum ada di sistem</span>
                </label>

                {role === 'admin' && (
                  <>
                    <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createUserAccounts}
                        onChange={(e) => setCreateUserAccounts(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0"
                      />
                      <span>Sekaligus buatkan akun login siswa otomatis (Username = NISN)</span>
                    </label>
                    {createUserAccounts && (
                      <div className="flex items-center gap-2 pl-6">
                        <span className="text-[11px] text-slate-600">Password Awal Default:</span>
                        <input
                          type="text"
                          value={defaultPassword}
                          onChange={(e) => setDefaultPassword(e.target.value)}
                          className="px-2 py-1 text-[11px] font-mono bg-white border border-slate-300 rounded w-52"
                          placeholder="Kosong = gunakan NIS siswa"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'teachers' && role === 'admin' && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createUserAccounts}
                    onChange={(e) => setCreateUserAccounts(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Sekaligus buatkan akun login Guru BK & Wali Kelas otomatis</span>
                </label>
                {createUserAccounts && (
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-[11px] text-slate-600">
                      Password Default (jika kolom sandi kosong):
                    </span>
                    <input
                      type="text"
                      value={defaultPassword}
                      onChange={(e) => setDefaultPassword(e.target.value)}
                      className="px-2 py-1 text-[11px] font-mono bg-white border border-slate-300 rounded w-48"
                      placeholder="Kosong = 6 digit akhir NIP"
                    />
                  </div>
                )}
              </div>
            )}

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
                disabled={isImporting}
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={handleExecuteImport}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs disabled:opacity-60"
              >
                {isImporting ? 'Menyimpan ke NeonDB...' : meta.cta}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-600 leading-relaxed">
              Unduh salinan data peserta didik dalam format Excel (.xlsx) agar kolom langsung rapi
              atau format berkas CSV standar.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExportStudentsExcel}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    Export Seluruh Data Peserta Didik (.xlsx Excel)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Kolom rapi siap edit langsung di Microsoft Excel
                  </p>
                </div>
                <Download className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={handleExportStudents}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    Export Data Peserta Didik (.csv)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Format CSV standar untuk kompatibilitas umum
                  </p>
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
