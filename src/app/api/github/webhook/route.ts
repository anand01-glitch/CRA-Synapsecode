import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getGitHubProvider } from '../../../../lib/github/get-github-provider';
import { ReviewPipeline } from '../../../../lib/pipeline/review-pipeline';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256') || '';
    const event = req.headers.get('x-github-event');
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || '';

    const githubProvider = getGitHubProvider();

    // 1. Verify webhook signature
    if (webhookSecret && !githubProvider.verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    // Check if event is pull_request
    if (event !== 'pull_request') {
      return NextResponse.json({ message: `Ignored event: ${event}` }, { status: 200 });
    }

    const action = payload.action;
    // Supported actions: opened, synchronize, reopened
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
      return NextResponse.json({ message: `Ignored PR action: ${action}` }, { status: 200 });
    }

    const prData = payload.pull_request;
    const repoData = payload.repository;
    const installationId = payload.installation?.id?.toString();

    if (!prData || !repoData) {
      return NextResponse.json({ error: 'Missing pull_request or repository in payload' }, { status: 400 });
    }

    // 2. Resolve organization
    let organization = null;
    if (installationId) {
      const installRecord = await db.gitHubInstallation.findFirst({
        where: { installationId },
        include: { organization: true },
      });
      organization = installRecord?.organization;
    }

    if (!organization) {
      // Fallback to default Acme Technologies org for demo mode
      organization = await db.organization.findFirst({
        where: { slug: 'acme-tech' },
      });
    }

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // 3. Resolve or create Repository record
    let repository = await db.repository.findFirst({
      where: {
        organizationId: organization.id,
        name: repoData.name,
      },
    });

    if (!repository) {
      repository = await db.repository.create({
        data: {
          name: repoData.name,
          fullName: repoData.full_name || `${organization.slug}/${repoData.name}`,
          defaultBranch: repoData.default_branch || 'main',
          organizationId: organization.id,
        },
      });
    }

    // 4. Resolve or create PullRequest record
    let pullRequest = await db.pullRequest.findFirst({
      where: {
        repositoryId: repository.id,
        githubPrNumber: prData.number,
      },
    });

    if (!pullRequest) {
      pullRequest = await db.pullRequest.create({
        data: {
          githubPrNumber: prData.number,
          title: prData.title || `PR #${prData.number}`,
          description: prData.body || '',
          author: prData.user?.login || 'developer',
          branch: prData.head?.ref || 'feature-branch',
          baseBranch: prData.base?.ref || 'main',
          status: 'open',
          reviewStatus: 'PROCESSING',
          riskLevel: 'low',
          repositoryId: repository.id,
          organizationId: organization.id,
        },
      });
    } else {
      await db.pullRequest.update({
        where: { id: pullRequest.id },
        data: {
          title: prData.title || pullRequest.title,
          description: prData.body || pullRequest.description,
          reviewStatus: 'PROCESSING',
        },
      });
    }

    // 5. Fetch changed files
    const owner = repoData.owner?.login || 'acme';
    const reviewContext = await githubProvider.fetchPullRequestContext({
      owner,
      repo: repoData.name,
      pullNumber: prData.number,
      organizationId: organization.id,
      repositoryId: repository.id,
      pullRequestId: pullRequest.id,
    });

    // 6. Run pipeline
    const pipeline = new ReviewPipeline();
    const result = await pipeline.runReview(reviewContext);

    // 7. Format GitHub review comment with Organizational Memory highlights
    let commentBody = `### 🤖 SynapseCode AI Review Report\n\n`;
    commentBody += `**Overall Risk Level:** \`${result.riskLevel.toUpperCase()}\`\n`;
    commentBody += `**Summary:** ${result.summary}\n\n`;

    if (result.issues.length > 0) {
      commentBody += `#### 🔍 Issues Detected (${result.issues.length}):\n\n`;
      result.issues.forEach((issue, idx) => {
        commentBody += `**${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.title}**\n`;
        commentBody += `- **File:** \`${issue.filePath}:${issue.lineStart}\`\n`;
        commentBody += `- **Explanation:** ${issue.explanation}\n`;
        commentBody += `- **Recommendation:** ${issue.recommendation}\n`;

        if (issue.similarIssues.length > 0) {
          commentBody += `- **🧠 Organizational Memory Alert:** Recurring pattern detected in ${issue.similarIssues.length} prior PR(s): `;
          const refs = issue.similarIssues
            .map((s) => `#${s.issue.pullRequest.githubPrNumber} (${(s.score * 100).toFixed(0)}% match)`)
            .join(', ');
          commentBody += `${refs}\n`;
        }

        if (issue.applicableRules.length > 0) {
          commentBody += `- **📋 Applicable Team Rule:** "${issue.applicableRules[0].name}"\n`;
        }

        commentBody += `\n`;
      });
    } else {
      commentBody += `✅ **No critical, high, or medium issues detected.** Changes look clean!\n`;
    }

    // 8. Post GitHub Comment (mocked or real)
    try {
      await githubProvider.postReviewComment({
        owner,
        repo: repoData.name,
        pullNumber: prData.number,
        body: commentBody,
      });
    } catch (e) {
      console.warn('[Webhook] Note: Posting comment to GitHub failed/skipped in demo environment');
    }

    return NextResponse.json({
      success: true,
      reviewId: result.reviewId,
      pullRequestId: pullRequest.id,
      riskLevel: result.riskLevel,
      issuesCount: result.issues.length,
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal pipeline error', message: error.message },
      { status: 500 }
    );
  }
}
