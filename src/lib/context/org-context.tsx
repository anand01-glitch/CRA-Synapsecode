'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'DEVELOPER';
  avatarUrl?: string | null;
}

export interface Org {
  id: string;
  name: string;
  slug: string;
  similarityThreshold: number;
}

interface OrgContextType {
  currentOrg: Org;
  availableOrgs: Org[];
  currentUser: OrgUser;
  switchOrg: (orgSlug: string) => void;
  switchRole: (role: 'ADMIN' | 'DEVELOPER') => void;
}

const defaultAcmeOrg: Org = {
  id: '',
  name: 'Acme Technologies',
  slug: 'acme-tech',
  similarityThreshold: 0.75,
};

const defaultStarkOrg: Org = {
  id: '',
  name: 'Stark Industries',
  slug: 'stark-industries',
  similarityThreshold: 0.75,
};

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({
  children,
  initialOrgs = [defaultAcmeOrg, defaultStarkOrg],
  initialCurrentOrg = defaultAcmeOrg,
}: {
  children: React.ReactNode;
  initialOrgs?: Org[];
  initialCurrentOrg?: Org;
}) {
  const [availableOrgs, setAvailableOrgs] = useState<Org[]>(initialOrgs);
  const [currentOrg, setCurrentOrg] = useState<Org>(initialCurrentOrg);
  const [currentUser, setCurrentUser] = useState<OrgUser>({
    id: 'user-admin',
    name: 'Alex Chen',
    email: 'alex.chen@acme.corp',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  useEffect(() => {
    // Check localStorage for saved org preference
    const savedSlug = typeof window !== 'undefined' ? localStorage.getItem('cra_org_slug') : null;
    const savedRole = typeof window !== 'undefined' ? (localStorage.getItem('cra_user_role') as 'ADMIN' | 'DEVELOPER') : null;

    if (savedSlug) {
      const match = availableOrgs.find((o) => o.slug === savedSlug);
      if (match) setCurrentOrg(match);
    }
    if (savedRole) {
      setCurrentUser((prev) => ({ ...prev, role: savedRole }));
    }
  }, [availableOrgs]);

  const switchOrg = (orgSlug: string) => {
    const match = availableOrgs.find((o) => o.slug === orgSlug);
    if (match) {
      setCurrentOrg(match);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cra_org_slug', orgSlug);
        // Dispatch custom event or reload to update server data
        window.location.search = `org=${orgSlug}`;
      }
    }
  };

  const switchRole = (role: 'ADMIN' | 'DEVELOPER') => {
    setCurrentUser((prev) => ({ ...prev, role }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('cra_user_role', role);
    }
  };

  return (
    <OrgContext.Provider
      value={{
        currentOrg,
        availableOrgs,
        currentUser,
        switchOrg,
        switchRole,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}
