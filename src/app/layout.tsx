import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/theme-provider';
import { OrgProvider } from '../lib/context/org-context';
import { getServerOrg } from '../lib/server-org';

export const metadata: Metadata = {
  title: 'SynapseCode | Context-Aware AI Code Review SaaS',
  description:
    'AI-powered context-aware code review SaaS with organizational learning. Detect recurring vulnerabilities across pull requests using pgvector embeddings.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialOrgs: any[] = [];
  let initialCurrentOrg: any = undefined;

  try {
    const orgData = await getServerOrg();
    initialOrgs = orgData.availableOrgs;
    initialCurrentOrg = orgData.currentOrg;
  } catch (e) {
    // Fallback if DB not seeded yet
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans selection:bg-primary/20 selection:text-primary">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <OrgProvider initialOrgs={initialOrgs} initialCurrentOrg={initialCurrentOrg}>
            {children}
          </OrgProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
