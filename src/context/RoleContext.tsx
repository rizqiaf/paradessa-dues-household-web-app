'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/lib/types';

interface RoleContextType {
  role: UserRole;
  selectedHouseCode: string;
  setRole: (role: UserRole) => void;
  setSelectedHouseCode: (houseCode: string) => void;
  isAdmin: boolean;
  isWarga: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('admin');
  const [selectedHouseCode, setSelectedHouseCodeState] = useState<string>('A18');

  useEffect(() => {
    const savedRole = localStorage.getItem('paradessa_role') as UserRole;
    const savedHouse = localStorage.getItem('paradessa_house');
    if (savedRole) setRoleState(savedRole);
    if (savedHouse) setSelectedHouseCodeState(savedHouse);
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('paradessa_role', newRole);
  };

  const setSelectedHouseCode = (house: string) => {
    setSelectedHouseCodeState(house);
    localStorage.setItem('paradessa_house', house);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        selectedHouseCode,
        setRole,
        setSelectedHouseCode,
        isAdmin: role === 'admin',
        isWarga: role === 'warga',
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
