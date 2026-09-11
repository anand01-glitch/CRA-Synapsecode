'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GitPullRequest,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export interface PRItem {
  id: string;
  githubPrNumber: number;
  title: string;
  author: string;
  status: string;
  reviewStatus: string;
  riskLevel: string;
  createdAt: string;
  repository: {
    name: string;
  };
  issues: Array<{
    id: string;
    category: string;
    severity: string;
  }>;
  sourceSimilaritiesCount: number;
}

interface PRFilterTableProps {
  initialPRs: PRItem[];
  repositories: string[];
  initialRepoFilter?: string;
}

export function PRFilterTable({
  initialPRs,
  repositories,
  initialRepoFilter = 'all',
}: PRFilterTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(initialRepoFilter);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredPRs = useMemo(() => {
    return initialPRs.filter((pr) => {
      // Search filter
      const matchesSearch =
        pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.githubPrNumber.toString().includes(searchQuery) ||
        pr.author.toLowerCase().includes(searchQuery.toLowerCase());

      // Repo filter
      const matchesRepo = selectedRepo === 'all' || pr.repository.name === selectedRepo;

      // Status filter
      const matchesStatus = selectedStatus === 'all' || pr.reviewStatus === selectedStatus;

      // Risk filter
      const matchesRisk = selectedRisk === 'all' || pr.riskLevel === selectedRisk;

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' ||
        pr.issues.some((i) => i.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesRepo && matchesStatus && matchesRisk && matchesCategory;
    });
  }, [initialPRs, searchQuery, selectedRepo, selectedStatus, selectedRisk, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-3xl bg-card border border-border shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, #PR, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Repo Filter */}
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
          >
            <option value="all">All Repositories</option>
            {repositories.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </select>

          {/* Risk Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
          >
            <option value="all">All Categories</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="code_quality">Code Quality</option>
            <option value="testing">Testing</option>
          </select>

          {/* Review Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
          >
            <option value="all">All Review States</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* PR Table */}
      <div className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">PR #</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Repository</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Issues Found</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPRs.length > 0 ? (
                filteredPRs.map((pr) => {
                  const isPR200 = pr.githubPrNumber === 200;
                  const dateStr = new Date(pr.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr
                      key={pr.id}
                      className={`hover:bg-muted/40 transition-colors ${
                        isPR200 ? 'bg-indigo-500/5' : ''
                      }`}
                    >
                      {/* PR Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        #{pr.githubPrNumber}
                      </td>

                      {/* Title & Author */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span className="truncate">{pr.title}</span>
                          {isPR200 && (
                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Demo Star</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Author: <span className="text-foreground">{pr.author}</span> •{' '}
                          <span className="capitalize">{pr.status}</span>
                        </div>
                      </td>

                      {/* Repository */}
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {pr.repository.name}
                      </td>

                      {/* Review Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium text-[11px] ${
                            pr.reviewStatus === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : pr.reviewStatus === 'PROCESSING'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{pr.reviewStatus}</span>
                        </span>
                      </td>

                      {/* Risk Level */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold capitalize text-[11px] ${
                            pr.riskLevel === 'critical'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : pr.riskLevel === 'high'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : pr.riskLevel === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}
                        >
                          {pr.riskLevel}
                        </span>
                      </td>

                      {/* Issues count & recurring badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {pr.issues.length}
                          </span>
                          {pr.sourceSimilaritiesCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{pr.sourceSimilaritiesCount} Recurring</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-muted-foreground">{dateStr}</td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/pull-requests/${pr.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-[11px] hover:opacity-90 transition-all shadow-sm"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No pull requests match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
