import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { ReviewPipeline } from '../../../../lib/pipeline/review-pipeline';
import { getGitHubProvider } from '../../../../lib/github/get-github-provider';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pullRequestId } = body;

    if (!pullRequestId) {
      return NextResponse.json({ error: 'pullRequestId is required' }, { status: 400 });
    }

    const pr = await db.pullRequest.findUnique({
      where: { id: pullRequestId },
      include: {
        repository: true,
        organization: true,
      },
    });

    if (!pr) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 });
    }

    const githubProvider = getGitHubProvider();
    const context = await githubProvider.fetchPullRequestContext({
      owner: 'acme',
      repo: pr.repository.name,
      pullNumber: pr.githubPrNumber,
      organizationId: pr.organizationId,
      repositoryId: pr.repositoryId,
      pullRequestId: pr.id,
    });

    const pipeline = new ReviewPipeline();
    const result = await pipeline.runReview(context);

    return NextResponse.json({
      success: true,
      reviewId: result.reviewId,
      riskLevel: result.riskLevel,
      issuesCount: result.issues.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
