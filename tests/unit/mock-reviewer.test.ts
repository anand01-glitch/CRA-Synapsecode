import { describe, it, expect } from 'vitest';
import { MockCodeReviewer } from '../../src/lib/ai/mock-reviewer';
import { PRReviewContext } from '../../src/lib/types/review';

describe('MockCodeReviewer - Deterministic Rule Engine', () => {
  const reviewer = new MockCodeReviewer();

  const createContext = (files: PRReviewContext['files']): PRReviewContext => ({
    organizationId: 'org_test',
    repositoryId: 'repo_test',
    pullRequestId: 'pr_test',
    prNumber: 999,
    prTitle: 'Test PR',
    files,
  });

  describe('Rule 1: SQL Injection', () => {
    it('detects SQL concatenation vulnerability on dirty code', async () => {
      const context = createContext([
        {
          filename: 'authentication/database.py',
          status: 'modified',
          additions: 1,
          deletions: 0,
          content: 'query = "SELECT * FROM users WHERE id=" + user_id',
        },
      ]);

      const review = await reviewer.analyzePR(context);
      const sqlIssue = review.issues.find(
        (i) => i.category === 'security' && i.title.toLowerCase().includes('sql injection')
      );

      expect(sqlIssue).toBeDefined();
      expect(sqlIssue?.severity).toBe('high');
      expect(sqlIssue?.recommendation).toContain('parameterized queries');
    });

    it('does not trigger on parameterized or ORM queries (no false positive)', async () => {
      const context = createContext([
        {
          filename: 'authentication/database.py',
          status: 'modified',
          additions: 1,
          deletions: 0,
          content: 'const user = await prisma.user.findUnique({ where: { id: userId } });',
        },
      ]);

      const review = await reviewer.analyzePR(context);
      const sqlIssue = review.issues.find(
        (i) => i.category === 'security' && i.title.toLowerCase().includes('sql injection')
      );

      expect(sqlIssue).toBeUndefined();
    });
  });

  describe('Rule 2: Cross-Site Scripting (XSS)', () => {
    it('detects dangerouslySetInnerHTML on dirty code', async () => {
      const context = createContext([
        {
          filename: 'components/UserProfile.tsx',
          status: 'modified',
          additions: 1,
          deletions: 0,
          content: '<div dangerouslySetInnerHTML={{ __html: userBio }} />',
        },
      ]);

      const review = await reviewer.analyzePR(context);
      const xssIssue = review.issues.find(
        (i) => i.category === 'security' && i.title.toLowerCase().includes('cross-site scripting')
      );

      expect(xssIssue).toBeDefined();
      expect(xssIssue?.severity).toBe('high');
      expect(xssIssue?.recommendation).toContain('DOMPurify');
    });

    it('does not trigger on standard safe JSX element interpolation', async () => {
      const context = createContext([
        {
          filename: 'components/UserProfile.tsx',
          status: 'modified',
          additions: 1,
          deletions: 0,
          content: '<div className="user-bio">{userBio}</div>',
        },
      ]);

      const review = await reviewer.analyzePR(context);
      const xssIssue = review.issues.find(
        (i) => i.category === 'security' && i.title.toLowerCase().includes('cross-site scripting')
      );

      expect(xssIssue).toBeUndefined();
    });
  });

  describe('Rule 3: Missing Tests', () => {
    it('detects when core service logic is modified without test files', async () => {
      const context = createContext([
        {
          filename: 'src/services/billing-service.ts',
          status: 'modified',
          additions: 20,
          deletions: 2,
          content: 'export class BillingService { computeTotal() { return 100; } }',
        },
      ]);

      const review = await reviewer.analyzePR(context);
      const testIssue = review.issues.find((i) => i.category === 'testing');

      expect(testIssue).toBeDefined();
      expect(testIssue?.severity).toBe('medium');
      expect(testIssue?.title).toContain('Missing automated tests');
    });

    it('does not trigger when corresponding test file is included in changeset', async () => {
      const context = createContext([
        {
          filename: 'src/services/billing-service.ts',
          status: 'modified',
          additions: 20,
          deletions: 2,
          content: 'export class BillingService { computeTotal() { return 100; } }',
        },
        {
          filename: 'tests/billing-service.test.ts',
          status: 'added',
          additions: 30,
          deletions: 0,
          content: 'describe("BillingService", () => { it("computes total", () => {}); });',
        },
      ]);

      const review = await reviewer.analyzePR(context);
      const testIssue = review.issues.find((i) => i.category === 'testing');

      expect(testIssue).toBeUndefined();
    });
  });

  describe('Rule 4: Duplicate Code', () => {
    it('detects repeated redundant blocks', async () => {
      const context = createContext([
        {
          filename: 'utils/formatter.ts',
          status: 'modified',
          additions: 10,
          deletions: 0,
          content: '// DUPLICATE_BLOCK\nconst formattedResult = items.map(i => ({ id: i.id, name: i.name, value: i.val }));',
        },
      ]);

      const review = await reviewer.analyzePR(context);
      const duplicateIssue = review.issues.find((i) => i.category === 'code_quality');

      expect(duplicateIssue).toBeDefined();
      expect(duplicateIssue?.severity).toBe('medium');
    });

    it('does not trigger on refactored reusable logic', async () => {
      const context = createContext([
        {
          filename: 'utils/formatter.ts',
          status: 'modified',
          additions: 5,
          deletions: 0,
          content: 'export const formatItem = (i: Item) => ({ id: i.id, name: i.name, value: i.val });',
        },
      ]);

      const review = await reviewer.analyzePR(context);
      const duplicateIssue = review.issues.find((i) => i.category === 'code_quality');

      expect(duplicateIssue).toBeUndefined();
    });
  });

  describe('Rule 5: Performance - Loop DB Query (N+1)', () => {
    it('detects asynchronous database queries inside iteration loop', async () => {
      const context = createContext([
        {
          filename: 'jobs/sync.ts',
          status: 'modified',
          additions: 5,
          deletions: 0,
          content: 'for (const item of items) { await db.query("SELECT * FROM log WHERE item_id = ?", item.id); }',
        },
      ]);

      const review = await reviewer.analyzePR(context);
      const perfIssue = review.issues.find((i) => i.category === 'performance');

      expect(perfIssue).toBeDefined();
      expect(perfIssue?.severity).toBe('high');
      expect(perfIssue?.title).toContain('iteration loop');
    });

    it('does not trigger on batched bulk queries outside loops', async () => {
      const context = createContext([
        {
          filename: 'jobs/sync.ts',
          status: 'modified',
          additions: 2,
          deletions: 0,
          content: 'const logs = await db.query("SELECT * FROM log WHERE item_id IN (?)", itemIds);',
        },
      ]);

      const review = await reviewer.analyzePR(context);
      const perfIssue = review.issues.find((i) => i.category === 'performance');

      expect(perfIssue).toBeUndefined();
    });
  });
});
