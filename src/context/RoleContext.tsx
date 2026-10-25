'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, UserAccount } from '@/lib/types';

interface RoleContextType {
  user: UserAccount | null;
  loading: boolean;
  role: UserRole;
  selectedHouseCode: string;
  setRole: (role: UserRole) => void;
  setSelectedHouseCode: (houseCode: string) => void;
  isAdmin: boolean;
  isWarga: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<UserRole>('admin');
  const [selectedHouseCode, setSelectedHouseCodeState] = useState<string>('A1');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (json.success && json.user) {
        setUser(json.user);
        setRoleState(json.user.role);
        if (json.user.house_code) {
          setSelectedHouseCodeState(json.user.house_code);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (json.success && json.user) {
        setUser(json.user);
        setRoleState(json.user.role);
        if (json.user.house_code) {
          setSelectedHouseCodeState(json.user.house_code);
        }
        return { success: true };
      }
      return { success: false, error: json.error || 'Login gagal.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi kesalahan sistem' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const setSelectedHouseCode = (house: string) => {
    setSelectedHouseCodeState(house);
  };

  return (
    <RoleContext.Provider
      value={{
        user,
        loading,
        role,
        selectedHouseCode,
        setRole,
        setSelectedHouseCode,
        isAdmin: role === 'admin',
        isWarga: role === 'warga',
        login,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
