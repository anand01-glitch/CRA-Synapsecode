'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Edit2,
  Lock,
} from 'lucide-react';
import { useOrg } from '../../lib/context/org-context';

export interface RuleItem {
  id: string;
  name: string;
  category: string;
  severity: string;
  ruleDescription: string;
  recommendation: string;
  isActive: boolean;
}

export function RulesManager({ initialRules }: { initialRules: RuleItem[] }) {
  const { currentUser } = useOrg();
  const isAdmin = currentUser.role === 'ADMIN';

  const [rules, setRules] = useState<RuleItem[]>(initialRules);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('security');
  const [severity, setSeverity] = useState('high');
  const [ruleDescription, setRuleDescription] = useState('');
  const [recommendation, setRecommendation] = useState('');

  const toggleRuleActive = (ruleId: string) => {
    if (!isAdmin) return;
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ruleDescription || !recommendation) return;

    const newRule: RuleItem = {
      id: `custom-rule-${Date.now()}`,
      name,
      category,
      severity,
      ruleDescription,
      recommendation,
      isActive: true,
    };

    setRules([newRule, ...rules]);
    setShowAddModal(false);
    setName('');
    setRuleDescription('');
    setRecommendation('');
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!isAdmin) return;
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Active Team Standards & Directives
          </h2>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Coding Rule</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border">
            <Lock className="w-3.5 h-3.5" />
            <span>Admin permission required to edit rules (Switch role in header)</span>
          </div>
        )}
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => {
          return (
            <div
              key={rule.id}
              className={`p-5 rounded-3xl bg-card border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                rule.isActive ? 'border-border' : 'border-border/40 opacity-60 bg-muted/20'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg ${
                      rule.severity === 'critical'
                        ? 'bg-rose-500 text-white'
                        : rule.severity === 'high'
                        ? 'bg-amber-500 text-white'
                        : rule.severity === 'medium'
                        ? 'bg-yellow-500 text-slate-900'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {rule.severity}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                    {rule.category}
                  </span>
                  <h3 className="font-bold text-sm text-foreground">{rule.name}</h3>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rule.ruleDescription}
                </p>

                <div className="text-xs text-foreground font-medium flex items-center gap-1.5 pt-1">
                  <span className="text-primary font-bold">Fix Guidance:</span>
                  <span>{rule.recommendation}</span>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                {/* Active Toggle Switch */}
                <button
                  disabled={!isAdmin}
                  onClick={() => toggleRuleActive(rule.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    rule.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted text-muted-foreground border-border'
                  } ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      rule.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'
                    }`}
                  />
                  <span>{rule.isActive ? 'Enforced' : 'Disabled'}</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-base text-foreground">Add Team Coding Rule</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enforce CSRF Protection"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  >
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                    <option value="code_quality">Code Quality</option>
                    <option value="testing">Testing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Severity Guidance
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Rule Directive / Description
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe what pattern is prohibited or required..."
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Remediation Recommendation
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Recommended code fix or alternative..."
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 shadow-md shadow-primary/20"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
