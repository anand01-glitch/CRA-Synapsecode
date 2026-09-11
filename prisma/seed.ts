import { PrismaClient } from '@prisma/client';
import { MockEmbeddingProvider } from '../src/lib/embedding/mock-embedding';
import { VectorSimilarityService } from '../src/lib/similarity/similarity-service';

const prisma = new PrismaClient();
const embeddingProvider = new MockEmbeddingProvider();
const similarityService = new VectorSimilarityService();

async function main() {
  console.log('--- Cleaning previous database records ---');
  await prisma.issueSimilarity.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.pullRequest.deleteMany({});
  await prisma.repository.deleteMany({});
  await prisma.teamRule.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.gitHubInstallation.deleteMany({});
  await prisma.organization.deleteMany({});

  console.log('--- Seeding Organizations ---');
  const acmeOrg = await prisma.organization.create({
    data: {
      name: 'Acme Technologies',
      slug: 'acme-tech',
      similarityThreshold: 0.75,
    },
  });

  const starkOrg = await prisma.organization.create({
    data: {
      name: 'Stark Industries',
      slug: 'stark-industries',
      similarityThreshold: 0.75,
    },
  });

  console.log('--- Seeding Users ---');
  const adminUser = await prisma.user.create({
    data: {
      email: 'alex.chen@acme.corp',
      name: 'Alex Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'ADMIN',
      organizationId: acmeOrg.id,
    },
  });

  const devUser = await prisma.user.create({
    data: {
      email: 'sarah.connor@acme.corp',
      name: 'Sarah Connor',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'DEVELOPER',
      organizationId: acmeOrg.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'tony@stark.corp',
      name: 'Tony Stark',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'ADMIN',
      organizationId: starkOrg.id,
    },
  });

  console.log('--- Seeding Team Rules (Acme) ---');
  const ruleSql = await prisma.teamRule.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Prevent SQL Injections',
      category: 'security',
      severity: 'critical',
      ruleDescription: 'Never concatenate raw user input into SQL queries. Always use parameterized queries or an ORM.',
      recommendation: 'Use parameterized queries or an ORM query builder.',
      isActive: true,
    },
  });

  await prisma.teamRule.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Prevent Cross-Site Scripting (XSS)',
      category: 'security',
      severity: 'high',
      ruleDescription: 'Never use raw innerHTML or dangerouslySetInnerHTML without DOMPurify sanitization.',
      recommendation: 'Sanitize user HTML with DOMPurify or use standard safe React DOM elements.',
      isActive: true,
    },
  });

  await prisma.teamRule.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Mandatory Test Coverage for Core Logic',
      category: 'testing',
      severity: 'medium',
      ruleDescription: 'Feature, service, and controller changes must include accompanying automated test files.',
      recommendation: 'Add corresponding unit or integration tests for modified business logic.',
      isActive: true,
    },
  });

  await prisma.teamRule.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'DRY Code Architecture',
      category: 'code_quality',
      severity: 'medium',
      ruleDescription: 'Refactor duplicated code blocks exceeding 10 lines into shared reusable utilities.',
      recommendation: 'Refactor duplicated code into a shared utility module or abstract base class.',
      isActive: true,
    },
  });

  await prisma.teamRule.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Prevent N+1 Query Bottlenecks',
      category: 'performance',
      severity: 'high',
      ruleDescription: 'Never execute asynchronous database queries inside loops.',
      recommendation: 'Batch queries using a single IN clause, JOIN statement, or Promise.all call outside the loop.',
      isActive: true,
    },
  });

  console.log('--- Seeding Repositories ---');
  const repoApi = await prisma.repository.create({
    data: {
      name: 'api-service',
      fullName: 'acme/api-service',
      organizationId: acmeOrg.id,
    },
  });

  const repoWeb = await prisma.repository.create({
    data: {
      name: 'web-dashboard',
      fullName: 'acme/web-dashboard',
      organizationId: acmeOrg.id,
    },
  });

  const repoAuth = await prisma.repository.create({
    data: {
      name: 'authentication-service',
      fullName: 'acme/authentication-service',
      organizationId: acmeOrg.id,
    },
  });

  const repoPayment = await prisma.repository.create({
    data: {
      name: 'payment-service',
      fullName: 'acme/payment-service',
      organizationId: acmeOrg.id,
    },
  });

  // Stark repo
  const starkRepo = await prisma.repository.create({
    data: {
      name: 'arc-reactor',
      fullName: 'stark/arc-reactor',
      organizationId: starkOrg.id,
    },
  });

  console.log('--- Seeding Pull Requests & Historical Issues ---');

  // PR #101 (Acme - SQL Injection 1)
  const pr101 = await prisma.pullRequest.create({
    data: {
      githubPrNumber: 101,
      title: 'User login authentication update',
      description: 'Refactor authentication credentials query to support legacy username lookups.',
      author: 'dev1',
      branch: 'feature/login-fix',
      status: 'merged',
      reviewStatus: 'COMPLETED',
      riskLevel: 'high',
      repositoryId: repoAuth.id,
      organizationId: acmeOrg.id,
      createdAt: new Date(Date.now() - 30 * 86400000), // 30 days ago
    },
  });

  const review101 = await prisma.review.create({
    data: {
      pullRequestId: pr101.id,
      summary: 'High-severity security vulnerability identified: raw SQL concatenation.',
      riskLevel: 'high',
      status: 'COMPLETED',
      tokensUsed: 450,
    },
  });

  const embed101 = await embeddingProvider.generateEmbedding(
    'security Possible SQL injection vulnerability User-controlled input is concatenated directly into a SQL query string query = "SELECT * FROM users WHERE username = " + username auth/db.py'
  );

  const issue101 = await prisma.issue.create({
    data: {
      reviewId: review101.id,
      organizationId: acmeOrg.id,
      repositoryId: repoAuth.id,
      pullRequestId: pr101.id,
      category: 'security',
      severity: 'high',
      filePath: 'auth/db.py',
      lineStart: 42,
      lineEnd: 42,
      title: 'Possible SQL injection vulnerability',
      explanation: 'User-controlled input is concatenated directly into a SQL query string without sanitization or parameterization.',
      recommendation: 'Use parameterized queries or an ORM query builder.',
      codeSnippet: 'query = "SELECT * FROM users WHERE username = " + username',
      confidence: 0.94,
      embedding: JSON.stringify(embed101),
      createdAt: new Date(Date.now() - 30 * 86400000),
    },
  });

  // PR #125 (Acme - SQL Injection 2)
  const pr125 = await prisma.pullRequest.create({
    data: {
      githubPrNumber: 125,
      title: 'User profile retrieval endpoint',
      description: 'Add direct endpoint for fast profile lookup by user ID.',
      author: 'dev2',
      branch: 'feature/profile-endpoint',
      status: 'merged',
      reviewStatus: 'COMPLETED',
      riskLevel: 'high',
      repositoryId: repoApi.id,
      organizationId: acmeOrg.id,
      createdAt: new Date(Date.now() - 20 * 86400000), // 20 days ago
    },
  });

  const review125 = await prisma.review.create({
    data: {
      pullRequestId: pr125.id,
      summary: 'Security vulnerability detected in profile query logic.',
      riskLevel: 'high',
      status: 'COMPLETED',
      tokensUsed: 390,
    },
  });

  const embed125 = await embeddingProvider.generateEmbedding(
    'security Possible SQL injection vulnerability User-controlled input is concatenated directly into a SQL query string query = "SELECT * FROM profiles WHERE user_id = " + user_id api/users.py'
  );

  const issue125 = await prisma.issue.create({
    data: {
      reviewId: review125.id,
      organizationId: acmeOrg.id,
      repositoryId: repoApi.id,
      pullRequestId: pr125.id,
      category: 'security',
      severity: 'high',
      filePath: 'api/users.py',
      lineStart: 18,
      lineEnd: 18,
      title: 'Possible SQL injection vulnerability',
      explanation: 'User-controlled input is concatenated directly into a SQL query string without sanitization or parameterization.',
      recommendation: 'Use parameterized queries or an ORM query builder.',
      codeSnippet: 'query = "SELECT * FROM profiles WHERE user_id = " + user_id',
      confidence: 0.94,
      embedding: JSON.stringify(embed125),
      createdAt: new Date(Date.now() - 20 * 86400000),
    },
  });

  // PR #143 (Acme - SQL Injection 3)
  const pr143 = await prisma.pullRequest.create({
    data: {
      githubPrNumber: 143,
      title: 'Payment webhook verification and invoice lookup',
      description: 'Verify payment webhook notifications and lookup invoices.',
      author: 'dev3',
      branch: 'feature/webhook-verification',
      status: 'merged',
      reviewStatus: 'COMPLETED',
      riskLevel: 'high',
      repositoryId: repoPayment.id,
      organizationId: acmeOrg.id,
      createdAt: new Date(Date.now() - 10 * 86400000), // 10 days ago
    },
  });

  const review143 = await prisma.review.create({
    data: {
      pullRequestId: pr143.id,
      summary: 'SQL injection detected in invoice lookup statement.',
      riskLevel: 'high',
      status: 'COMPLETED',
      tokensUsed: 420,
    },
  });

  const embed143 = await embeddingProvider.generateEmbedding(
    'security Possible SQL injection vulnerability User-controlled input is concatenated directly into a SQL query string query = "SELECT * FROM invoices WHERE id = " + invoice_id services/payments.py'
  );

  const issue143 = await prisma.issue.create({
    data: {
      reviewId: review143.id,
      organizationId: acmeOrg.id,
      repositoryId: repoPayment.id,
      pullRequestId: pr143.id,
      category: 'security',
      severity: 'high',
      filePath: 'services/payments.py',
      lineStart: 77,
      lineEnd: 77,
      title: 'Possible SQL injection vulnerability',
      explanation: 'User-controlled input is concatenated directly into a SQL query string without sanitization or parameterization.',
      recommendation: 'Use parameterized queries or an ORM query builder.',
      codeSnippet: 'query = "SELECT * FROM invoices WHERE id = " + invoice_id',
      confidence: 0.94,
      embedding: JSON.stringify(embed143),
      createdAt: new Date(Date.now() - 10 * 86400000),
    },
  });

  // PR #102 (Acme - XSS)
  const pr102 = await prisma.pullRequest.create({
    data: {
      githubPrNumber: 102,
      title: 'Dashboard profile bio banner rendering',
      description: 'Render user markdown bio directly on profile header.',
      author: 'dev4',
      branch: 'feature/profile-bio',
      status: 'open',
      reviewStatus: 'COMPLETED',
      riskLevel: 'high',
      repositoryId: repoWeb.id,
      organizationId: acmeOrg.id,
      createdAt: new Date(Date.now() - 8 * 86400000),
    },
  });

  const embed102 = await embeddingProvider.generateEmbedding(
    'security Possible Cross-Site Scripting (XSS) vulnerability Unsanitized raw HTML rendering via dangerouslySetInnerHTML dangerouslySetInnerHTML={{ __html: profileBio }} components/ProfileBanner.tsx'
  );

  const review102 = await prisma.review.create({
    data: {
      pullRequestId: pr102.id,
      summary: 'XSS vulnerability identified in user bio rendering.',
      riskLevel: 'high',
      status: 'COMPLETED',
      tokensUsed: 310,
    },
  });

  await prisma.issue.create({
    data: {
      reviewId: review102.id,
      organizationId: acmeOrg.id,
      repositoryId: repoWeb.id,
      pullRequestId: pr102.id,
      category: 'security',
      severity: 'high',
      filePath: 'components/ProfileBanner.tsx',
      lineStart: 35,
      lineEnd: 35,
      title: 'Possible Cross-Site Scripting (XSS) vulnerability',
      explanation: 'Unsanitized raw HTML rendering via innerHTML or dangerouslySetInnerHTML can execute untrusted JavaScript scripts.',
      recommendation: 'Sanitize user HTML with DOMPurify or use standard safe React DOM elements.',
      codeSnippet: '<div dangerouslySetInnerHTML={{ __html: profileBio }} />',
      confidence: 0.92,
      embedding: JSON.stringify(embed102),
      createdAt: new Date(Date.now() - 8 * 86400000),
    },
  });

  // PR #103 (Acme - Missing Tests)
  const pr103 = await prisma.pullRequest.create({
    data: {
      githubPrNumber: 103,
      title: 'Billing calculation service upgrades',
      description: 'Upgrade discount tier calculation logic in billing engine.',
      author: 'dev2',
      branch: 'feature/discount-tiers',
      status: 'open',
      reviewStatus: 'COMPLETED',
      riskLevel: 'medium',
      repositoryId: repoApi.id,
      organizationId: acmeOrg.id,
      createdAt: new Date(Date.now() - 6 * 86400000),
    },
  });

  const review103 = await prisma.review.create({
    data: {
      pullRequestId: pr103.id,
      summary: 'Missing automated tests for billing core logic.',
      riskLevel: 'medium',
      status: 'COMPLETED',
      tokensUsed: 290,
    },
  });

  const embed103 = await embeddingProvider.generateEmbedding(
    'testing Missing automated tests for core application logic Core business/service logic modified without test file billing/calculator.ts'
  );

  await prisma.issue.create({
    data: {
      reviewId: review103.id,
      organizationId: acmeOrg.id,
      repositoryId: repoApi.id,
      pullRequestId: pr103.id,
      category: 'testing',
      severity: 'medium',
      filePath: 'billing/calculator.ts',
      lineStart: 1,
      lineEnd: 5,
      title: 'Missing automated tests for core application logic',
      explanation: 'Core business/service logic was modified without accompanying test file updates in the pull request.',
      recommendation: 'Add corresponding unit or integration tests to verify the modified controller/service logic.',
      codeSnippet: '// billing/calculator.ts modified without tests/billing.test.ts',
      confidence: 0.95,
      embedding: JSON.stringify(embed103),
      createdAt: new Date(Date.now() - 6 * 86400000),
    },
  });

  // PR #104 (Acme - Duplicate Code)
  const pr104 = await prisma.pullRequest.create({
    data: {
      githubPrNumber: 104,
      title: 'Customer analytics exporter logic',
      description: 'Add CSV and PDF export routines for customer reports.',
      author: 'dev1',
      branch: 'feature/analytics-exporter',
      status: 'open',
      reviewStatus: 'COMPLETED',
      riskLevel: 'medium',
      repositoryId: repoWeb.id,
      organizationId: acmeOrg.id,
      createdAt: new Date(Date.now() - 4 * 86400000),
    },
  });

  const review104 = await prisma.review.create({
    data: {
      pullRequestId: pr104.id,
      summary: 'Duplicate format mapper detected across PDF and CSV pipelines.',
      riskLevel: 'medium',
      status: 'COMPLETED',
      tokensUsed: 320,
    },
  });

  const embed104 = await embeddingProvider.generateEmbedding(
    'code_quality Duplicate or redundant code block detected Repeated transformation blocks utils/export.ts'
  );

  await prisma.issue.create({
    data: {
      reviewId: review104.id,
      organizationId: acmeOrg.id,
      repositoryId: repoWeb.id,
      pullRequestId: pr104.id,
      category: 'code_quality',
      severity: 'medium',
      filePath: 'utils/export.ts',
      lineStart: 12,
      lineEnd: 24,
      title: 'Duplicate or redundant code block detected',
      explanation: 'A near-identical multi-line code block was detected across multiple modules in this pull request.',
      recommendation: 'Refactor duplicated code into a shared utility module or abstract base class.',
      codeSnippet: 'const formattedResult = items.map(i => ({ id: i.id, name: i.name, value: i.val }));',
      confidence: 0.88,
      embedding: JSON.stringify(embed104),
      createdAt: new Date(Date.now() - 4 * 86400000),
    },
  });

  // PR #105 (Acme - Performance N+1)
  const pr105 = await prisma.pullRequest.create({
    data: {
      githubPrNumber: 105,
      title: 'Batch payment settlement reconciliation loop',
      description: 'Process pending payment records in nightly batch loop.',
      author: 'dev3',
      branch: 'feature/batch-settlement',
      status: 'open',
      reviewStatus: 'COMPLETED',
      riskLevel: 'high',
      repositoryId: repoPayment.id,
      organizationId: acmeOrg.id,
      createdAt: new Date(Date.now() - 3 * 86400000),
    },
  });

  const review105 = await prisma.review.create({
    data: {
      pullRequestId: pr105.id,
      summary: 'N+1 query bottleneck detected inside batch processor loop.',
      riskLevel: 'high',
      status: 'COMPLETED',
      tokensUsed: 360,
    },
  });

  const embed105 = await embeddingProvider.generateEmbedding(
    'performance Database query inside iteration loop (N+1 problem) Executing database queries inside loop jobs/settlement.ts'
  );

  await prisma.issue.create({
    data: {
      reviewId: review105.id,
      organizationId: acmeOrg.id,
      repositoryId: repoPayment.id,
      pullRequestId: pr105.id,
      category: 'performance',
      severity: 'high',
      filePath: 'jobs/settlement.ts',
      lineStart: 55,
      lineEnd: 58,
      title: 'Database query inside iteration loop (N+1 problem)',
      explanation: 'Executing asynchronous database queries or API calls inside a loop creates N+1 performance bottlenecks.',
      recommendation: 'Batch queries using a single IN clause, JOIN statement, or Promise.all call outside the loop.',
      codeSnippet: 'for (const item of items) { await db.query("SELECT * FROM tx WHERE id = ?", item.id); }',
      confidence: 0.89,
      embedding: JSON.stringify(embed105),
      createdAt: new Date(Date.now() - 3 * 86400000),
    },
  });

  // PR #106, #107, #108 (Clean PRs)
  for (const item of [
    { prNum: 106, title: 'Clean cache invalidation service', repo: repoApi },
    { prNum: 107, title: 'Password reset token generation and hashing', repo: repoAuth },
    { prNum: 108, title: 'Navigation bar active tab styling update', repo: repoWeb },
  ]) {
    const pr = await prisma.pullRequest.create({
      data: {
        githubPrNumber: item.prNum,
        title: item.title,
        description: 'Routine maintenance and improvements.',
        author: 'dev1',
        branch: `feature/${item.prNum}-clean`,
        status: 'open',
        reviewStatus: 'COMPLETED',
        riskLevel: 'low',
        repositoryId: item.repo.id,
        organizationId: acmeOrg.id,
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
    });

    await prisma.review.create({
      data: {
        pullRequestId: pr.id,
        summary: 'Automated AI review completed successfully. No critical, high, or medium issues detected.',
        riskLevel: 'low',
        status: 'COMPLETED',
        tokensUsed: 180,
      },
    });
  }

  // PR #200 (The Crown Jewel Demo PR - Acme)
  console.log('--- Seeding PR #200 (Target Demo PR with SQL Injection) ---');
  const pr200 = await prisma.pullRequest.create({
    data: {
      githubPrNumber: 200,
      title: 'Session persistence and database lookup',
      description: 'Implement persistent session validation query in authentication database module.',
      author: 'dev4',
      branch: 'feature/session-persistence',
      status: 'open',
      reviewStatus: 'COMPLETED',
      riskLevel: 'high',
      repositoryId: repoAuth.id,
      organizationId: acmeOrg.id,
      createdAt: new Date(),
    },
  });

  const review200 = await prisma.review.create({
    data: {
      pullRequestId: pr200.id,
      summary: 'One high-severity security issue was found: SQL injection vulnerability.',
      riskLevel: 'high',
      status: 'COMPLETED',
      tokensUsed: 420,
    },
  });

  const embed200 = await embeddingProvider.generateEmbedding(
    'security Possible SQL injection vulnerability User-controlled input is concatenated directly into a SQL query string query = "SELECT * FROM users WHERE id = " + user_id authentication/database.py'
  );

  const issue200 = await prisma.issue.create({
    data: {
      reviewId: review200.id,
      organizationId: acmeOrg.id,
      repositoryId: repoAuth.id,
      pullRequestId: pr200.id,
      category: 'security',
      severity: 'high',
      filePath: 'authentication/database.py',
      lineStart: 22,
      lineEnd: 22,
      title: 'Possible SQL injection vulnerability',
      explanation: 'User-controlled input is concatenated directly into a SQL query string without sanitization or parameterization.',
      recommendation: 'Use parameterized queries or an ORM query builder.',
      codeSnippet: 'query = "SELECT * FROM users WHERE id = " + user_id',
      confidence: 0.94,
      embedding: JSON.stringify(embed200),
      createdAt: new Date(),
    },
  });

  // Calculate and store similarity links for PR #200 against historical PRs (#101, #125, #143)
  for (const pastIssue of [issue101, issue125, issue143]) {
    const pastVector = JSON.parse(pastIssue.embedding);
    const score = similarityService.calculateCosineSimilarity(embed200, pastVector);
    if (score >= 0.75) {
      await prisma.issueSimilarity.create({
        data: {
          sourceIssueId: issue200.id,
          matchedIssueId: pastIssue.id,
          score,
        },
      });
      console.log(`Linked PR #200 issue to PR #${pastIssue.id} with similarity score: ${score}`);
    }
  }

  // PR #301 (Stark Industries - SQL Injection in Org 2 for Isolation Testing)
  console.log('--- Seeding Org 2 (Stark Industries) Issue for Multi-Tenant Testing ---');
  const pr301 = await prisma.pullRequest.create({
    data: {
      githubPrNumber: 301,
      title: 'Core energy telemetry query',
      description: 'Query telemetry points by reactor id.',
      author: 'jarvis',
      branch: 'feature/reactor-telemetry',
      status: 'open',
      reviewStatus: 'COMPLETED',
      riskLevel: 'high',
      repositoryId: starkRepo.id,
      organizationId: starkOrg.id,
      createdAt: new Date(),
    },
  });

  const review301 = await prisma.review.create({
    data: {
      pullRequestId: pr301.id,
      summary: 'SQL injection in reactor telemetry.',
      riskLevel: 'high',
      status: 'COMPLETED',
      tokensUsed: 400,
    },
  });

  const embed301 = await embeddingProvider.generateEmbedding(
    'security Possible SQL injection vulnerability User-controlled input is concatenated directly into a SQL query string query = "SELECT * FROM telemetry WHERE reactor_id = " + id core/telemetry.py'
  );

  await prisma.issue.create({
    data: {
      reviewId: review301.id,
      organizationId: starkOrg.id, // Strictly Stark Org!
      repositoryId: starkRepo.id,
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
      createdAt: new Date(),
    },
  });

  console.log('--- Seed Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
