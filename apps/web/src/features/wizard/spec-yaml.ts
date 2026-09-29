import type { Draft, DraftValue } from "./to-spec";

/** One rendered line of runway.yaml, split into parts for highlighting. */
export type SpecLine = {
  indent: string;
  /** "- " for the first key of a list item. */
  bullet: string;
  key?: string;
  /** Formatted scalar; undefined for section headers. */
  value?: string;
  unset?: boolean;
  comment?: string;
};

export const UNSET = "~ # not set yet";
const RESERVED = /^(true|false|yes|no|on|off|null|~|y|n)$/i;
const PLAIN = /^[A-Za-z0-9_./][A-Za-z0-9 _./@+=&|,()-]*$/;
const NUMBER_LIKE = /^[-+]?(\.?\d|0x|0o|\.inf|\.nan)/i;

/** Formats a scalar as YAML: plain when unambiguous, JSON-quoted otherwise. */
export function yamlScalar(v: string | number | boolean): string {
  if (typeof v !== "string") return String(v);
  const plain =
    v !== "" && PLAIN.test(v) && !v.endsWith(" ") && !RESERVED.test(v) && !NUMBER_LIKE.test(v);
  return plain ? v : JSON.stringify(v);
}

function emit(
  obj: Draft,
  comments: Record<string, string>,
  depth: number,
  path: string,
  out: SpecLine[],
) {
  const indent = "  ".repeat(depth);
  for (const [key, value] of Object.entries(obj)) {
    push(out, indent, "", key, value, comments, depth, path ? `${path}.${key}` : key);
  }
}

function push(
  out: SpecLine[],
  indent: string,
  bullet: string,
  key: string,
  value: DraftValue,
  comments: Record<string, string>,
  depth: number,
  path: string,
) {
  if (value === null) {
    out.push({ indent, bullet, key, unset: true });
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      out.push({ indent, bullet, key, value: "[]" });
      return;
    }
    out.push({ indent, bullet, key });
    const childIndent = depth + (bullet ? 2 : 1);
    value.forEach((item, i) => emitListItem(item, comments, childIndent, `${path}.${i}`, out));
  } else if (typeof value === "object") {
    out.push({ indent, bullet, key });
    emit(value, comments, depth + (bullet ? 2 : 1), path, out);
  } else {
    out.push({ indent, bullet, key, value: yamlScalar(value), comment: comments[path] });
  }
}

function emitListItem(
  item: Draft,
  comments: Record<string, string>,
  depth: number,
  path: string,
  out: SpecLine[],
) {
  const entries = Object.entries(item);
  entries.forEach(([key, value], i) => {
    const indent = "  ".repeat(depth);
    push(out, indent, i === 0 ? "- " : "  ", key, value, comments, depth, `${path}.${key}`);
  });
}

export function specLines(draft: Draft, comments: Record<string, string> = {}): SpecLine[] {
  const out: SpecLine[] = [];
  emit(draft, comments, 0, "", out);
  return out;
}

export function lineText(l: SpecLine): string {
  const head = `${l.indent}${l.bullet}${l.key ?? ""}:`;
  if (l.unset) return `${head} ${UNSET}`;
  if (l.value === undefined) return head;
  return `${head} ${l.value}${l.comment ? `  # ${l.comment}` : ""}`;
}

export function specText(draft: Draft, comments: Record<string, string> = {}): string {
  return ["# runway.yaml", ...specLines(draft, comments).map(lineText)].join("\n") + "\n";
}
