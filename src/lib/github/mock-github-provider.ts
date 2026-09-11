import crypto from 'crypto';
import { GitHubProvider } from './github-interface';
import { PRReviewContext } from '../types/review';

export class MockGitHubProvider implements GitHubProvider {
  async fetchPullRequestContext(params: {
    owner: string;
    repo: string;
    pullNumber: number;
    organizationId: string;
    repositoryId: string;
    pullRequestId: string;
  }): Promise<PRReviewContext> {
    const { pullNumber, organizationId, repositoryId, pullRequestId } = params;

    // Simulate realistic changeset based on PR number
    if (pullNumber === 200) {
      return {
        organizationId,
        repositoryId,
        pullRequestId,
        prNumber: 200,
        prTitle: 'Session persistence and database lookup',
        files: [
          {
            filename: 'authentication/database.py',
            status: 'modified',
            additions: 4,
            deletions: 1,
            patch: '@@ -20,3 +20,4 @@\n-    # Old auth query\n+    query = "SELECT * FROM users WHERE id = " + user_id\n+    return db.execute(query)',
            content: 'def get_user_session(user_id):\n    query = "SELECT * FROM users WHERE id = " + user_id\n    return db.execute(query)',
          },
        ],
      };
    }

    return {
      organizationId,
      repositoryId,
      pullRequestId,
      prNumber: pullNumber,
      prTitle: `PR #${pullNumber} Changeset`,
      files: [
        {
          filename: 'services/api.ts',
          status: 'modified',
          additions: 10,
          deletions: 2,
          content: 'export const getStatus = () => ({ status: "ok" });',
        },
      ],
    };
  }

  async postReviewComment(params: {
    owner: string;
    repo: string;
    pullNumber: number;
    body: string;
  }): Promise<{ commentId: string | number }> {
    console.log(`[MockGitHubProvider] Simulated posting review comment to ${params.owner}/${params.repo}#${params.pullNumber}`);
    console.log(`[MockGitHubProvider] Comment Body:\n${params.body.substring(0, 150)}...`);
    return { commentId: `mock-comment-${Date.now()}` };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) {
      // Allow demo payload when secrets are unconfigured
      return true;
    }

    try {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = 'sha256=' + hmac.update(payload).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
