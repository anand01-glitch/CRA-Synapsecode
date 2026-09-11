import React from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  ShieldCheck,
  Zap,
  BookOpen,
  LineChart,
  ArrowRight,
  GitPullRequest,
  Sparkles,
  Lock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { ThemeToggle } from '../components/layout/theme-toggle';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Navbar */}
      <header className="border-b border-border/60 backdrop-blur-xl sticky top-0 z-50 bg-background/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">SynapseCode</span>
              <span className="ml-2 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                SaaS MVP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:block"
            >
              Live Demo
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-md shadow-primary/20 transition-all"
            >
              <span>View Demo Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background -z-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Final-Year Project: Context-Aware Code Review Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] text-balance">
            AI code reviews that help your team{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              learn from every Pull Request
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
            Never review code in isolation. SynapseCode indexes historical Pull Request issues with vector embeddings
            to alert developers when recurring bugs, SQL injections, or security antipatterns resurface.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground text-base font-bold hover:opacity-95 shadow-xl shadow-primary/30 transition-all hover:scale-[1.02]"
            >
              <span>View Demo Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pull-requests"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-border bg-card/80 hover:bg-muted text-foreground text-base font-semibold transition-all shadow-sm"
            >
              <GitPullRequest className="w-4 h-4 text-primary" />
              <span>Explore PR Reviews (PR #200)</span>
            </Link>
          </div>

          {/* Key Trust Signals */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>pgvector Similarity Search</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Strict Multi-Tenant Isolation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Deterministic Pattern Engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Pre-Seeded Demo Data Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Core Architectural Capabilities
          </h2>
          <p className="text-muted-foreground text-sm">
            Engineered with deep context awareness and organizational memory to prevent repeated engineering mistakes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: AI PR Reviews */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Automated AI PR Reviews</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Every PR diff is analyzed by deterministic rule checkers and LLMs to produce structured, line-level code annotations with actionable fixes.
            </p>
          </div>

          {/* Card 2: Security & Quality Detection */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Security & Quality Detection</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Catches raw SQL injections, XSS vulnerabilities (`dangerouslySetInnerHTML`), N+1 query loops, missing automated tests, and code duplication.
            </p>
          </div>

          {/* Card 3: Recurring Issue Detection */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group border-indigo-500/30 bg-gradient-to-b from-indigo-500/5 to-card">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg">Recurring Issue Detection</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20">
                Core
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Uses pgvector similarity search to surface prior occurrences (e.g. PR #101, #125, #143) when PR #200 introduces a familiar SQL injection pattern.
            </p>
          </div>

          {/* Card 4: Team Knowledge Base */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Team Knowledge Base</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Aggregates discovered engineering defects into a searchable organizational memory bank with frequency trends and linked repositories.
            </p>
          </div>

          {/* Card 5: Engineering Analytics */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <LineChart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Engineering Analytics</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              High-level charts monitoring recurring vulnerability trends over time, category breakdowns, repository risk distribution, and review velocity.
            </p>
          </div>

          {/* Card 6: Multi-Tenant Boundary Guard */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Zero-Leakage Multi-Tenancy</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Hard server-side query filters guarantee Organization A (Acme Technologies) never accesses repositories, PRs, or embeddings from Organization B.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 py-8 px-6 text-center text-xs text-muted-foreground">
        <p>SynapseCode SaaS — Final-Year Project Demonstration Platform</p>
        <p className="mt-1 font-mono text-[11px]">Powered by Next.js 14, Prisma ORM, pgvector embeddings & Tailwind CSS</p>
      </footer>
    </div>
  );
}
