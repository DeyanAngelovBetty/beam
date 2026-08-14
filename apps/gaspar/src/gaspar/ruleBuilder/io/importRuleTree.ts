import type { NodeConfig } from '../ruleTree';
import { parseJsonc } from './jsonc';
import { validateNodeConfig } from './validateRuleTree';
import { migrateV1 } from './migrateV1';

/**
 * The one import seam. Parses JSONC, then routes by shape:
 *  - an engine rule TREE (top-level `type` of sequence/condition/action) → validate + accept as-is
 *    (this is the acceptance path: the engine's own files open unmodified),
 *  - a RuleSet v1 GRAPH (flat `nodes[]` + `edges[]`) → migrate to a tree (best-effort, warnings).
 * Never throws — returns typed errors for the import panel.
 */
export type ImportResult =
  | { ok: true; root: NodeConfig; source: 'engine' | 'v1'; warnings: string[] }
  | { ok: false; errors: string[] };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function importRuleTree(text: string): ImportResult {
  let data: unknown;
  try {
    data = parseJsonc(text);
  } catch (e) {
    return { ok: false, errors: [`Not valid JSON/JSONC: ${(e as Error).message}`] };
  }
  if (!isRecord(data)) return { ok: false, errors: ['Top level must be an object.'] };

  // v1 graph: flat nodes[] + edges[]. (The engine tree has no `edges`.)
  if (Array.isArray(data.edges) && Array.isArray(data.nodes)) {
    const result = migrateV1(data);
    return result.ok ? { ok: true, root: result.root, source: 'v1', warnings: result.warnings } : result;
  }

  // Engine rule tree.
  const errors = validateNodeConfig(data);
  if (errors.length) return { ok: false, errors };
  return { ok: true, root: data as unknown as NodeConfig, source: 'engine', warnings: [] };
}
