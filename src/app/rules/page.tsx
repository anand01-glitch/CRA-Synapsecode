import React from 'react';
import { db } from '../../lib/db';
import { getServerOrg } from '../../lib/server-org';
import { AppShell } from '../../components/layout/app-shell';
import { RulesManager, RuleItem } from '../../components/rules/rules-manager';
import { ShieldAlert } from 'lucide-react';

interface TeamRulesPageProps {
  searchParams: {
    org?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function TeamRulesPage({ searchParams }: TeamRulesPageProps) {
  const { currentOrg } = await getServerOrg(searchParams.org);
  const organizationId = currentOrg.id;

  const rules = await db.teamRule.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
  });

  const formattedRules: RuleItem[] = rules.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    severity: r.severity,
    ruleDescription: r.ruleDescription,
    recommendation: r.recommendation,
    isActive: r.isActive,
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Team Coding Rules & Standards
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure coding standards and architectural policies enforced during automated AI reviews for{' '}
            <span className="font-semibold text-foreground">{currentOrg.name}</span>
          </p>
        </div>

        <RulesManager initialRules={formattedRules} />
      </div>
    </AppShell>
  );
}
