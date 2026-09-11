import React from 'react';
import { db } from '../../lib/db';
import { getServerOrg } from '../../lib/server-org';
import { AppShell } from '../../components/layout/app-shell';
import {
  Settings,
  Building2,
  Sliders,
  Users,
  GitBranch,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
} from 'lucide-react';

interface SettingsPageProps {
  searchParams: {
    org?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { currentOrg } = await getServerOrg(searchParams.org);
  const organizationId = currentOrg.id;

  let users: any[] = [];
  let repos: any[] = [];
  let installations: any[] = [];

  try {
    const results = await Promise.all([
      db.user.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'asc' },
      }),
      db.repository.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' },
      }),
      db.gitHubInstallation.findMany({
        where: { organizationId },
      }),
    ]);
    users = results[0];
    repos = results[1];
    installations = results[2];
  } catch (err) {
    console.error('Error fetching settings:', err);
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Organization Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure parameters, security controls, and AI thresholds for{' '}
            <span className="font-semibold text-foreground">{currentOrg.name}</span>
          </p>
        </div>

        {/* Section 1: Organizational Memory Vector Tuning */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-base text-foreground">
              Organizational Memory & Vector Similarity
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tune the pgvector cosine similarity threshold for surfacing recurring issues across pull requests.
          </p>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground">
                  Cosine Similarity Threshold
                </span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20">
                  Default: 0.75
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {(currentOrg.similarityThreshold * 100).toFixed(0)}% Match
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              defaultValue={currentOrg.similarityThreshold}
              className="w-full accent-indigo-600 cursor-pointer"
            />

            <div className="flex items-start gap-2 pt-2 text-[11px] text-muted-foreground leading-relaxed">
              <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Why 0.75?</strong> Empirically tuned against benchmark PR sets: 0.75 ensures semantically
                equivalent SQL injection patterns (such as PR #101, #125, #143, and #200) cluster together with high
                confidence (&gt;90% match) while eliminating false positives from unrelated queries.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: AI Provider & Cost Guardrails */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base text-foreground">AI & LLM Review Provider</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-primary/40 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">Deterministic Mock Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Reproducible, instant rule evaluations ideal for demo viva and offline testing.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-muted/30 space-y-2 opacity-80">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">OpenAI / Claude LLM</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                  Optional
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Requires <code className="text-[10px]">OPENAI_API_KEY</code> in environment.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs space-y-2">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cost & Safety Guardrails Active</span>
            </div>
            <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
              <li>Max 10 files analyzed per PR changeset</li>
              <li>Max 4,000 tokens per file limit to prevent unexpected API billing spikes</li>
              <li>Zod schema validation with automatic single retry on malformed model responses</li>
            </ul>
          </div>
        </div>

        {/* Section 3: Organization Members & Roles */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base text-foreground">Organization Members</h2>
          </div>

          <div className="divide-y divide-border/60">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{u.name}</div>
                    <div className="text-[11px] text-muted-foreground">{u.email}</div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    u.role === 'ADMIN'
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: GitHub Integration Status */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base text-foreground">GitHub App & Webhook Integration</h2>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Webhook Endpoint:</span>
              <span className="font-mono text-[11px] text-primary">POST /api/github/webhook</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Supported Events:</span>
              <span className="text-muted-foreground">pull_request (opened, synchronize, reopened)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Demo Mode Status:</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero-credential fallback enabled</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
