import { db } from '../db';
import { PRReviewContext, ReviewOutput, ReviewOutputSchema } from '../types/review';
import { CodeReviewer } from '../ai/reviewer-interface';
import { MockCodeReviewer } from '../ai/mock-reviewer';
import { EmbeddingProvider } from '../embedding/embedding-interface';
import { MockEmbeddingProvider } from '../embedding/mock-embedding';
import { SimilaritySearchProvider, MatchedIssueResult } from '../similarity/similarity-interface';
import { VectorSimilarityService } from '../similarity/similarity-service';

export interface EnrichedReviewResult {
  reviewId: string;
  pullRequestId: string;
  summary: string;
  riskLevel: string;
  status: string;
  issues: Array<{
    id: string;
    category: string;
    severity: string;
    filePath: string;
    lineStart: number;
    lineEnd: number;
    title: string;
    explanation: string;
    recommendation: string;
    codeSnippet: string;
    confidence: number;
    similarIssues: MatchedIssueResult[];
    applicableRules: Array<{
      id: string;
      name: string;
      category: string;
      recommendation: string;
    }>;
  }>;
}

export class ReviewPipeline {
  private reviewer: CodeReviewer;
  private embeddingProvider: EmbeddingProvider;
  private similarityProvider: SimilaritySearchProvider;

  constructor(
    reviewer?: CodeReviewer,
    embeddingProvider?: EmbeddingProvider,
    similarityProvider?: SimilaritySearchProvider
  ) {
    this.reviewer = reviewer || new MockCodeReviewer();
    this.embeddingProvider = embeddingProvider || new MockEmbeddingProvider();
    this.similarityProvider = similarityProvider || new VectorSimilarityService();
  }

  async runReview(context: PRReviewContext): Promise<EnrichedReviewResult> {
    const { organizationId, repositoryId, pullRequestId } = context;

    // Fetch organization settings (e.g. custom similarity threshold)
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      include: { teamRules: { where: { isActive: true } } },
    });

    const threshold = org?.similarityThreshold ?? 0.75;
    const activeRules = org?.teamRules ?? [];

    // Step 1: Update PR to PROCESSING
    await db.pullRequest.update({
      where: { id: pullRequestId },
      data: { reviewStatus: 'PROCESSING' },
    });

    // Step 2: Analyze with AI Reviewer (with retry mechanism)
    let reviewOutput: ReviewOutput | null = null;
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < 2 && !reviewOutput) {
      attempts++;
      try {
        const rawOutput = await this.reviewer.analyzePR(context);
        const parsed = ReviewOutputSchema.safeParse(rawOutput);
        if (parsed.success) {
          reviewOutput = parsed.data;
        } else {
          lastError = new Error(`Zod validation failed: ${JSON.stringify(parsed.error.issues)}`);
        }
      } catch (err) {
        lastError = err as Error;
      }
    }

    if (!reviewOutput) {
      // Mark as FAILED gracefully without crashing the pipeline
      const failedReview = await db.review.create({
        data: {
          pullRequestId,
          summary: 'Review analysis failed after retry.',
          riskLevel: 'low',
          status: 'FAILED',
          errorMessage: lastError?.message || 'Unknown error occurred during analysis',
        },
      });

      await db.pullRequest.update({
        where: { id: pullRequestId },
        data: { reviewStatus: 'FAILED' },
      });

      return {
        reviewId: failedReview.id,
        pullRequestId,
        summary: 'Review failed',
        riskLevel: 'low',
        status: 'FAILED',
        issues: [],
      };
    }

    // Step 3: Create Review record in DB
    const reviewRecord = await db.review.create({
      data: {
        pullRequestId,
        summary: reviewOutput.summary,
        riskLevel: reviewOutput.riskLevel,
        status: 'COMPLETED',
        tokensUsed: 420, // Estimated token usage
      },
    });

    const enrichedIssues: EnrichedReviewResult['issues'] = [];

    // Step 4: Process each detected issue
    for (const item of reviewOutput.issues) {
      // Build embedding text: category + title + explanation + codeSnippet + filePath
      const embeddingInput = `${item.category} ${item.title} ${item.explanation} ${item.codeSnippet} ${item.filePath}`;
      const embeddingVector = await this.embeddingProvider.generateEmbedding(embeddingInput);

      // Step 5: Query previous issues from the same organization via pgvector/similarity search
      // Note: Strict multi-tenant organizationId filter applied server-side
      const similarMatches = await this.similarityProvider.findSimilarIssues({
        organizationId,
        targetEmbedding: embeddingVector,
        excludePrId: pullRequestId,
        threshold,
        limit: 5,
      });

      // Step 6: Find matching team rules for this issue
      const matchedRules = activeRules.filter(
        (rule) =>
          rule.category.toLowerCase() === item.category.toLowerCase() ||
          item.title.toLowerCase().includes(rule.name.toLowerCase()) ||
          item.explanation.toLowerCase().includes(rule.name.toLowerCase())
      );

      // Step 7: Save Issue to DB
      const createdIssue = await db.issue.create({
        data: {
          reviewId: reviewRecord.id,
          organizationId,
          repositoryId,
          pullRequestId,
          category: item.category,
          severity: item.severity,
          filePath: item.filePath,
          lineStart: item.lineStart,
          lineEnd: item.lineEnd,
          title: item.title,
          explanation: item.explanation,
          recommendation: item.recommendation,
          codeSnippet: item.codeSnippet,
          confidence: item.confidence,
          embedding: JSON.stringify(embeddingVector),
        },
      });

      // Save similarity relationship links
      for (const match of similarMatches) {
        await db.issueSimilarity.create({
          data: {
            sourceIssueId: createdIssue.id,
            matchedIssueId: match.matchedIssueId,
            score: match.score,
          },
        });
      }

      enrichedIssues.push({
        id: createdIssue.id,
        category: item.category,
        severity: item.severity,
        filePath: item.filePath,
        lineStart: item.lineStart,
        lineEnd: item.lineEnd,
        title: item.title,
        explanation: item.explanation,
        recommendation: item.recommendation,
        codeSnippet: item.codeSnippet,
        confidence: item.confidence,
        similarIssues: similarMatches,
        applicableRules: matchedRules.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          recommendation: r.recommendation,
        })),
      });
    }

    // Step 8: Update PR status
    await db.pullRequest.update({
      where: { id: pullRequestId },
      data: {
        reviewStatus: 'COMPLETED',
        riskLevel: reviewOutput.riskLevel,
      },
    });

    return {
      reviewId: reviewRecord.id,
      pullRequestId,
      summary: reviewOutput.summary,
      riskLevel: reviewOutput.riskLevel,
      status: 'COMPLETED',
      issues: enrichedIssues,
    };
  }
}
