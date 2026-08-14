import type { NodeConfig } from '../ruleTree';

/**
 * Structural validation of an untrusted rule tree. Recurses the containment tree; because children
 * are nested objects (not id references) a cycle/DAG is inexpressible, so validity is structural —
 * we only check that each node has the shape its `type` requires. Collects ALL problems (path-
 * prefixed) rather than throwing on the first, so the import panel can list them.
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validateNodeConfig(value: unknown, path = 'root', errors: string[] = []): string[] {
  if (!isRecord(value)) {
    errors.push(`${path}: expected an object.`);
    return errors;
  }
  if (typeof value.id !== 'string' || value.id.trim() === '') errors.push(`${path}: missing string "id".`);
  if (typeof value.type !== 'string') {
    errors.push(`${path}: missing "type".`);
    return errors;
  }

  switch (value.type) {
    case 'condition': {
      if (!isRecord(value.condition)) errors.push(`${path} (${String(value.id)}): missing "condition".`);
      if (value.trueNode === undefined) errors.push(`${path} (${String(value.id)}): missing "trueNode".`);
      else validateNodeConfig(value.trueNode, `${path}.trueNode`, errors);
      if (value.falseNode !== undefined) validateNodeConfig(value.falseNode, `${path}.falseNode`, errors);
      break;
    }
    case 'sequence': {
      if (!Array.isArray(value.nodes)) errors.push(`${path} (${String(value.id)}): "nodes" must be an array.`);
      else value.nodes.forEach((n, i) => validateNodeConfig(n, `${path}.nodes[${i}]`, errors));
      break;
    }
    case 'action': {
      if (!Array.isArray(value.actions)) errors.push(`${path} (${String(value.id)}): "actions" must be an array.`);
      break;
    }
    default:
      errors.push(`${path} (${String(value.id)}): unknown node type "${String(value.type)}".`);
  }
  return errors;
}

/** True iff the value is a structurally valid rule tree. */
export function isValidRuleTree(value: unknown): value is NodeConfig {
  return validateNodeConfig(value).length === 0;
}
