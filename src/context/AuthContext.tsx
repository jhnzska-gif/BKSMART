import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { APIService } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refreshData: () => Promise<void>;
  syncVersion: number;
  // Permissions
  canViewConfidentialNotes: boolean;
  canManageMasterData: boolean;
  canManageCounseling: boolean;
  canSubmitReferral: boolean;
  canManageCases: boolean;
  canViewReports: boolean;
  canImportExport: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);

  // Hydrate full data from backend REST API / NeonDB on mount
  useEffect(() => {
    let active = true;
    const init = async () => {
      const savedUserId = localStorage.getItem('bksmart_current_user_id');
      await APIService.syncFromServer('student');
      if (!active) return;

      if (savedUserId) {
        const users = APIService.getUsers();
        const matched = users.find((u) => u.id === savedUserId && u.active);
        if (matched) {
          APIService.setActiveRole(matched.role);
          if (matched.role === 'counselor') {
            await APIService.syncFromServer('counselor');
            if (!active) return;
          }
          setCurrentUser(matched);
        } else {
          localStorage.removeItem('bksmart_current_user_id');
        }
      }
      setSyncVersion((v) => v + 1);
      setIsReady(true);
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const result = await APIService.login(username, password);
    if (!result.ok || !result.user) {
      return {
        ok: false,
        error: result.error || 'Username atau kata sandi tidak sesuai.',
      };
    }

    const user = result.user;
    APIService.setActiveRole(user.role);
    setCurrentUser(user);
    localStorage.setItem('bksmart_current_user_id', user.id);
    await APIService.logAudit(
      user.id,
      user.name,
      user.role,
      'LOGIN',
      'AUTH',
      `Pengguna ${user.name} berhasil login`
    );
    await APIService.syncFromServer(user.role);
    setSyncVersion((v) => v + 1);
    return { ok: true };
  };

  const refreshData = async () => {
    const active = currentUser?.role || 'student';
    await APIService.syncFromServer(active);
    setSyncVersion((v) => v + 1);
  };

  const logout = () => {
    if (currentUser) {
      APIService.logAudit(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'LOGOUT',
        'AUTH',
        `Pengguna ${currentUser.name} logout`
      );
    }
    setCurrentUser(null);
    localStorage.removeItem('bksmart_current_user_id');
    APIService.syncFromServer('student').then(() => {
      setSyncVersion((v) => v + 1);
    });
  };

  const role: UserRole = currentUser ? currentUser.role : 'student';

  // Strict RBAC logic adhering to Indonesian BK regulations & Privacy protections
  const canViewConfidentialNotes = role === 'counselor';
  const canManageMasterData = role === 'admin';
  const canManageCounseling = role === 'counselor' || role === 'admin';
  const canSubmitReferral = role === 'teacher' || role === 'counselor' || role === 'admin';
  const canManageCases = role === 'counselor' || role === 'admin';
  const canViewReports =
    role === 'principal' || role === 'counselor' || role === 'admin' || role === 'teacher';
  const canImportExport = role === 'admin';

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200 gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-extrabold text-white shadow-md animate-pulse">
          BK
        </div>
        <p className="text-xs text-slate-400">Memuat data BKSmart...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        login,
        logout,
        refreshData,
        syncVersion,
        canViewConfidentialNotes,
        canManageMasterData,
        canManageCounseling,
        canSubmitReferral,
        canManageCases,
        canViewReports,
        canImportExport,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
