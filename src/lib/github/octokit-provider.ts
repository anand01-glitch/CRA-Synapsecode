import { Octokit } from '@octokit/rest';
import crypto from 'crypto';
import { GitHubProvider } from './github-interface';
import { PRReviewContext, FileChange } from '../types/review';

export class OctokitGitHubProvider implements GitHubProvider {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_ACCESS_TOKEN || undefined,
    });
  }

  async fetchPullRequestContext(params: {
    owner: string;
    repo: string;
    pullNumber: number;
    organizationId: string;
    repositoryId: string;
    pullRequestId: string;
  }): Promise<PRReviewContext> {
    const { owner, repo, pullNumber, organizationId, repositoryId, pullRequestId } = params;

    // Fetch PR details
    const { data: prData } = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    // Fetch changed files
    const { data: filesData } = await this.octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 20, // Guardrail: cap at 20 files per PR
    });

    const files: FileChange[] = filesData.map((f) => ({
      filename: f.filename,
      status: f.status as any,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
      content: f.patch,
    }));

    return {
      organizationId,
      repositoryId,
      pullRequestId,
      prNumber: pullNumber,
      prTitle: prData.title,
      files,
    };
  }

  async postReviewComment(params: {
    owner: string;
    repo: string;
    pullNumber: number;
    body: string;
  }): Promise<{ commentId: string | number }> {
    const { owner, repo, pullNumber, body } = params;
    const { data } = await this.octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body,
    });

    return { commentId: data.id };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;

    try {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = 'sha256=' + hmac.update(payload).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
