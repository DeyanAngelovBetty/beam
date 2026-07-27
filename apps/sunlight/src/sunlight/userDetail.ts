import { USERS } from './users';

/**
 * The User deep-page data model (product-local mock). A catalog of permission
 * groups, a set of roles that each grant a subset, and users that hold roles.
 * Effective permissions and their provenance are derived, never stored.
 */

export interface PermissionDef {
  id: string;
  label: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  permissions: PermissionDef[];
}

/** A page section groups several permission boxes (detail-page §5–7). */
export interface PermissionSectionDef {
  id: string;
  name: string;
  groups: PermissionGroup[];
}

export interface RoleDef {
  id: string;
  name: string;
  /** Index into the seed role ramp (detail-page §6). */
  colorIndex: number;
  /** Permission ids this role grants. */
  grants: string[];
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  description: string;
  roleIds: string[];
}

const PLAYER_OVERVIEW: PermissionGroup = {
  id: 'po',
  name: 'Player Overview',
  permissions: [
    { id: 'po.view', label: 'View player overview' },
    { id: 'po.pii', label: 'View personal data (PII)' },
    { id: 'po.notes', label: 'Manage notes' },
    { id: 'po.flags', label: 'Manage risk flags' },
  ],
};

const TRANSACTIONS: PermissionGroup = {
  id: 'tx',
  name: 'Transactions',
  permissions: [
    { id: 'tx.view', label: 'View transactions' },
    { id: 'tx.refund', label: 'Refund transactions and reverse settled payments up to the configured daily limit' },
    { id: 'tx.chargeback', label: 'Handle chargebacks' },
    { id: 'tx.export', label: 'Export transaction reports' },
    { id: 'tx.adjust', label: 'Adjust balances' },
  ],
};

const LOYALTY: PermissionGroup = {
  id: 'loy',
  name: 'Loyalty',
  permissions: [
    { id: 'loy.view', label: 'View loyalty' },
    { id: 'loy.grant', label: 'Grant loyalty rewards' },
    { id: 'loy.config', label: 'Configure loyalty' },
  ],
};

const COMPLIANCE: PermissionGroup = {
  id: 'cmp',
  name: 'Compliance',
  permissions: [
    { id: 'cmp.kyc', label: 'Run KYC checks' },
    { id: 'cmp.aml', label: 'Run AML checks' },
    { id: 'cmp.approve', label: 'Approve compliance cases' },
    { id: 'cmp.audit', label: 'View compliance audit' },
    { id: 'cmp.manual', label: 'Override and approve high-risk cases flagged for manual review' },
  ],
};

const CONTENT: PermissionGroup = {
  id: 'cnt',
  name: 'Content',
  permissions: [
    { id: 'cnt.view', label: 'View content' },
    { id: 'cnt.edit', label: 'Edit content' },
  ],
};

/**
 * The two-level hierarchy (detail-page §5–7): sections → groups (boxes) →
 * permissions (rows). Section→group mapping is provisional, matching the
 * Figma frames' shape (revisit with the real frames).
 */
export const SECTIONS: PermissionSectionDef[] = [
  { id: 'player-info', name: 'Player Info Page', groups: [PLAYER_OVERVIEW, TRANSACTIONS] },
  { id: 'player-ops', name: 'Player Operations', groups: [LOYALTY, COMPLIANCE, CONTENT] },
];

/** Flat group list — derived, so role grants / provenance / group state are unchanged. */
export const CATALOG: PermissionGroup[] = SECTIONS.flatMap((s) => s.groups);

export const ROLE_DEFS: RoleDef[] = [
  { id: 'admin', name: 'Admin', colorIndex: 0, grants: CATALOG.flatMap((g) => g.permissions.map((p) => p.id)) },
  { id: 'csr', name: 'CSR', colorIndex: 1, grants: ['po.view', 'po.notes', 'tx.view', 'loy.view'] },
  {
    id: 'player-ops',
    name: 'Player Operations',
    colorIndex: 2,
    grants: ['po.view', 'po.pii', 'po.flags', 'loy.view', 'loy.grant', 'tx.view', 'tx.refund'],
  },
  { id: 'live-ops', name: 'team-LiveOps', colorIndex: 3, grants: ['loy.view', 'loy.grant', 'loy.config', 'cnt.view', 'cnt.edit'] },
  { id: 'compliance', name: 'Compliance', colorIndex: 4, grants: ['cmp.kyc', 'cmp.aml', 'cmp.audit', 'po.view', 'po.pii'] },
  { id: 'tech', name: 'Technical & Escalations Expert', colorIndex: 5, grants: ['tx.view', 'tx.chargeback', 'tx.export', 'tx.adjust', 'cmp.manual'] },
];

export const ROLE_BY_ID = new Map(ROLE_DEFS.map((r) => [r.id, r]));
export const ALL_PERMISSIONS: PermissionDef[] = CATALOG.flatMap((g) => g.permissions);
export const PERMISSION_LABEL = new Map(ALL_PERMISSIONS.map((p) => [p.id, p.label]));

/**
 * The showcase user hits every grammar state: two roles with overlapping
 * grants (loy.view/loy.grant from both), groups full (Loyalty, Content),
 * partial (Player Overview, Transactions), and none (Compliance), plus a
 * long permission label that wraps (tx.refund).
 */
const SHOWCASE_ID = '4000';

/**
 * Saved edits, in memory — Save writes here so the view reflects the change.
 * Grants are stored alongside roles because edit mode lets permissions be
 * toggled directly (§6, provisional): a manual grant has no source role, so
 * it can't be re-derived from roleIds alone.
 */
export interface SavedEdit {
  name: string;
  email: string;
  description: string;
  roleIds: string[];
  grants: string[];
}
const overrides = new Map<string, SavedEdit>();

function baseDetail(id: string): UserDetail | undefined {
  const u = USERS.find((x) => x.id === id);
  if (!u) return undefined;
  if (id === SHOWCASE_ID) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      description: 'Player operations lead — Ontario. Cross-team access for loyalty and content.',
      roleIds: ['player-ops', 'live-ops'],
    };
  }
  const role = ROLE_DEFS.find((r) => r.name === u.role) ?? ROLE_DEFS[1];
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    description: `${u.role} · ${u.effectivePermission}`,
    roleIds: [role.id],
  };
}

export function getUserDetail(id: string): UserDetail | undefined {
  const base = baseDetail(id);
  if (!base) return undefined;
  const o = overrides.get(id);
  return o ? { ...base, name: o.name, email: o.email, description: o.description, roleIds: o.roleIds } : base;
}

/** The effective granted-permission ids: a saved manual set, else derived. */
export function effectiveGrants(id: string, roleIds: string[]): Set<string> {
  const saved = overrides.get(id);
  if (saved) return new Set(saved.grants);
  return new Set(provenanceFor(roleIds).keys());
}

export function saveUserEdit(id: string, edit: SavedEdit): void {
  overrides.set(id, edit);
}

/**
 * Effective permissions for a set of roles → a map of permission id to the
 * role ids granting it (the provenance). One entry per granted permission.
 */
export function provenanceFor(roleIds: string[]): Map<string, string[]> {
  const prov = new Map<string, string[]>();
  for (const roleId of roleIds) {
    const role = ROLE_BY_ID.get(roleId);
    if (!role) continue;
    for (const permId of role.grants) {
      const list = prov.get(permId) ?? [];
      if (!list.includes(roleId)) list.push(roleId);
      prov.set(permId, list);
    }
  }
  return prov;
}

export type GroupState = 'full' | 'partial' | 'none';

export function groupState(group: PermissionGroup, grantedIds: Set<string>): { state: GroupState; granted: number; total: number } {
  const total = group.permissions.length;
  const granted = group.permissions.filter((p) => grantedIds.has(p.id)).length;
  const state: GroupState = granted === 0 ? 'none' : granted === total ? 'full' : 'partial';
  return { state, granted, total };
}

/** Section state = group state rolled up across every box in the section. */
export function sectionState(
  section: PermissionSectionDef,
  grantedIds: Set<string>
): { state: GroupState; granted: number; total: number } {
  const perms = section.groups.flatMap((g) => g.permissions);
  const total = perms.length;
  const granted = perms.filter((p) => grantedIds.has(p.id)).length;
  const state: GroupState = granted === 0 ? 'none' : granted === total ? 'full' : 'partial';
  return { state, granted, total };
}

/** All permission ids in a section — for the section-level select-all. */
export function sectionPermissionIds(section: PermissionSectionDef): string[] {
  return section.groups.flatMap((g) => g.permissions.map((p) => p.id));
}
