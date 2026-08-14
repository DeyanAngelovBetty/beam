/**
 * JSON-with-comments support. The engine's rule files (and its facts catalog) ship with `//` and
 * block comments and the odd trailing comma for readability, so a plain `JSON.parse` would reject
 * them. `stripJsonComments` removes comments while respecting string literals, then drops trailing
 * commas; `parseJsonc` is the parse seam the importer + facts loader both use.
 *
 * v1 (RuleSet v1) parsed strict JSON — this is one of the concrete reasons v1 could not open the
 * engine's files. Adopted as part of the v2 interchange alignment.
 */
export function stripJsonComments(input: string): string {
  let out = '';
  let inString = false;
  let inLine = false;
  let inBlock = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];

    if (inLine) {
      if (ch === '\n') {
        inLine = false;
        out += ch;
      }
      continue;
    }
    if (inBlock) {
      if (ch === '*' && next === '/') {
        inBlock = false;
        i++;
      }
      continue;
    }
    if (inString) {
      out += ch;
      if (ch === '\\') {
        // keep the escaped char verbatim (\", \\, …)
        out += next ?? '';
        i++;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === '/' && next === '/') {
      inLine = true;
      i++;
    } else if (ch === '/' && next === '*') {
      inBlock = true;
      i++;
    } else {
      out += ch;
    }
  }

  // trailing commas before a closing bracket/brace
  return out.replace(/,(\s*[\]}])/g, '$1');
}

export function parseJsonc<T = unknown>(input: string): T {
  // Strip a leading UTF-8 BOM — the engine's rule files ship with one, and JSON.parse rejects it.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  return JSON.parse(stripJsonComments(text)) as T;
}
