/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { CounselorDashboard } from './components/dashboard/CounselorDashboard';
import { TeacherDashboard } from './components/dashboard/TeacherDashboard';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { PrincipalDashboard } from './components/dashboard/PrincipalDashboard';
import { StudentManagement } from './components/data/StudentManagement';
import { UserManagement } from './components/data/UserManagement';
import { TeacherManagement } from './components/data/TeacherManagement';
import { AcademicManagement } from './components/data/AcademicManagement';
import { CounselingManagement } from './components/counseling/CounselingManagement';
import { ReferralManagement } from './components/counseling/ReferralManagement';
import { CaseManagement } from './components/cases/CaseManagement';
import { BKProgramManagement } from './components/programs/BKProgramManagement';
import { AssessmentManagement } from './components/programs/AssessmentManagement';
import { MaterialManagement } from './components/programs/MaterialManagement';
import { ReportManagement } from './components/reports/ReportManagement';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { ImportExportModal } from './components/import-export/ImportExportModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { UserRole } from './types';

const AppContent: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // If no user is logged in, show the comprehensive multi-role Login Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Render main application shell
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (role === 'admin') return <AdminDashboard onNavigate={setActiveTab} />;
        if (role === 'counselor') return <CounselorDashboard onNavigate={setActiveTab} />;
        if (role === 'teacher') return <TeacherDashboard onNavigate={setActiveTab} />;
        if (role === 'student') return <StudentDashboard onNavigate={setActiveTab} />;
        if (role === 'principal') return <PrincipalDashboard onNavigate={setActiveTab} />;
        return <CounselorDashboard onNavigate={setActiveTab} />;

      case 'users':
        return <UserManagement />;

      case 'students':
        return <StudentManagement onOpenImport={() => setIsImportModalOpen(true)} />;

      case 'my_students':
        return <StudentManagement restrictedToClass={currentUser.assignedClass || 'XI RPL 1'} />;

      case 'teachers':
        return <TeacherManagement />;

      case 'academic':
        return <AcademicManagement />;

      case 'counseling':
        return <CounselingManagement />;

      case 'student_counseling':
        return <CounselingManagement studentMode={true} />;

      case 'referrals':
        return <ReferralManagement />;

      case 'cases':
        return <CaseManagement />;

      case 'programs':
        return <BKProgramManagement />;

      case 'assessments':
        return <AssessmentManagement />;

      case 'materials':
        return <MaterialManagement />;

      case 'reports':
        return <ReportManagement />;

      case 'import_export':
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
            <h3 className="text-base font-bold text-slate-900">Manajemen Import & Export Berkas</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Gunakan modal terpadu untuk sinkronisasi batch data peserta didik menggunakan CSV template resmi atau cadangkan data sekolah.
            </p>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              Buka Jendela Import / Export
            </button>
          </div>
        );

      case 'audit_logs':
        return <AuditLogViewer />;

      default:
        return <CounselorDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        activeTab={activeTab}
      />

      <div className="flex-1 flex flex-row">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      {/* Global Modals */}
      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          setActiveTab('students');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
