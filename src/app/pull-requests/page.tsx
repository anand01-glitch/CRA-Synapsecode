import React from 'react';
import { db } from '../../lib/db';
import { getServerOrg } from '../../lib/server-org';
import { AppShell } from '../../components/layout/app-shell';
import { PRFilterTable, PRItem } from '../../components/pull-requests/pr-filter-table';
import { GitPullRequest } from 'lucide-react';

interface PullRequestsPageProps {
  searchParams: {
    org?: string;
    repo?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function PullRequestsPage({ searchParams }: PullRequestsPageProps) {
  const { currentOrg } = await getServerOrg(searchParams.org);
  const organizationId = currentOrg.id;

  // Query PRs strictly scoped by organizationId
  let prs: any[] = [];
  try {
    prs = await db.pullRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        repository: { select: { name: true } },
        issues: {
          select: {
            id: true,
            category: true,
            severity: true,
            sourceSimilarities: { select: { id: true } },
          },
        },
      },
    });
  } catch (err) {
    console.error('Error fetching PRs:', err);
  }

  // Extract unique repositories for filtering
  const repositories = Array.from(new Set(prs.map((p: any) => p.repository?.name || 'unknown')));

  // Format PR data for client table
  const formattedPRs: PRItem[] = prs.map((pr) => {
    const similaritiesCount = (pr.issues || []).reduce(
      (acc: number, curr: any) => acc + (curr.sourceSimilarities?.length || 0),
      0
    );

    return {
      id: pr.id,
      githubPrNumber: pr.githubPrNumber,
      title: pr.title,
      author: pr.author,
      status: pr.status,
      reviewStatus: pr.reviewStatus,
      riskLevel: pr.riskLevel,
      createdAt: pr.createdAt ? new Date(pr.createdAt).toISOString() : new Date().toISOString(),
      repository: {
        name: pr.repository?.name || 'unknown',
      },
      issues: (pr.issues || []).map((i: any) => ({
        id: i.id,
        category: i.category,
        severity: i.severity,
      })),
      sourceSimilaritiesCount: similaritiesCount,
    };
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Pull Requests
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Audit AI review findings and trace organizational recurring patterns for{' '}
              <span className="font-semibold text-foreground">{currentOrg.name}</span>
            </p>
          </div>
        </div>

        <PRFilterTable
          initialPRs={formattedPRs}
          repositories={repositories}
          initialRepoFilter={searchParams.repo || 'all'}
        />
      </div>
    </AppShell>
  );
}
