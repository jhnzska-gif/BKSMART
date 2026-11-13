import React, { useState } from 'react';
import { Assessment, AssessmentSubmission } from '../../types';
import { APIService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { BookOpenCheck, CheckCircle2, UserCheck, Calendar, ArrowRight, Award } from 'lucide-react';

export const AssessmentManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>(APIService.getAssessments());
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>(APIService.getSubmissions());

  // Active taking assessment modal
  const [activeTakingAsm, setActiveTakingAsm] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<AssessmentSubmission | null>(null);

  // Counselor view submissions modal
  const [viewSubmissionsAsm, setViewSubmissionsAsm] = useState<Assessment | null>(null);

  const handleRefresh = () => {
    setAssessments(APIService.getAssessments());
    setSubmissions(APIService.getSubmissions());
  };

  const handleStartAssessment = (asm: Assessment) => {
    setActiveTakingAsm(asm);
    setAnswers({});
    setSubmissionResult(null);
  };

  const handleSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTakingAsm || !currentUser) return;

    const sub = APIService.submitAssessment(
      activeTakingAsm.id,
      currentUser.id,
      currentUser.name,
      currentUser.assignedClass || 'XI RPL 1',
      answers
    );

    APIService.logAudit(
      currentUser.id,
      currentUser.name,
      role,
      'SUBMIT_ASSESSMENT',
      'SYSTEM',
      `Menyelesaikan kuesioner asesmen: ${activeTakingAsm.title}`
    );

    setSubmissionResult(sub);
    handleRefresh();
  };

  const isStudent = role === 'student';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Asesmen & Kuesioner Bimbingan Konseling</h2>
        <p className="text-xs text-slate-500">
          Pemetaan diagnostik non-kognitif, gaya belajar siswa, dan Angket Kebutuhan Peserta Didik (AKPD)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((asm) => {
          const userSub = submissions.find(
            s => s.assessmentId === asm.id && (s.studentId === currentUser?.id || s.studentName === currentUser?.name)
          );
          const asmSubmissions = submissions.filter(s => s.assessmentId === asm.id);

          return (
            <div key={asm.id} className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="indigo">{asm.code}</Badge>
                  <span className="text-[11px] text-slate-500 font-mono">Batas: {asm.deadline}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{asm.title}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{asm.description}</p>
                <div className="mt-3 text-[11px] text-slate-500 font-medium">
                  Sasaran: <strong>{asm.targetClass}</strong> · {asm.questions.length} Butir Pertanyaan
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span className="font-mono font-bold text-slate-900">{asm.submissionCount}</span> / {asm.totalTarget} Siswa Mengisi
                </div>

                {isStudent ? (
                  userSub ? (
                    <button
                      type="button"
                      onClick={() => setSubmissionResult(userSub)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Lihat Hasil Rekomendasi</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartAssessment(asm)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                    >
                      <span>Mulai Mengisi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewSubmissionsAsm(asm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Lihat Rekap ({asmSubmissions.length})</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Taking Assessment Interactive Modal (Student) */}
      <Modal
        isOpen={!!activeTakingAsm && !submissionResult}
        onClose={() => setActiveTakingAsm(null)}
        title={activeTakingAsm?.title || 'Kuesioner BK'}
        description="Jawab pertanyaan secara jujur sesuai kebiasaan dan kenyamanan belajar Anda."
        maxWidth="2xl"
      >
        {activeTakingAsm && (
          <form onSubmit={handleSubmitQuiz} className="space-y-5 text-xs">
            <div className="space-y-4">
              {activeTakingAsm.questions.map((q, idx) => (
                <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <p className="font-semibold text-slate-900 leading-snug">
                    {idx + 1}. {q.text}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    {q.options?.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                          answers[q.id] === opt.value
                            ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          required
                          value={opt.value}
                          checked={answers[q.id] === opt.value}
                          onChange={() => setAnswers({ ...answers, [q.id]: opt.value })}
                          className="mt-0.5 text-blue-600 focus:ring-0"
                        />
                        <span className="leading-relaxed">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Data digunakan murni untuk keperluan bimbingan belajar non-klinis.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTakingAsm(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Kirim Jawaban Asesmen
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Submission Result Feedback Modal */}
      <Modal
        isOpen={!!submissionResult}
        onClose={() => {
          setSubmissionResult(null);
          setActiveTakingAsm(null);
        }}
        title="Hasil Pemetaan & Rekomendasi Bimbingan Belajar"
        description="Hasil kuesioner non-kognitif ini membantu merancang strategi belajar paling nyaman untuk Anda."
        maxWidth="lg"
      >
        {submissionResult && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Tipe Dominan Terpetakan</span>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">
                  {submissionResult.resultSummary.dominantType || 'Seimbang'}
                </p>
                <p className="text-[11px] text-slate-300 mt-1">Siswa: {submissionResult.studentName} ({submissionResult.studentClass})</p>
              </div>
              <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-950 space-y-1.5">
              <h4 className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Rekomendasi Strategi Belajar Guru BK:</span>
              </h4>
              <p className="text-slate-700 leading-relaxed text-xs">
                {submissionResult.resultSummary.counselorRecommendation ||
                  'Gunakan media visual warna-warni dan diskusikan materi sulit bersama kelompok belajar.'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              <strong>Pemberitahuan Etika:</strong> Hasil asesmen ini bukan merupakan diagnosis medis maupun psikologis klinis. Hasil ini digunakan Guru BK sebagai panduan penyesuaian metode belajar dan pemilihan materi konseling.
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSubmissionResult(null);
                  setActiveTakingAsm(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Counselor View Submissions List Modal */}
      <Modal
        isOpen={!!viewSubmissionsAsm}
        onClose={() => setViewSubmissionsAsm(null)}
        title={`Rekap Pengisian: ${viewSubmissionsAsm?.title}`}
        description="Daftar peserta didik yang telah menyelesaikan kuesioner"
        maxWidth="2xl"
      >
        {viewSubmissionsAsm && (
          <div className="space-y-3 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Siswa</th>
                    <th className="px-3 py-2">Kelas</th>
                    <th className="px-3 py-2">Hasil Pemetaan</th>
                    <th className="px-3 py-2">Waktu Pengisian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.filter(s => s.assessmentId === viewSubmissionsAsm.id).map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-semibold text-slate-900">{sub.studentName}</td>
                      <td className="px-3 py-2 text-slate-600">{sub.studentClass}</td>
                      <td className="px-3 py-2 font-medium text-emerald-700">
                        {sub.resultSummary.dominantType || 'Lengkap'}
                      </td>
                      <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">
                        {new Date(sub.submittedAt).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewSubmissionsAsm(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
