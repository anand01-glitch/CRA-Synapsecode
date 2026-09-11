import React from 'react';
import Link from 'next/link';
import { db } from '../../lib/db';
import { getServerOrg } from '../../lib/server-org';
import { AppShell } from '../../components/layout/app-shell';
import { DashboardCharts } from '../../components/dashboard/dashboard-charts';
import {
  GitPullRequest,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
  FolderGit2,
  CheckCircle2,
} from 'lucide-react';

interface DashboardProps {
  searchParams: {
    org?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const { currentOrg } = await getServerOrg(searchParams.org);
  const organizationId = currentOrg.id;

  // 1. Fetch Aggregated Metrics strictly scoped to organizationId
  const [
    totalPrsCount,
    totalIssuesCount,
    securityIssuesCount,
    similaritiesCount,
    recentPrs,
    issuesGroupedByCategory,
    issuesGroupedBySeverity,
    allIssuesOverTime,
    repositoriesWithStats,
  ] = await Promise.all([
    db.pullRequest.count({ where: { organizationId } }),
    db.issue.count({ where: { organizationId } }),
    db.issue.count({ where: { organizationId, category: 'security' } }),
    db.issueSimilarity.count({
      where: {
        sourceIssue: { organizationId },
      },
    }),
    db.pullRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        repository: { select: { name: true } },
        issues: { select: { id: true, severity: true, category: true } },
      },
    }),
    db.issue.groupBy({
      by: ['category'],
      where: { organizationId },
      _count: { id: true },
    }),
    db.issue.groupBy({
      by: ['severity'],
      where: { organizationId },
      _count: { id: true },
    }),
    db.issue.findMany({
      where: { organizationId },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.repository.findMany({
      where: { organizationId },
      include: {
        pullRequests: { select: { id: true, riskLevel: true } },
        issues: { select: { id: true, severity: true } },
      },
    }),
  ]);

  // Format category chart data
  const categoryData = [
    { name: 'Security', count: issuesGroupedByCategory.find((c) => c.category === 'security')?._count.id || 0 },
    { name: 'Performance', count: issuesGroupedByCategory.find((c) => c.category === 'performance')?._count.id || 0 },
    { name: 'Code Quality', count: issuesGroupedByCategory.find((c) => c.category === 'code_quality')?._count.id || 0 },
    { name: 'Testing', count: issuesGroupedByCategory.find((c) => c.category === 'testing')?._count.id || 0 },
  ];

  // Format time series data (group by date string)
  const timeMap = new Map<string, number>();
  for (let i = 25; i >= 0; i -= 5) {
    const d = new Date(Date.now() - i * 86400000);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    timeMap.set(label, 0);
  }

  for (const issue of allIssuesOverTime) {
    const d = new Date(issue.createdAt);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    if (timeMap.has(label)) {
      timeMap.set(label, (timeMap.get(label) || 0) + 1);
    } else {
      timeMap.set(label, 1);
    }
  }

  const timeSeriesData = Array.from(timeMap.entries()).map(([date, issues]) => ({
    date,
    issues,
  }));

  // Format severity chart data
  const severityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
  };

  const severityData = ['critical', 'high', 'medium', 'low'].map((sev) => ({
    name: sev,
    value: issuesGroupedBySeverity.find((s) => s.severity === sev)?._count.id || 0,
    color: severityColors[sev],
  }));

  // Top Recurring Issues: Group issues by title to find recurrence
  const recurringIssues = await db.issue.findMany({
    where: {
      organizationId,
      sourceSimilarities: { some: {} },
    },
    include: {
      pullRequest: { select: { id: true, githubPrNumber: true, title: true } },
      repository: { select: { name: true } },
      sourceSimilarities: {
        include: {
          matchedIssue: {
            include: {
              pullRequest: { select: { githubPrNumber: true } },
            },
          },
        },
      },
    },
  });

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Engineering Analytics Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live pull request reviews and organizational memory telemetry for{' '}
              <span className="font-semibold text-foreground">{currentOrg.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pull-requests"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 shadow-md shadow-primary/20 transition-all"
            >
              <span>View All PRs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 4 Summary KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: PRs Reviewed */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <GitPullRequest className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-foreground">{totalPrsCount}</div>
              <div className="text-xs font-medium text-muted-foreground">Pull Requests Reviewed</div>
            </div>
          </div>

          {/* Metric 2: Total Issues */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-foreground">{totalIssuesCount}</div>
              <div className="text-xs font-medium text-muted-foreground">Total Issues Detected</div>
            </div>
          </div>

          {/* Metric 3: Security Issues */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-foreground">{securityIssuesCount}</div>
              <div className="text-xs font-medium text-muted-foreground">Security Vulnerabilities</div>
            </div>
          </div>

          {/* Metric 4: Recurring Issues Detected */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-4 bg-gradient-to-br from-indigo-500/10 to-card border-indigo-500/30">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                {similaritiesCount}
              </div>
              <div className="text-xs font-medium text-muted-foreground">Recurring Patterns Matched</div>
            </div>
          </div>
        </div>

        {/* Visual Charts Component */}
        <DashboardCharts
          categoryData={categoryData}
          timeSeriesData={timeSeriesData}
          severityData={severityData}
        />

        {/* Bottom Grid: Recent PRs & Top Recurring Issues */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Pull Requests (2 columns) */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-foreground">Recent Pull Requests</h3>
                <p className="text-xs text-muted-foreground">Latest reviewed pull requests in this organization</p>
              </div>
              <Link
                href="/pull-requests"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-border/60">
              {recentPrs.map((pr) => {
                const isPR200 = pr.githubPrNumber === 200;
                return (
                  <Link
                    key={pr.id}
                    href={`/pull-requests/${pr.id}`}
                    className={`block py-3.5 px-3 rounded-2xl transition-colors ${
                      isPR200
                        ? 'bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/15'
                        : 'hover:bg-muted/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-bold text-muted-foreground shrink-0">
                          #{pr.githubPrNumber}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate text-foreground flex items-center gap-2">
                            <span>{pr.title}</span>
                            {isPR200 && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                                Demo Star
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>{pr.repository.name}</span>
                            <span>•</span>
                            <span>by {pr.author}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Risk badge */}
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                            pr.riskLevel === 'critical'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : pr.riskLevel === 'high'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : pr.riskLevel === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}
                        >
                          {pr.riskLevel} risk
                        </span>

                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {pr.issues.length} issue(s)
                        </span>

                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Column: Top Recurring Issues & Highest Risk Repos */}
          <div className="space-y-6">
            {/* Top Recurring Issues */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-sm text-foreground">Top Recurring Problems</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Patterns resurfacing across different pull requests
              </p>

              <div className="space-y-3">
                {recurringIssues.length > 0 ? (
                  recurringIssues.slice(0, 3).map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-2xl bg-muted/40 border border-border/80 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                          {rec.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                          {rec.sourceSimilarities.length} prior PRs
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Found in <span className="font-mono text-foreground">{rec.filePath}</span>
                      </div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        Linked: PR #{rec.pullRequest.githubPrNumber} &larr;{' '}
                        {rec.sourceSimilarities.map((s) => `#${s.matchedIssue.pullRequest.githubPrNumber}`).join(', ')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground py-4 text-center">
                    No recurring patterns detected yet.
                  </div>
                )}
              </div>
            </div>

            {/* Highest-Risk Repositories */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <FolderGit2 className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Repository Risk Levels</h3>
              </div>

              <div className="space-y-3">
                {repositoriesWithStats.map((repo) => {
                  const highRiskCount = repo.pullRequests.filter(
                    (p) => p.riskLevel === 'high' || p.riskLevel === 'critical'
                  ).length;
                  const totalIssues = repo.issues.length;

                  return (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/40 transition-colors text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold truncate text-foreground">{repo.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {repo.pullRequests.length} PRs • {totalIssues} issues
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          highRiskCount > 0
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {highRiskCount > 0 ? `${highRiskCount} High Risk` : 'Healthy'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
