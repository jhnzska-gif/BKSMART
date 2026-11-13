import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  AlertOctagon,
  FileText,
  BarChart3,
  FileSpreadsheet,
  ShieldAlert,
  BookOpenCheck,
  FolderTree,
  Send,
  Award,
  X,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { role, logout } = useAuth();

  interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    roles: string[];
    badge?: string;
  }

  const allNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['admin', 'counselor', 'teacher', 'student', 'principal'],
    },
    // Admin Module
    {
      id: 'users',
      label: 'Manajemen Pengguna',
      icon: <Users className="w-4 h-4" />,
      roles: ['admin'],
    },
    {
      id: 'students',
      label: 'Data Siswa',
      icon: <GraduationCap className="w-4 h-4" />,
      roles: ['admin', 'counselor'],
    },
    {
      id: 'my_students',
      label: 'Siswa Binaan (Kelas)',
      icon: <GraduationCap className="w-4 h-4" />,
      roles: ['teacher'],
    },
    {
      id: 'teachers',
      label: 'Data Guru & Konselor',
      icon: <Award className="w-4 h-4" />,
      roles: ['admin'],
    },
    {
      id: 'academic',
      label: 'Kelas & Jurusan',
      icon: <FolderTree className="w-4 h-4" />,
      roles: ['admin'],
    },
    // Counseling & Services
    {
      id: 'counseling',
      label: 'Layanan Konseling',
      icon: <CalendarCheck className="w-4 h-4" />,
      roles: ['counselor', 'admin'],
      badge: 'Aktif',
    },
    {
      id: 'student_counseling',
      label: 'Jadwal & Konseling Saya',
      icon: <CalendarCheck className="w-4 h-4" />,
      roles: ['student'],
    },
    {
      id: 'referrals',
      label: 'Rujukan & Tindak Lanjut',
      icon: <Send className="w-4 h-4" />,
      roles: ['counselor', 'teacher', 'admin'],
    },
    {
      id: 'cases',
      label: 'Bimbingan Kasus',
      icon: <AlertOctagon className="w-4 h-4" />,
      roles: ['counselor', 'principal', 'admin'],
    },
    // Programs & Assessments
    {
      id: 'programs',
      label: 'Program BK (4 Bidang)',
      icon: <ClipboardList className="w-4 h-4" />,
      roles: ['counselor', 'principal', 'admin'],
    },
    {
      id: 'assessments',
      label: 'Asesmen & Kuesioner',
      icon: <BookOpenCheck className="w-4 h-4" />,
      roles: ['counselor', 'student', 'admin'],
    },
    {
      id: 'materials',
      label: 'Materi & Tugas BK',
      icon: <FileText className="w-4 h-4" />,
      roles: ['counselor', 'student', 'teacher', 'admin'],
    },
    // Reports & Analytics
    {
      id: 'reports',
      label: 'Laporan & Statistik',
      icon: <BarChart3 className="w-4 h-4" />,
      roles: ['counselor', 'principal', 'admin', 'teacher'],
    },
    // Import & Export
    {
      id: 'import_export',
      label: 'Import & Export Data',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      roles: ['admin', 'counselor'],
    },
    // Audit Log
    {
      id: 'audit_logs',
      label: 'Audit Log Keamanan',
      icon: <ShieldAlert className="w-4 h-4" />,
      roles: ['admin', 'counselor'],
    },
  ];

  const visibleItems = allNavItems.filter((item) => item.roles.includes(role));

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-3.5">
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <span>Menu Navigasi</span>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1 text-slate-400 hover:text-slate-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <nav className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-white' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-200 mt-6 px-3 space-y-3">
        <button
          type="button"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
          <span>Keluar ke Menu Login</span>
        </button>

        <div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>BKSmart v1.0</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Aktif</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Standar Bimbingan Konseling Nasional</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-53px)] flex-col no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] bg-white h-full shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
