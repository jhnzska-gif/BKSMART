import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { APIService } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  login: (username: string, role?: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
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

  // Check saved session on mount; if no session exists, stay logged out to show LoginScreen
  useEffect(() => {
    const users = APIService.getUsers();
    const savedUserId = localStorage.getItem('bksmart_current_user_id');
    if (savedUserId) {
      const matched = users.find(u => u.id === savedUserId);
      if (matched) {
        setCurrentUser(matched);
      }
    }
  }, []);

  const login = (username: string, preferredRole?: UserRole): boolean => {
    const users = APIService.getUsers();
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user && preferredRole) {
      user = users.find(u => u.role === preferredRole);
    }
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('bksmart_current_user_id', user.id);
      APIService.logAudit(user.id, user.name, user.role, 'LOGIN', 'AUTH', `Pengguna ${user.name} berhasil login`);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      APIService.logAudit(currentUser.id, currentUser.name, currentUser.role, 'LOGOUT', 'AUTH', `Pengguna ${currentUser.name} logout`);
    }
    setCurrentUser(null);
    localStorage.removeItem('bksmart_current_user_id');
  };

  const switchRole = (newRole: UserRole) => {
    const users = APIService.getUsers();
    const targetUser = users.find(u => u.role === newRole);
    if (targetUser) {
      setCurrentUser(targetUser);
      localStorage.setItem('bksmart_current_user_id', targetUser.id);
      APIService.logAudit(targetUser.id, targetUser.name, targetUser.role, 'SWITCH_ROLE', 'AUTH', `Beralih peran menjadi ${newRole.toUpperCase()}`);
    }
  };

  const role: UserRole = currentUser ? currentUser.role : 'student';

  // Strict RBAC logic adhering to Indonesian BK regulations & Privacy protections
  const canViewConfidentialNotes = role === 'counselor';
  const canManageMasterData = role === 'admin';
  const canManageCounseling = role === 'counselor' || role === 'admin';
  const canSubmitReferral = role === 'teacher' || role === 'counselor' || role === 'admin';
  const canManageCases = role === 'counselor' || role === 'admin';
  const canViewReports = role === 'principal' || role === 'counselor' || role === 'admin' || role === 'teacher';
  const canImportExport = role === 'admin' || role === 'counselor';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        login,
        logout,
        switchRole,
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
