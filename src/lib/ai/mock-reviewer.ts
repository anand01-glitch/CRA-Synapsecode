import { CodeReviewer } from './reviewer-interface';
import { PRReviewContext, ReviewIssue, ReviewOutput } from '../types/review';

export class MockCodeReviewer implements CodeReviewer {
  async analyzePR(context: PRReviewContext): Promise<ReviewOutput> {
    const issues: ReviewIssue[] = [];

    // Check if any test file was modified in this PR
    const hasTestFile = context.files.some(
      (f) =>
        f.filename.includes('.test.') ||
        f.filename.includes('.spec.') ||
        f.filename.includes('test_') ||
        f.filename.includes('_test') ||
        f.filename.startsWith('tests/')
    );

    // Rule 3: Missing Tests check for core logic files
    const coreLogicModified = context.files.some((f) => {
      const path = f.filename.toLowerCase();
      return (
        (path.includes('service') ||
          path.includes('controller') ||
          path.includes('api') ||
          path.includes('database') ||
          path.includes('auth')) &&
        !hasTestFile
      );
    });

    if (coreLogicModified && !hasTestFile) {
      const firstCoreFile = context.files.find((f) => {
        const path = f.filename.toLowerCase();
        return (
          path.includes('service') ||
          path.includes('controller') ||
          path.includes('api') ||
          path.includes('database') ||
          path.includes('auth')
        );
      });

      issues.push({
        category: 'testing',
        severity: 'medium',
        filePath: firstCoreFile ? firstCoreFile.filename : context.files[0]?.filename || 'src/service.ts',
        lineStart: 1,
        lineEnd: 5,
        title: 'Missing automated tests for core application logic',
        explanation: 'Core business/service logic was modified without accompanying test file updates in the pull request.',
        recommendation: 'Add corresponding unit or integration tests to verify the modified controller/service logic.',
        codeSnippet: `// Changed file: ${firstCoreFile?.filename || 'core service'}\n// No corresponding .test.ts or .spec.ts file found in changeset`,
        confidence: 0.95,
      });
    }

    // Inspect individual files line by line / block by block
    for (const file of context.files) {
      const content = file.content || file.patch || '';
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Rule 1: SQL Injection
        // Look for string concatenation or template interpolation into SQL queries
        const sqlConcatRegex = /(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s+.*(\+|\${).*(user_id|req\.body|input|query|params)/i;
        const sqlStringConcat = /(query|sql|stmt)\s*=\s*['"].*(SELECT|INSERT|UPDATE|DELETE).*['"]\s*\+/i;

        if (sqlConcatRegex.test(line) || sqlStringConcat.test(line)) {
          issues.push({
            category: 'security',
            severity: 'high',
            filePath: file.filename,
            lineStart: lineNum,
            lineEnd: lineNum,
            title: 'Possible SQL injection vulnerability',
            explanation: 'User-controlled input is concatenated directly into a SQL query string without sanitization or parameterization.',
            recommendation: 'Use parameterized queries, prepared statements, or an ORM query builder to safely pass variables.',
            codeSnippet: line.trim(),
            confidence: 0.94,
          });
        }

        // Rule 2: XSS
        // Look for unsanitized innerHTML or dangerouslySetInnerHTML
        const xssRegex = /(dangerouslySetInnerHTML\s*=|element\.innerHTML\s*=|innerHTML\s*=)/i;
        if (xssRegex.test(line)) {
          issues.push({
            category: 'security',
            severity: 'high',
            filePath: file.filename,
            lineStart: lineNum,
            lineEnd: lineNum,
            title: 'Possible Cross-Site Scripting (XSS) vulnerability',
            explanation: 'Unsanitized raw HTML rendering via innerHTML or dangerouslySetInnerHTML can execute untrusted JavaScript scripts.',
            recommendation: 'Sanitize user HTML with DOMPurify or use standard safe React DOM elements.',
            codeSnippet: line.trim(),
            confidence: 0.92,
          });
        }

        // Rule 5: Performance - DB queries inside loops
        const loopQueryRegex = /(for|while|map|forEach)\s*\(.*(await|db\.|query|SELECT)/i;
        const awaitInLoop = /(for|while)\s*\(.*\{[\s\S]*?await\s+(db\.|query|fetch)/i;

        if (loopQueryRegex.test(line) || awaitInLoop.test(line)) {
          issues.push({
            category: 'performance',
            severity: 'high',
            filePath: file.filename,
            lineStart: lineNum,
            lineEnd: Math.min(lineNum + 3, lines.length),
            title: 'Database query inside iteration loop (N+1 problem)',
            explanation: 'Executing asynchronous database queries or API calls inside a loop creates N+1 performance bottlenecks.',
            recommendation: 'Batch queries using a single IN clause, JOIN statement, or Promise.all call outside the loop.',
            codeSnippet: line.trim(),
            confidence: 0.89,
          });
        }
      }

      // Rule 4: Duplicate Code detection (multi-line block duplicates)
      const duplicateMarker = /\/\/\s*DUPLICATE_BLOCK|const\s+formattedResult\s*=/i;
      if (duplicateMarker.test(content)) {
        issues.push({
          category: 'code_quality',
          severity: 'medium',
          filePath: file.filename,
          lineStart: 10,
          lineEnd: 25,
          title: 'Duplicate or redundant code block detected',
          explanation: 'A near-identical multi-line code block was detected across multiple modules in this pull request.',
          recommendation: 'Refactor duplicated code into a shared utility module or abstract base class.',
          codeSnippet: 'const formattedResult = items.map(i => ({ id: i.id, name: i.name, value: i.val }));',
          confidence: 0.88,
        });
      }
    }

    // Determine overall risk level
    let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (issues.some((i) => i.severity === 'critical')) {
      riskLevel = 'critical';
    } else if (issues.some((i) => i.severity === 'high')) {
      riskLevel = 'high';
    } else if (issues.some((i) => i.severity === 'medium')) {
      riskLevel = 'medium';
    }

    const summary =
      issues.length > 0
        ? `Automated AI review identified ${issues.length} potential issue(s) across security, performance, quality, or testing categories.`
        : 'Automated AI review completed successfully. No critical, high, or medium issues detected.';

    return {
      summary,
      riskLevel,
      issues,
    };
  }
}
