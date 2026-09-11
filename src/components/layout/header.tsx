'use client';

import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  ShieldCheck,
  User,
  Check,
  Zap,
  Menu,
} from 'lucide-react';
import { useOrg } from '../../lib/context/org-context';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export function Header({ onToggleMobileMenu }: HeaderProps) {
  const { currentOrg, availableOrgs, switchOrg, currentUser, switchRole } = useOrg();
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Hamburger & Org Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Menu Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Organization Switcher Dropdown */}
        <div className="relative shrink min-w-0">
          <button
            onClick={() => {
              setShowOrgMenu(!showOrgMenu);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs sm:text-sm font-semibold transition-colors shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
            <span className="truncate max-w-[110px] sm:max-w-[160px] md:max-w-[200px]">{currentOrg.name}</span>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground shrink-0" />
          </button>

          {showOrgMenu && (
            <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-card border border-border shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Select Organization
              </div>
              {availableOrgs.map((org) => {
                const isSelected = org.slug === currentOrg.slug;
                return (
                  <button
                    key={org.slug}
                    onClick={() => {
                      switchOrg(org.slug);
                      setShowOrgMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      <span>{org.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
              <div className="mt-2 pt-2 border-t border-border/60 px-2 pb-1 text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground">Multi-Tenancy Guard:</span> Data is strictly isolated by organization ID.
              </div>
            </div>
          )}
        </div>

        {/* Demo Mode Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium shrink-0">
          <Zap className="w-3 h-3" />
          <span>Demo Mode</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Role Switcher Pill */}
        <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border text-xs">
          <button
            onClick={() => switchRole('DEVELOPER')}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${
              currentUser.role === 'DEVELOPER'
                ? 'bg-card text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dev
          </button>
          <button
            onClick={() => switchRole('ADMIN')}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${
              currentUser.role === 'ADMIN'
                ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Dark/Light Mode */}
        <ThemeToggle />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowOrgMenu(false);
            }}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted/70 transition-colors"
          >
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-border"
            />
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold leading-tight text-foreground">{currentUser.name}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                {currentUser.role === 'ADMIN' ? (
                  <ShieldCheck className="w-2.5 h-2.5 text-primary" />
                ) : (
                  <User className="w-2.5 h-2.5 text-muted-foreground" />
                )}
                <span>{currentUser.role}</span>
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-3 border-b border-border/60">
                <div className="font-semibold text-xs text-foreground">{currentUser.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{currentUser.email}</div>
                <div className="mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {currentUser.role}
                </div>
              </div>
              <div className="p-2 text-[11px] text-muted-foreground">
                Final-Year Project Viva Demo Mode
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
