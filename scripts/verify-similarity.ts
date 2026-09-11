import { PrismaClient } from '@prisma/client';
import { VectorSimilarityService } from '../src/lib/similarity/similarity-service';

const prisma = new PrismaClient();
const similarityService = new VectorSimilarityService();

async function verifyPR200() {
  console.log('================================================================');
  console.log('AI CODE REVIEW SAAS: STANDALONE SIMILARITY VERIFICATION (PR #200)');
  console.log('================================================================\n');

  // Step 1: Fetch PR #200
  const pr200 = await prisma.pullRequest.findFirst({
    where: { githubPrNumber: 200 },
    include: {
      organization: true,
      repository: true,
      issues: true,
    },
  });

  if (!pr200) {
    console.error('ERROR: PR #200 not found in database. Run `npm run seed` first.');
    process.exit(1);
  }

  console.log(`Pull Request: PR #${pr200.githubPrNumber} - "${pr200.title}"`);
  console.log(`Repository:   ${pr200.repository.fullName}`);
  console.log(`Organization: ${pr200.organization.name} (ID: ${pr200.organizationId})`);
  console.log(`Status:       ${pr200.reviewStatus} | Risk Level: ${pr200.riskLevel.toUpperCase()}`);
  console.log(`Detected Issues: ${pr200.issues.length}\n`);

  const primaryIssue = pr200.issues[0];
  if (!primaryIssue) {
    console.error('ERROR: No issues recorded for PR #200.');
    process.exit(1);
  }

  console.log('--- Issue Details ---');
  console.log(`[${primaryIssue.severity.toUpperCase()}] ${primaryIssue.title}`);
  console.log(`File: ${primaryIssue.filePath}:${primaryIssue.lineStart}`);
  console.log(`Snippet: "${primaryIssue.codeSnippet}"\n`);

  // Step 2: Query pgvector / vector similarity service
  const targetEmbedding = JSON.parse(primaryIssue.embedding);
  const matchedIssues = await similarityService.findSimilarIssues({
    organizationId: pr200.organizationId,
    targetEmbedding,
    excludeIssueId: primaryIssue.id,
    excludePrId: pr200.id,
    threshold: 0.75,
    limit: 5,
  });

  console.log('--- Organizational Memory: Previous Similar Issues Detected ---');
  console.log(`Found ${matchedIssues.length} recurring occurrences with similarity >= 0.75:\n`);

  matchedIssues.forEach((match, idx) => {
    console.log(`  ${idx + 1}. PR #${match.issue.pullRequest.githubPrNumber}: "${match.issue.pullRequest.title}"`);
    console.log(`     Repository: ${match.issue.repository.name}`);
    console.log(`     File:       ${match.issue.filePath}:${match.issue.lineStart}`);
    console.log(`     Snippet:    ${match.issue.codeSnippet}`);
    console.log(`     Similarity: ${(match.score * 100).toFixed(1)}%`);
    console.log('');
  });

  // Verify that PR #101, #125, #143 are present
  const matchedPrNumbers = matchedIssues.map((m) => m.issue.pullRequest.githubPrNumber);
  const expectedPrNumbers = [101, 125, 143];
  const allFound = expectedPrNumbers.every((num) => matchedPrNumbers.includes(num));

  // Step 3: Verify Multi-Tenancy Isolation
  const starkOrg = await prisma.organization.findUnique({
    where: { slug: 'stark-industries' },
  });

  let crossOrgLeakage = false;
  if (starkOrg) {
    const leakedMatches = await similarityService.findSimilarIssues({
      organizationId: pr200.organizationId,
      targetEmbedding,
      threshold: 0.1, // Even at a low threshold, Org B issues must never return
    });

    const anyStarkIssue = leakedMatches.some(
      (m) => m.issue.pullRequest.githubPrNumber === 301
    );

    if (anyStarkIssue) {
      crossOrgLeakage = true;
    }
  }

  // Step 4: Check Team Rule link
  const teamRule = await prisma.teamRule.findFirst({
    where: {
      organizationId: pr200.organizationId,
      name: { contains: 'SQL' },
    },
  });

  console.log('--- Applicable Team Rule ---');
  if (teamRule) {
    console.log(`Rule: "${teamRule.name}" (${teamRule.category} - ${teamRule.severity})`);
    console.log(`Directive: ${teamRule.ruleDescription}`);
    console.log(`Recommendation: ${teamRule.recommendation}\n`);
  }

  console.log('--- Verification Summary ---');
  console.log(`[${allFound ? 'PASS' : 'FAIL'}] Historical PRs #101, #125, and #143 matched successfully.`);
  console.log(`[${!crossOrgLeakage ? 'PASS' : 'FAIL'}] Zero multi-tenant cross-org leakage (Stark Industries PR #301 excluded).`);

  if (!allFound || crossOrgLeakage) {
    console.error('\nSimilarity verification failed!');
    process.exit(1);
  } else {
    console.log('\n>>> All Phase 1 Core Logic & Similarity Verification criteria PASSED! <<<\n');
  }
}

verifyPR200()
  .catch((err) => {
    console.error('Verification error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
