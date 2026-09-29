// Generates ts/generated.ts from schema/runway.v1.schema.json.
// Run through `pnpm spec:generate` at the repo root, which regenerates the schema first.
import { readFile, writeFile } from "node:fs/promises";
import { compile } from "json-schema-to-typescript";

const root = new URL("..", import.meta.url);
const schema = JSON.parse(await readFile(new URL("schema/runway.v1.schema.json", root), "utf8"));

const ts = await compile(schema, "RunwaySpec", {
  bannerComment:
    "/* Generated from packages/spec/schema/runway.v1.schema.json by `pnpm spec:generate`. Do not edit. */",
  additionalProperties: false,
  enableConstEnums: false,
  inferStringEnumKeysFromValues: false,
  strictIndexSignatures: true,
  style: { printWidth: 100 },
  unreachableDefinitions: true,
});

await writeFile(new URL("ts/generated.ts", root), ts.replace(/\r\n/g, "\n"));
