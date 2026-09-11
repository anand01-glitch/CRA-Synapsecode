import { PRReviewContext } from '../types/review';

export interface GitHubProvider {
  /**
   * Fetches changed files, diffs, and metadata for a pull request.
   */
  fetchPullRequestContext(params: {
    owner: string;
    repo: string;
    pullNumber: number;
    organizationId: string;
    repositoryId: string;
    pullRequestId: string;
  }): Promise<PRReviewContext>;

  /**
   * Posts an AI review comment back to the GitHub PR discussion.
   */
  postReviewComment(params: {
    owner: string;
    repo: string;
    pullNumber: number;
    body: string;
  }): Promise<{ commentId: string | number }>;

  /**
   * Verifies HMAC SHA-256 signature on incoming GitHub webhook events.
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
}
