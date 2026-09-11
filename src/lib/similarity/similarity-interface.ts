export interface MatchedIssueResult {
  issueId: string;
  matchedIssueId: string;
  score: number;
  issue: {
    id: string;
    title: string;
    category: string;
    severity: string;
    filePath: string;
    lineStart: number;
    lineEnd: number;
    codeSnippet: string;
    explanation: string;
    recommendation: string;
    createdAt: Date;
    pullRequest: {
      id: string;
      githubPrNumber: number;
      title: string;
    };
    repository: {
      id: string;
      name: string;
    };
  };
}

export interface SimilaritySearchProvider {
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number;
  
  findSimilarIssues(options: {
    organizationId: string;
    targetEmbedding: number[];
    excludeIssueId?: string;
    excludePrId?: string;
    threshold?: number;
    limit?: number;
  }): Promise<MatchedIssueResult[]>;
}
