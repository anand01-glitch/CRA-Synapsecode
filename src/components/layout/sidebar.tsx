'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitPullRequest,
  FolderGit2,
  BookOpen,
  ShieldAlert,
  Settings,
  BrainCircuit,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useOrg } from '../../lib/context/org-context';

export function Sidebar() {
  const pathname = usePathname();
  const { currentOrg } = useOrg();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Repositories',
      href: '/repositories',
      icon: FolderGit2,
      badge: null,
    },
    {
      name: 'Pull Requests',
      href: '/pull-requests',
      icon: GitPullRequest,
      badge: '10+',
    },
    {
      name: 'Team Knowledge',
      href: '/knowledge',
      icon: BookOpen,
      badge: 'Memory',
      highlight: true,
    },
    {
      name: 'Team Rules',
      href: '/rules',
      icon: ShieldAlert,
      badge: null,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-xl flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-border/70 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight leading-tight flex items-center gap-1.5">
              <span>SynapseCode</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                AI
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Org Learning Reviewer</div>
          </div>
        </Link>
      </div>

      {/* Org Badge Pill */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border/50">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Active Workspace
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs truncate text-foreground">{currentOrg.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium border border-emerald-500/20">
            Active
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : item.highlight
                      ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Organizational Memory Banner Widget */}
      <div className="p-3 m-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 text-xs">
        <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Organizational Memory</span>
        </div>
        <p className="text-muted-foreground text-[11px] leading-relaxed mb-2">
          Recurring issues are cross-referenced across historical PRs via pgvector embeddings.
        </p>
        <div className="flex items-center justify-between text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
          <span>Threshold: {(currentOrg.similarityThreshold * 100).toFixed(0)}%</span>
          <span className="flex items-center gap-0.5">
            1536-dim <ChevronRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </aside>
  );
}
