import raw from './demoFacts.json?raw';
import { parseJsonc } from '../io/jsonc';

/**
 * The facts registry the condition editor's fact picker reads — data-driven, replacing v1's
 * hardcoded 4-field enum. Loaded as a RAW string and parsed through our JSONC seam (the catalog
 * ships with comments), so the same file demonstrates the comment-tolerant loader the engine files
 * need. Path lookup is case-INSENSITIVE, matching the engine (rule files reference facts in mixed
 * case; the catalog is the source of truth for type + enum).
 */
export type FactValueType = 'String' | 'Numeric' | 'Bool' | 'Enum' | 'DateTime';

export interface FactDefinition {
  path: string;
  description: string;
  valueType: FactValueType;
  isBuiltIn: boolean;
  enumType?: string;
}

export const FACTS: FactDefinition[] = parseJsonc<{ facts: FactDefinition[] }>(raw).facts;

const BY_PATH = new Map<string, FactDefinition>(FACTS.map((f) => [f.path.toLowerCase(), f]));

/** Resolve a fact by path, case-insensitively (mirrors the engine's fact resolution). */
export function findFact(path: string): FactDefinition | undefined {
  return BY_PATH.get(path.trim().toLowerCase());
}
