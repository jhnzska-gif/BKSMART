import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Shield, BookOpen, UserCheck, GraduationCap, Building2, LogOut, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { currentUser, role, logout } = useAuth();

  const roleConfigs: Record<UserRole, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
    admin: { label: 'Admin', icon: <Shield className="w-3.5 h-3.5" />, color: 'bg-indigo-600 text-white', desc: 'Kelola Master Data & Sistem' },
    counselor: { label: 'Guru BK', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'bg-emerald-600 text-white', desc: 'Konseling, Asesmen & Kasus' },
    teacher: { label: 'Wali Kelas', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'bg-amber-600 text-white', desc: 'Siswa Binaan & Rujukan' },
    student: { label: 'Siswa', icon: <GraduationCap className="w-3.5 h-3.5" />, color: 'bg-blue-600 text-white', desc: 'Jadwal, Kuesioner & Materi' },
    principal: { label: 'Kepala Sekolah', icon: <Building2 className="w-3.5 h-3.5" />, color: 'bg-rose-700 text-white', desc: 'Laporan & Statistik Evaluasi' },
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 gap-2">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-base sm:text-lg tracking-tight shadow-xs shrink-0">
            BK
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900">BKSmart</span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">·</span>
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline">SMK Merdeka Nusantara</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 hidden md:block truncate">Bimbingan Konseling Digital</p>
          </div>
        </div>

        {/* Right: Active Role Badge, User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Role Indicator Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-2xs">
            <span className="text-slate-700">{roleConfigs[role]?.icon}</span>
            <span className="text-slate-800 hidden xs:inline">{roleConfigs[role]?.label}</span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs">
              {currentUser?.name.substring(0, 2) || 'BK'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
                {currentUser?.name}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {currentUser?.username ? `@${currentUser.username}` : roleConfigs[role]?.label}
              </p>
            </div>
          </div>

          {/* Logout / Switch Account Button */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors shadow-2xs"
            title="Keluar dari akun saat ini dan kembali ke Menu Login"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
