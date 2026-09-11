import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '../../../lib/db';
import { getServerOrg } from '../../../lib/server-org';
import { AppShell } from '../../../components/layout/app-shell';
import {
  GitPullRequest,
  GitBranch,
  ShieldAlert,
  AlertTriangle,
  FileCode,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface PRDetailPageProps {
  params: {
    id: string;
  };
  searchParams: {
    org?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function PRDetailPage({ params, searchParams }: PRDetailPageProps) {
  const { currentOrg } = await getServerOrg(searchParams.org);
  const organizationId = currentOrg.id;

  // Query PR with strict organizationId filter for multi-tenancy security
  const pr = await db.pullRequest.findFirst({
    where: {
      id: params.id,
      organizationId: organizationId, // Hard security constraint
    },
    include: {
      repository: true,
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      issues: {
        include: {
          sourceSimilarities: {
            include: {
              matchedIssue: {
                include: {
                  pullRequest: {
                    select: {
                      id: true,
                      githubPrNumber: true,
                      title: true,
                    },
                  },
                  repository: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: { score: 'desc' },
          },
        },
      },
    },
  });

  if (!pr) {
    notFound();
  }

  // Fetch active team rules for this organization
  const teamRules = await db.teamRule.findMany({
    where: {
      organizationId,
      isActive: true,
    },
  });

  const latestReview = pr.reviews[0];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Back Link & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/pull-requests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Pull Requests</span>
          </Link>
          <div className="text-xs text-muted-foreground">
            Repo: <span className="font-mono text-foreground font-semibold">{pr.repository.fullName}</span>
          </div>
        </div>

        {/* PR Header Banner */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-muted-foreground">
                  #{pr.githubPrNumber}
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  {pr.title}
                </h1>
                {pr.githubPrNumber === 200 && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500 text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Demo Target</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {pr.description || 'No description provided for this pull request.'}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold ${
                  pr.reviewStatus === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : pr.reviewStatus === 'PROCESSING'
                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>{pr.reviewStatus}</span>
              </span>

              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  pr.riskLevel === 'critical'
                    ? 'bg-rose-500 text-white'
                    : pr.riskLevel === 'high'
                    ? 'bg-amber-500 text-white'
                    : pr.riskLevel === 'medium'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {pr.riskLevel} Risk
              </span>
            </div>
          </div>

          {/* Meta bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <span>Author:</span>
              <span className="font-semibold text-foreground">{pr.author}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              <span className="font-mono">{pr.branch}</span>
              <span>&rarr;</span>
              <span className="font-mono">{pr.baseBranch}</span>
            </div>
            <span>•</span>
            <div>
              Reviewed: <span className="font-semibold text-foreground">{new Date(pr.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* AI Review Summary Risk Banner */}
        {latestReview && (
          <div
            className={`p-5 rounded-3xl border shadow-sm ${
              latestReview.riskLevel === 'high' || latestReview.riskLevel === 'critical'
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-emerald-500/5 border-emerald-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  latestReview.riskLevel === 'high' || latestReview.riskLevel === 'critical'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span>AI Review Summary</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    Tokens: {latestReview.tokensUsed}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {latestReview.summary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Issue Cards & Organizational Memory Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>Detected Issues</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {pr.issues.length}
              </span>
            </h2>
          </div>

          {pr.issues.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-card border border-border">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="font-bold text-sm text-foreground">Clean Changeset</div>
              <p className="text-xs text-muted-foreground mt-1">
                No security, performance, quality, or test coverage issues detected.
              </p>
            </div>
          ) : (
            pr.issues.map((issue) => {
              // Find matching team rules
              const matchedRule = teamRules.find(
                (r) =>
                  r.category.toLowerCase() === issue.category.toLowerCase() ||
                  issue.title.toLowerCase().includes(r.name.toLowerCase()) ||
                  issue.explanation.toLowerCase().includes(r.name.toLowerCase())
              );

              return (
                <div
                  key={issue.id}
                  className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden space-y-0"
                >
                  {/* Issue Header */}
                  <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                          issue.severity === 'critical'
                            ? 'bg-rose-500 text-white'
                            : issue.severity === 'high'
                            ? 'bg-amber-500 text-white'
                            : issue.severity === 'medium'
                            ? 'bg-yellow-500 text-slate-900'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-xs font-mono px-2 py-1 rounded-lg bg-muted text-foreground border border-border">
                        {issue.category}
                      </span>
                      <h3 className="font-bold text-sm text-foreground">{issue.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <FileCode className="w-3.5 h-3.5 text-primary" />
                      <span>{issue.filePath}:{issue.lineStart}</span>
                      <span className="text-[10px] text-emerald-500 font-sans font-semibold">
                        ({(issue.confidence * 100).toFixed(0)}% confidence)
                      </span>
                    </div>
                  </div>

                  {/* Issue Body */}
                  <div className="p-6 space-y-5">
                    {/* Explanation */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Explanation
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">
                        {issue.explanation}
                      </p>
                    </div>

                    {/* Code Snippet */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
                        <span>Code Snippet in {issue.filePath}</span>
                        <span className="font-mono text-[10px]">Lines {issue.lineStart}-{issue.lineEnd}</span>
                      </div>
                      <div className="rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto border border-slate-800 shadow-inner">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 select-none text-[11px]">{issue.lineStart}</span>
                          <span className="text-rose-400">{issue.codeSnippet}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Recommended Remediation</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">
                        {issue.recommendation}
                      </p>
                    </div>

                    {/* ORGANIZATIONAL MEMORY: Previous Similar Issues Panel */}
                    {issue.sourceSimilarities && issue.sourceSimilarities.length > 0 && (
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <span className="font-bold text-xs text-foreground">
                              Organizational Memory: Recurring Pattern Detected
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                            {issue.sourceSimilarities.length} prior occurrences found
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          This code closely resembles recurring issues detected in prior Pull Requests within{' '}
                          <span className="font-semibold text-foreground">{currentOrg.name}</span>.
                          Similarity matched via pgvector embeddings (threshold &ge; 75%):
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          {issue.sourceSimilarities.map((match) => {
                            const pastPr = match.matchedIssue.pullRequest;
                            const pastRepo = match.matchedIssue.repository;
                            const scorePercent = (match.score * 100).toFixed(1);

                            return (
                              <Link
                                key={match.id}
                                href={`/pull-requests/${pastPr.id}`}
                                className="p-3.5 rounded-xl bg-card border border-indigo-500/20 hover:border-indigo-500/50 hover:shadow-md transition-all text-xs space-y-1.5 group block"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                    PR #{pastPr.githubPrNumber}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                    {scorePercent}% match
                                  </span>
                                </div>
                                <div className="text-[11px] text-foreground font-medium truncate">
                                  {pastPr.title}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono truncate">
                                  {pastRepo.name}
                                </div>
                                <div className="text-[10px] text-primary flex items-center gap-1 font-semibold pt-1">
                                  <span>View past review</span>
                                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Linked Team Rule */}
                    {matchedRule && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                        <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs">
                          <div className="font-bold text-foreground flex items-center gap-2">
                            <span>Applicable Team Rule: {matchedRule.name}</span>
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              {matchedRule.severity}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-[11px]">
                            {matchedRule.ruleDescription}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
