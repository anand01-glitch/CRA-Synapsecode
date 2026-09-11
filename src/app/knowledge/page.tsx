import React from 'react';
import Link from 'next/link';
import { db } from '../../lib/db';
import { getServerOrg } from '../../lib/server-org';
import { AppShell } from '../../components/layout/app-shell';
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FolderGit2,
  Layers,
  GitPullRequest,
} from 'lucide-react';

interface KnowledgePageProps {
  searchParams: {
    org?: string;
    category?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function TeamKnowledgePage({ searchParams }: KnowledgePageProps) {
  const { currentOrg } = await getServerOrg(searchParams.org);
  const organizationId = currentOrg.id;
  const activeCategory = searchParams.category || 'all';

  // Query issues grouped by title and category strictly for this organization
  let issues: any[] = [];
  try {
    issues = await db.issue.findMany({
      where: {
        organizationId,
        ...(activeCategory !== 'all' ? { category: activeCategory } : {}),
      },
      include: {
        pullRequest: {
          select: {
            id: true,
            githubPrNumber: true,
            title: true,
            createdAt: true,
          },
        },
        repository: {
          select: {
            name: true,
          },
        },
        sourceSimilarities: {
          include: {
            matchedIssue: {
              include: {
                pullRequest: {
                  select: {
                    id: true,
                    githubPrNumber: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Error fetching knowledge issues:', err);
  }

  // Group issues into recurring patterns
  const patternMap = new Map<string, {
    title: string;
    category: string;
    severity: string;
    explanation: string;
    recommendation: string;
    occurrences: number;
    repos: Set<string>;
    prs: Array<{ id: string; num: number; title: string }>;
  }>();

  for (const issue of issues) {
    const key = issue.title.toLowerCase().trim();
    if (!patternMap.has(key)) {
      patternMap.set(key, {
        title: issue.title,
        category: issue.category,
        severity: issue.severity,
        explanation: issue.explanation,
        recommendation: issue.recommendation,
        occurrences: 1,
        repos: new Set([issue.repository.name]),
        prs: [{ id: issue.pullRequest.id, num: issue.pullRequest.githubPrNumber, title: issue.pullRequest.title }],
      });
    } else {
      const existing = patternMap.get(key)!;
      existing.occurrences++;
      existing.repos.add(issue.repository.name);
      if (!existing.prs.some((p) => p.num === issue.pullRequest.githubPrNumber)) {
        existing.prs.push({
          id: issue.pullRequest.id,
          num: issue.pullRequest.githubPrNumber,
          title: issue.pullRequest.title,
        });
      }
    }
  }

  const patterns = Array.from(patternMap.values()).sort((a, b) => b.occurrences - a.occurrences);

  const categories = [
    { id: 'all', label: 'All Patterns' },
    { id: 'security', label: 'Security' },
    { id: 'performance', label: 'Performance' },
    { id: 'code_quality', label: 'Code Quality' },
    { id: 'testing', label: 'Testing' },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Organizational Memory Bank
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Institutional knowledge aggregated from all pull requests in{' '}
              <span className="font-semibold text-foreground">{currentOrg.name}</span>
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-card border border-border shadow-sm">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <Link
                key={cat.id}
                href={`/knowledge?category=${cat.id}${searchParams.org ? `&org=${searchParams.org}` : ''}`}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {/* Knowledge Pattern Cards */}
        <div className="grid grid-cols-1 gap-6">
          {patterns.map((pattern, idx) => {
            const isRecurring = pattern.occurrences > 1;

            return (
              <div
                key={idx}
                className={`p-6 rounded-3xl bg-card border shadow-sm space-y-4 ${
                  isRecurring ? 'border-indigo-500/40 bg-gradient-to-br from-indigo-500/5 to-card' : 'border-border'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                        pattern.severity === 'critical'
                          ? 'bg-rose-500 text-white'
                          : pattern.severity === 'high'
                          ? 'bg-amber-500 text-white'
                          : pattern.severity === 'medium'
                          ? 'bg-yellow-500 text-slate-900'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {pattern.severity}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      {pattern.category}
                    </span>
                    <h3 className="font-bold text-base text-foreground">{pattern.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
                        isRecurring
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{pattern.occurrences} PR Occurrence{pattern.occurrences > 1 ? 's' : ''}</span>
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground leading-relaxed">
                  {pattern.explanation}
                </div>

                {/* Recommendation */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 text-xs">
                  <span className="font-semibold text-foreground">Standardized Best Practice: </span>
                  <span className="text-muted-foreground">{pattern.recommendation}</span>
                </div>

                {/* Affected Repositories and Linked PRs */}
                <div className="pt-2 border-t border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FolderGit2 className="w-4 h-4 text-primary" />
                    <span>Affected Repositories:</span>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(pattern.repos).map((repo) => (
                        <span
                          key={repo}
                          className="font-mono text-[11px] px-2 py-0.5 rounded bg-muted text-foreground border border-border"
                        >
                          {repo}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GitPullRequest className="w-4 h-4 text-indigo-500" />
                    <span>Linked PRs:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {pattern.prs.map((pr) => (
                        <Link
                          key={pr.id}
                          href={`/pull-requests/${pr.id}`}
                          className="font-mono text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold hover:underline"
                        >
                          #{pr.num}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
