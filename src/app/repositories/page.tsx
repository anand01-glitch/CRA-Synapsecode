import React from 'react';
import Link from 'next/link';
import { db } from '../../lib/db';
import { getServerOrg } from '../../lib/server-org';
import { AppShell } from '../../components/layout/app-shell';
import {
  FolderGit2,
  GitPullRequest,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Code2,
} from 'lucide-react';

interface RepositoriesProps {
  searchParams: {
    org?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function RepositoriesPage({ searchParams }: RepositoriesProps) {
  const { currentOrg } = await getServerOrg(searchParams.org);
  const organizationId = currentOrg.id;

  const repositories = await db.repository.findMany({
    where: { organizationId },
    include: {
      pullRequests: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { reviewStatus: true, riskLevel: true, createdAt: true },
      },
      _count: {
        select: {
          pullRequests: true,
          issues: true,
        },
      },
      issues: {
        where: { category: 'security' },
        select: { id: true, severity: true },
      },
    },
  });

  // Repository language mappings based on demo names
  const repoLanguages: Record<string, string> = {
    'api-service': 'TypeScript',
    'web-dashboard': 'TypeScript / React',
    'authentication-service': 'Python',
    'payment-service': 'Python',
    'arc-reactor': 'C++ / Python',
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Connected Repositories
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitored codebases and repository health for{' '}
            <span className="font-semibold text-foreground">{currentOrg.name}</span>
          </p>
        </div>

        {/* Repository Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {repositories.map((repo) => {
            const latestPR = repo.pullRequests[0];
            const securityCount = repo.issues.length;
            const language = repoLanguages[repo.name] || 'TypeScript';

            const isHighRisk =
              latestPR?.riskLevel === 'high' || latestPR?.riskLevel === 'critical' || securityCount > 0;

            return (
              <div
                key={repo.id}
                className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-between hover:border-border/80 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isHighRisk
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}
                    >
                      {isHighRisk ? 'Action Required' : 'Passing Reviews'}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {repo.fullName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 mb-4">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{language}</span>
                    <span>•</span>
                    <span>branch: {repo.defaultBranch}</span>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-y border-border/60 my-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-foreground">{repo._count.pullRequests}</div>
                      <div className="text-[11px] text-muted-foreground">Pull Requests</div>
                    </div>
                    <div>
                      <div
                        className={`text-lg font-bold ${
                          securityCount > 0 ? 'text-rose-500' : 'text-foreground'
                        }`}
                      >
                        {securityCount}
                      </div>
                      <div className="text-[11px] text-muted-foreground">Security Alerts</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">{repo._count.issues}</div>
                      <div className="text-[11px] text-muted-foreground">Total Findings</div>
                    </div>
                  </div>

                  {/* Latest Review Status */}
                  <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>Latest Review Status:</span>
                    <span className="font-semibold text-foreground">
                      {latestPR ? latestPR.reviewStatus : 'No reviews yet'}
                    </span>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Default Branch: <span className="font-mono">{repo.defaultBranch}</span>
                  </span>
                  <Link
                    href={`/pull-requests?repo=${encodeURIComponent(repo.name)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>View Pull Requests</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
