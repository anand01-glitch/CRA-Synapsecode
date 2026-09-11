import { z } from 'zod';

export const IssueCategorySchema = z.enum(['security', 'performance', 'code_quality', 'testing']);
export type IssueCategory = z.infer<typeof IssueCategorySchema>;

export const IssueSeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type IssueSeverity = z.infer<typeof IssueSeveritySchema>;

export const RiskLevelSchema = z.enum(['critical', 'high', 'medium', 'low']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const IssueSchema = z.object({
  category: IssueCategorySchema,
  severity: IssueSeveritySchema,
  filePath: z.string(),
  lineStart: z.number().int().positive(),
  lineEnd: z.number().int().positive(),
  title: z.string().min(1),
  explanation: z.string().min(1),
  recommendation: z.string().min(1),
  codeSnippet: z.string(),
  confidence: z.number().min(0).max(1).default(0.9),
});

export type ReviewIssue = z.infer<typeof IssueSchema>;

export const ReviewOutputSchema = z.object({
  summary: z.string().min(1),
  riskLevel: RiskLevelSchema,
  issues: z.array(IssueSchema),
});

export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;

export interface FileChange {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
  content?: string;
}

export interface PRReviewContext {
  organizationId: string;
  repositoryId: string;
  pullRequestId: string;
  prNumber: number;
  prTitle: string;
  files: FileChange[];
}

export interface SimilarityMatch {
  issueId: string;
  matchedIssueId: string;
  score: number;
  matchedIssue: {
    id: string;
    title: string;
    category: string;
    severity: string;
    filePath: string;
    codeSnippet: string;
    explanation: string;
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
