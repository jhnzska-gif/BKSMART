import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { APIService } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  login: (username: string, role?: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
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
        const matched = users.find((u) => u.id === savedUserId);
        if (matched) {
          APIService.setActiveRole(matched.role);
          if (matched.role === 'counselor') {
            await APIService.syncFromServer('counselor');
            if (!active) return;
          }
          setCurrentUser(matched);
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

  const login = (username: string, preferredRole?: UserRole): boolean => {
    const users = APIService.getUsers();
    let user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user && preferredRole) {
      user = users.find((u) => u.role === preferredRole);
    }
    if (user) {
      APIService.setActiveRole(user.role);
      setCurrentUser(user);
      localStorage.setItem('bksmart_current_user_id', user.id);
      APIService.logAudit(
        user.id,
        user.name,
        user.role,
        'LOGIN',
        'AUTH',
        `Pengguna ${user.name} berhasil login`
      );
      APIService.syncFromServer(user.role).then(() => {
        setSyncVersion((v) => v + 1);
      });
      return true;
    }
    return false;
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

  const switchRole = (newRole: UserRole) => {
    const users = APIService.getUsers();
    const targetUser = users.find((u) => u.role === newRole);
    if (targetUser) {
      APIService.setActiveRole(targetUser.role);
      setCurrentUser(targetUser);
      localStorage.setItem('bksmart_current_user_id', targetUser.id);
      APIService.logAudit(
        targetUser.id,
        targetUser.name,
        targetUser.role,
        'SWITCH_ROLE',
        'AUTH',
        `Beralih peran menjadi ${newRole.toUpperCase()}`
      );
      APIService.syncFromServer(targetUser.role).then(() => {
        setSyncVersion((v) => v + 1);
      });
    }
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
  const canImportExport = role === 'admin' || role === 'counselor';

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
        switchRole,
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
