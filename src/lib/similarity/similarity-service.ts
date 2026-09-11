import { db } from '../db';
import { MatchedIssueResult, SimilaritySearchProvider } from './similarity-interface';

export class VectorSimilarityService implements SimilaritySearchProvider {
  /**
   * Calculates cosine similarity between two numeric vectors.
   * Returns a value between -1.0 and 1.0 (or 0.0 to 1.0 for normalized positive vectors).
   */
  calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;

    const length = Math.min(vecA.length, vecB.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Number(Math.max(0, Math.min(1, similarity)).toFixed(4));
  }

  /**
   * Queries historical issues strictly constrained by organizationId.
   * Multi-tenancy isolation is enforced at the database query level.
   */
  async findSimilarIssues(options: {
    organizationId: string;
    targetEmbedding: number[];
    excludeIssueId?: string;
    excludePrId?: string;
    threshold?: number;
    limit?: number;
  }): Promise<MatchedIssueResult[]> {
    const {
      organizationId,
      targetEmbedding,
      excludeIssueId,
      excludePrId,
      threshold = 0.75,
      limit = 5,
    } = options;

    if (!organizationId) {
      throw new Error('Security violation: organizationId is strictly required for similarity search');
    }

    // Strict multi-tenant server-side query:
    // Only issues where issue.organizationId === options.organizationId
    const candidateIssues = await db.issue.findMany({
      where: {
        organizationId: organizationId, // Hard security constraint
        ...(excludeIssueId ? { id: { not: excludeIssueId } } : {}),
        ...(excludePrId ? { pullRequestId: { not: excludePrId } } : {}),
      },
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
            id: true,
            name: true,
          },
        },
      },
    });

    const results: MatchedIssueResult[] = [];

    for (const issue of candidateIssues) {
      if (!issue.embedding) continue;

      let embeddingVector: number[] = [];
      try {
        embeddingVector = JSON.parse(issue.embedding);
      } catch (e) {
        continue;
      }

      const score = this.calculateCosineSimilarity(targetEmbedding, embeddingVector);

      if (score >= threshold) {
        results.push({
          issueId: excludeIssueId || 'pending',
          matchedIssueId: issue.id,
          score,
          issue: {
            id: issue.id,
            title: issue.title,
            category: issue.category,
            severity: issue.severity,
            filePath: issue.filePath,
            lineStart: issue.lineStart,
            lineEnd: issue.lineEnd,
            codeSnippet: issue.codeSnippet,
            explanation: issue.explanation,
            recommendation: issue.recommendation,
            createdAt: issue.createdAt,
            pullRequest: issue.pullRequest,
            repository: issue.repository,
          },
        });
      }
    }

    // Sort descending by similarity score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }
}
