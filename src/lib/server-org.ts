import { db } from './db';

/**
 * Resolves the active organization on the server side.
 * Hard security rule: All queries MUST filter by organizationId server-side.
 */
export async function getServerOrg(searchParamOrgSlug?: string) {
  let org = null;

  if (searchParamOrgSlug) {
    org = await db.organization.findUnique({
      where: { slug: searchParamOrgSlug },
    });
  }

  // Fallback to primary Acme Technologies org
  if (!org) {
    org = await db.organization.findFirst({
      where: { slug: 'acme-tech' },
    });
  }

  // Fallback to any organization
  if (!org) {
    org = await db.organization.findFirst();
  }

  if (!org) {
    const fallbackOrg = {
      id: 'default-org-id',
      name: 'Acme Technologies',
      slug: 'acme-tech',
      similarityThreshold: 0.75,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return {
      currentOrg: fallbackOrg,
      availableOrgs: [fallbackOrg],
    };
  }

  let allOrgs: any[] = [];
  try {
    allOrgs = await db.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        similarityThreshold: true,
      },
    });
  } catch {
    allOrgs = [org];
  }

  return {
    currentOrg: org,
    availableOrgs: allOrgs.length > 0 ? allOrgs : [org],
  };
}
