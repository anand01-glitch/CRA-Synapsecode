import { GitHubProvider } from './github-interface';
import { OctokitGitHubProvider } from './octokit-provider';
import { MockGitHubProvider } from './mock-github-provider';

export function getGitHubProvider(token?: string): GitHubProvider {
  if (token || process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_APP_PRIVATE_KEY) {
    return new OctokitGitHubProvider(token);
  }
  return new MockGitHubProvider();
}
