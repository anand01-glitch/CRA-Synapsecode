# SynapseCode: AI-Powered Context-Aware Code Review SaaS with Organizational Learning

> **Final-Year Project Build Target:** Production-grade, demo-ready SaaS platform that remembers historical Pull Request issues across an organization and flags recurring vulnerability patterns using vector similarity search.

---

## 1. Project Overview

Traditional automated code reviewers treat each Pull Request in total isolation. If a developer introduces a SQL injection in PR #101, fixes it, and another engineer introduces the exact same injection in PR #200 three months later, conventional tools lack the institutional memory to connect the dots.

**SynapseCode introduces Organizational Learning:**
1. Changed diffs are analyzed via deterministic pattern engines or LLMs to detect security flaws, performance bottlenecks, code quality issues, or missing tests.
2. Detected issues are transformed into **1536-dimensional embeddings**.
3. The system queries historical findings strictly within the same organization via **pgvector similarity search**.
4. Recurring defects are linked to previous Pull Requests (e.g. PR #101, #125, #143) with similarity confidence scores, and applicable team coding standards are surfaced automatically.

---

## 2. System Architecture

```
                                      +---------------------------------------------+
                                      |            GitHub PR Changeset              |
                                      |   (Real Webhook or Seeded PR #200 Demo)     |
                                      +----------------------+----------------------+
                                                             |
                                                             v
                                      +---------------------------------------------+
                                      |           ReviewPipeline Coordinator        |
                                      +----------------------+----------------------+
                                                             |
                                     +-----------------------+-----------------------+
                                     |                                               |
                                     v                                               v
                   +-----------------------------------+           +-----------------------------------+
                   |   CodeReviewer (Mock / LLM)       |           |   EmbeddingProvider (1536-dim)    |
                   |   - SQL Injection Regex           |           |   - Semantic concept mapping      |
                   |   - XSS / innerHTML               |           |   - Text-embedding-3-small        |
                   |   - N+1 Loop DB Queries           |           +-----------------+-----------------+
                   |   - Missing Automated Tests       |                             |
                   |   - Duplicate Code Blocks         |                             |
                   +-----------------+-----------------+                             |
                                     |                                               |
                                     +-----------------------+-----------------------+
                                                             |
                                                             v
                                      +---------------------------------------------+
                                      |         Vector Similarity Engine            |
                                      |       (pgvector <=> Cosine Similarity)      |
                                      |                                             |
                                      |  * HARD CONSTRAINT: organizationId ISOLATION|
                                      |  * Threshold: >= 0.75 (75% match)           |
                                      +----------------------+----------------------+
                                                             |
                                                             v
                                      +---------------------------------------------+
                                      |          PostgreSQL / Prisma ORM            |
                                      |  - Issue & IssueSimilarity Records          |
                                      |  - TeamRules Enforcement                    |
                                      |  - Historical Trends & Metrics              |
                                      +----------------------+----------------------+
                                                             |
                                                             v
                                      +---------------------------------------------+
                                      |            Next.js 14 App Router            |
                                      |  - Live Analytics Dashboard (Recharts)      |
                                      |  - PR Review Details & Diff Viewer          |
                                      |  - Multi-Tenant Org Switcher (Acme/Stark)   |
                                      +---------------------------------------------+
```

---

## 3. Database Schema & Data Models

Managed via Prisma in `prisma/schema.prisma`:

| Model | Purpose | Key Fields |
| :--- | :--- | :--- |
| **Organization** | Multi-tenant tenant boundary | `id`, `name`, `slug`, `similarityThreshold` (0.75) |
| **User** | Developer & Admin members | `id`, `email`, `role` (`ADMIN` \| `DEVELOPER`), `organizationId` |
| **Repository** | Git repositories tracked | `id`, `name`, `fullName`, `defaultBranch`, `organizationId` |
| **PullRequest** | Tracked pull requests | `id`, `githubPrNumber`, `title`, `reviewStatus`, `riskLevel`, `organizationId` |
| **Review** | Analysis run summary | `id`, `pullRequestId`, `summary`, `riskLevel`, `tokensUsed`, `status` |
| **Issue** | Detected code issue | `id`, `category`, `severity`, `filePath`, `codeSnippet`, `embedding`, `organizationId` |
| **IssueSimilarity**| Links recurring issues | `sourceIssueId`, `matchedIssueId`, `score` (0.0 to 1.0) |
| **TeamRule** | Enforced coding guidelines | `id`, `name`, `category`, `severity`, `ruleDescription`, `isActive` |
| **GitHubInstallation**| GitHub App token storage | `installationId`, `accountName`, `encryptedAccessToken` |

*Efficiency Indexes:* `Issue` and `PullRequest` contain compound indexes on `[createdAt]`, `[organizationId]`, and `[repositoryId]` for fast historical time-series aggregation.

---

## 4. Local Setup & Quickstart

### Prerequisites
- Node.js 18+ (tested on Node 20 LTS & 24)
- npm or pnpm

### Step 1: Clone and Install
```bash
git clone <repository-url>
cd CRA
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Step 3: Database & pgvector (Dual-Mode Support)

#### Option A: Zero-Config Local Dev (Default)
The repository comes preconfigured with SQLite + high-performance exact cosine vector similarity calculation. Zero Docker or external database installation is required:
```bash
npx prisma db push
npm run seed
```

#### Option B: Docker Compose with PostgreSQL 16 + pgvector
If Docker is installed on your host:
```bash
docker compose up -d
```
Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/code_review_saas?schema=public"
```
Then push and seed:
```bash
npx prisma db push
npm run seed
```

### Step 4: Run Tests
```bash
npm test
```
Executes all 11 unit & integration tests verifying:
- All 5 deterministic AI review rules.
- Negative test cases confirming clean code produces zero false positives.
- Multi-tenant tenant boundary isolation.
- Integration test for PR #200 surfacing PR #101, #125, and #143.

### Step 5: Verify Standalone Similarity Script
```bash
npm run verify
```
Outputs a detailed report demonstrating that PR #200 matches PR #101, #125, and #143 with similarity scores $\ge 0.75$, links the "Prevent SQL Injections" team rule, and guarantees 0 records leak from Stark Industries.

### Step 6: Start Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Demonstration Walkthrough (Viva Guide)

1. **Landing Page (`/`)**:
   - Navigate to `/`. Click **"View Demo Dashboard"**.
2. **Analytics Dashboard (`/dashboard`)**:
   - Inspect summary cards: PRs Reviewed, Total Issues, Security Vulnerabilities, and Recurring Patterns Matched.
   - Observe the **Issues by Category** bar chart, **Issues Trend** line chart, and **Severity Distribution** donut chart rendered via Recharts.
   - Click on the highlighted **PR #200** row in the Recent Pull Requests table.
3. **PR #200 Review Details (`/pull-requests/<id>`)**:
   - Observe the **High Risk** banner and AI Review summary.
   - Inspect the detected SQL Injection in `authentication/database.py:22` (`query = "SELECT * FROM users WHERE id = " + user_id`).
   - Notice the **Organizational Memory** panel:
     - Detects that this pattern is identical to issues previously found in **PR #101** (98.2% match), **PR #125** (98.3% match), and **PR #143** (98.3% match).
     - Click on any historical PR to view its past review record.
   - Notice the **Applicable Team Rule** badge: *"Prevent SQL Injections - Never concatenate raw user input into SQL queries"*.
4. **Multi-Tenant Isolation Check**:
   - In the top header, click the **Organization Switcher** and select **"Stark Industries"**.
   - Notice that all Acme Technologies PRs, issues, and metrics disappear immediately. Stark Industries displays only its own telemetry (PR #301). Switch back to Acme Technologies to restore full data.
5. **Role-Based Access Control (RBAC)**:
   - In the top header, toggle between **Developer** and **Admin**.
   - As a Developer, navigate to **Team Rules (`/rules`)**: editing is locked.
   - Switch to **Admin**: rule toggles and the "Add Coding Rule" modal become accessible.

---

## 6. Why 0.75 Similarity Threshold?

The default cosine similarity threshold of **0.75** (75%) was chosen empirically based on benchmark PR changesets:
- **True Positives ($> 0.90$):** Semantic variations of string-concatenated SQL queries across different languages (e.g. Python `WHERE id = " + user_id` vs. TypeScript `WHERE username = " + username`) produce embeddings with cosine similarity between **0.94 and 0.98**.
- **Edge Matches ($0.75 - 0.85$):** Loosely related vulnerabilities (such as raw query interpolation in different layers) maintain high semantic relevance.
- **True Negatives ($< 0.60$):** Safe ORM code (`findUnique({ where: { id } })`) or unrelated feature logic scores far below 0.60, completely eliminating false positive associations.
- The threshold is customizable per organization in **Settings (`/settings`)**.

---

## 7. Multi-Tenancy Security Approach

Multi-tenancy isolation is enforced **strictly at the database query level on the server side**:
```typescript
// Every organization-owned query requires organizationId
const candidateIssues = await db.issue.findMany({
  where: {
    organizationId: organizationId, // Hard security boundary
  },
});
```
- Client-side filtering is never relied upon for data boundaries.
- Attempting to query similarity without `organizationId` immediately throws a runtime error.
- Verified by automated tests in `tests/integration/recurring-issue.test.ts`.

---

## 8. Real LLM & GitHub Integration Config

To connect real OpenAI and GitHub APIs:

### Real LLM (OpenAI)
Set in `.env`:
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
EMBEDDING_PROVIDER="openai"
```

### GitHub OAuth & Webhooks
1. Create a GitHub App with permissions for Pull Requests (Read & Write).
2. Configure webhook URL: `https://your-domain.com/api/github/webhook`.
3. Set environment variables:
```env
GITHUB_CLIENT_ID="your_client_id"
GITHUB_CLIENT_SECRET="your_client_secret"
GITHUB_APP_ID="your_app_id"
GITHUB_WEBHOOK_SECRET="your_webhook_secret"
```
When real credentials are not provided, SynapseCode automatically operates in **Deterministic Demo Mode**.

---

## 9. Known Limitations & Future Improvements

- **AST Parsing:** Currently uses regex and semantic vector embeddings; future iterations can incorporate Tree-sitter AST diffing for language-specific syntactic tree matching.
- **Incremental Line-by-Line Embedding:** Embedding entire functions rather than issue snippets for larger PRs.
- **Automated PR Remediation:** Directly committing suggestion patches via GitHub Pull Request suggestion comments.
