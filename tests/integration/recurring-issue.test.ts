import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../src/lib/db';
import { ReviewPipeline } from '../../src/lib/pipeline/review-pipeline';
import { PRReviewContext } from '../../src/lib/types/review';
import { MockEmbeddingProvider } from '../../src/lib/embedding/mock-embedding';

describe('Integration Test: Recurring Issue Detection & Organizational Isolation', () => {
  const embeddingProvider = new MockEmbeddingProvider();
  const pipeline = new ReviewPipeline();

  let testOrgAId: string;
  let testOrgBId: string;
  let repoAId: string;
  let repoBId: string;
  let pr101Id: string;
  let pr125Id: string;
  let pr143Id: string;
  let pr301Id: string;

  beforeAll(async () => {
    // Clean up any previous test records
    await db.issueSimilarity.deleteMany({});
    await db.issue.deleteMany({});
    await db.review.deleteMany({});
    await db.pullRequest.deleteMany({});
    await db.repository.deleteMany({});
    await db.teamRule.deleteMany({});
    await db.user.deleteMany({});
    await db.organization.deleteMany({});

    // 1. Create Organization A (Acme)
    const orgA = await db.organization.create({
      data: {
        name: 'Acme Test Org',
        slug: 'acme-test-org',
        similarityThreshold: 0.75,
      },
    });
    testOrgAId = orgA.id;

    // 2. Create Organization B (Stark - Isolation test target)
    const orgB = await db.organization.create({
      data: {
        name: 'Stark Test Org',
        slug: 'stark-test-org',
        similarityThreshold: 0.75,
      },
    });
    testOrgBId = orgB.id;

    // 3. Create Team Rule for Org A
    await db.teamRule.create({
      data: {
        organizationId: testOrgAId,
        name: 'Prevent SQL Injections',
        category: 'security',
        severity: 'critical',
        ruleDescription: 'Use parameterized queries or an ORM.',
        recommendation: 'Use parameterized queries or an ORM query builder.',
        isActive: true,
      },
    });

    // 4. Create Repositories
    const repoA = await db.repository.create({
      data: {
        name: 'auth-service',
        fullName: 'acme/auth-service',
        organizationId: testOrgAId,
      },
    });
    repoAId = repoA.id;

    const repoB = await db.repository.create({
      data: {
        name: 'stark-telemetry',
        fullName: 'stark/telemetry',
        organizationId: testOrgBId,
      },
    });
    repoBId = repoB.id;

    // 5. Seed Historical PRs in Org A: PR #101, #125, #143
    const prSeeds = [
      {
        prNumber: 101,
        title: 'Fix user login auth',
        code: 'query = "SELECT * FROM users WHERE username = " + username',
        file: 'auth/db.py',
      },
      {
        prNumber: 125,
        title: 'Add profile lookup endpoint',
        code: 'query = "SELECT * FROM profiles WHERE user_id = " + user_id',
        file: 'api/users.py',
      },
      {
        prNumber: 143,
        title: 'Invoice webhook verification',
        code: 'query = "SELECT * FROM invoices WHERE id = " + invoice_id',
        file: 'services/payments.py',
      },
    ];

    for (const seed of prSeeds) {
      const pr = await db.pullRequest.create({
        data: {
          githubPrNumber: seed.prNumber,
          title: seed.title,
          author: 'dev',
          branch: `feature/${seed.prNumber}`,
          status: 'merged',
          reviewStatus: 'COMPLETED',
          riskLevel: 'high',
          repositoryId: repoAId,
          organizationId: testOrgAId,
        },
      });

      if (seed.prNumber === 101) pr101Id = pr.id;
      if (seed.prNumber === 125) pr125Id = pr.id;
      if (seed.prNumber === 143) pr143Id = pr.id;

      const review = await db.review.create({
        data: {
          pullRequestId: pr.id,
          summary: 'SQL injection detected',
          riskLevel: 'high',
          status: 'COMPLETED',
        },
      });

      const embeddingInput = `security Possible SQL injection vulnerability User-controlled input is concatenated directly into a SQL query string ${seed.code} ${seed.file}`;
      const embedding = await embeddingProvider.generateEmbedding(embeddingInput);

      await db.issue.create({
        data: {
          reviewId: review.id,
          organizationId: testOrgAId,
          repositoryId: repoAId,
          pullRequestId: pr.id,
          category: 'security',
          severity: 'high',
          filePath: seed.file,
          lineStart: 20,
          lineEnd: 20,
          title: 'Possible SQL injection vulnerability',
          explanation: 'User-controlled input is concatenated directly into a SQL query string without sanitization or parameterization.',
          recommendation: 'Use parameterized queries or an ORM query builder.',
          codeSnippet: seed.code,
          confidence: 0.94,
          embedding: JSON.stringify(embedding),
        },
      });
    }

    // 6. Seed a SQL Injection PR in Org B (PR #301) to verify Org Isolation
    const pr301 = await db.pullRequest.create({
      data: {
        githubPrNumber: 301,
        title: 'Reactor core telemetry query',
        author: 'jarvis',
        branch: 'feature/301',
        status: 'open',
        reviewStatus: 'COMPLETED',
        riskLevel: 'high',
        repositoryId: repoBId,
        organizationId: testOrgBId, // ORG B!
      },
    });
    pr301Id = pr301.id;

    const review301 = await db.review.create({
      data: {
        pullRequestId: pr301.id,
        summary: 'SQL injection in reactor telemetry',
        riskLevel: 'high',
        status: 'COMPLETED',
      },
    });

    const embed301 = await embeddingProvider.generateEmbedding(
      'security Possible SQL injection vulnerability User-controlled input is concatenated directly into a SQL query string query = "SELECT * FROM telemetry WHERE reactor_id = " + id core/telemetry.py'
    );

    await db.issue.create({
      data: {
        reviewId: review301.id,
        organizationId: testOrgBId, // ORG B!
        repositoryId: repoBId,
        pullRequestId: pr301.id,
        category: 'security',
        severity: 'high',
        filePath: 'core/telemetry.py',
        lineStart: 15,
        lineEnd: 15,
        title: 'Possible SQL injection vulnerability',
        explanation: 'Concatenating reactor_id directly into SQL query.',
        recommendation: 'Use parameterized queries.',
        codeSnippet: 'query = "SELECT * FROM telemetry WHERE reactor_id = " + id',
        confidence: 0.94,
        embedding: JSON.stringify(embed301),
      },
    });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('runs PR #200 through pipeline, matches PR #101, #125, #143, and enforces 0 data leakage from Org B', async () => {
    // Create PR #200 in Org A
    const pr200 = await db.pullRequest.create({
      data: {
        githubPrNumber: 200,
        title: 'Session persistence and database lookup',
        description: 'Implement persistent session validation query in authentication database module.',
        author: 'dev4',
        branch: 'feature/session-persistence',
        status: 'open',
        reviewStatus: 'PENDING',
        riskLevel: 'low',
        repositoryId: repoAId,
        organizationId: testOrgAId,
      },
    });

    const context: PRReviewContext = {
      organizationId: testOrgAId,
      repositoryId: repoAId,
      pullRequestId: pr200.id,
      prNumber: 200,
      prTitle: 'Session persistence and database lookup',
      files: [
        {
          filename: 'authentication/database.py',
          status: 'modified',
          additions: 5,
          deletions: 1,
          content: 'def get_user_session(user_id):\n    query = "SELECT * FROM users WHERE id=" + user_id\n    return db.execute(query)',
        },
      ],
    };

    // Run the pipeline
    const reviewResult = await pipeline.runReview(context);

    expect(reviewResult.status).toBe('COMPLETED');
    expect(reviewResult.riskLevel).toBe('high');
    expect(reviewResult.issues.length).toBeGreaterThan(0);

    const sqlIssue = reviewResult.issues.find(
      (i) => i.category === 'security' && i.title.toLowerCase().includes('sql injection')
    );

    expect(sqlIssue).toBeDefined();
    expect(sqlIssue?.similarIssues.length).toBe(3);

    // Assert PR #101, #125, and #143 are all returned with score >= 0.75
    const matchedPrNumbers = sqlIssue?.similarIssues.map((m) => m.issue.pullRequest.githubPrNumber) || [];
    expect(matchedPrNumbers).toContain(101);
    expect(matchedPrNumbers).toContain(125);
    expect(matchedPrNumbers).toContain(143);

    // Assert all similarity scores are >= 0.75
    for (const match of sqlIssue?.similarIssues || []) {
      expect(match.score).toBeGreaterThanOrEqual(0.75);
    }

    // CRITICAL SECURITY ASSERTION:
    // Ensure Org B's PR #301 issue NEVER leaked into Org A's results
    expect(matchedPrNumbers).not.toContain(301);

    // Assert applicable team rule was attached
    expect(sqlIssue?.applicableRules.length).toBeGreaterThan(0);
    expect(sqlIssue?.applicableRules[0].name).toContain('SQL');
  });
});
