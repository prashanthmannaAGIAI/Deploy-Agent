// Format rules read from the generated JSON Schema, so the browser and the API validate the
// same way. Only the patterns are taken from here; messages are the prototype's copy.
import schema from "@runway/spec/schema.json";

type PropertySchema = { pattern?: string; anyOf?: { pattern?: string }[] };
type ObjectSchema = { properties: Record<string, PropertySchema> };

function patternOf(prop: PropertySchema | undefined): RegExp {
  const source = prop?.pattern ?? prop?.anyOf?.find((s) => s.pattern)?.pattern;
  if (!source) throw new Error("Schema property has no pattern");
  return new RegExp(source);
}

const defs = schema.$defs as unknown as Record<string, ObjectSchema>;
const root = schema as unknown as ObjectSchema;

export const rules = {
  project: patternOf(root.properties.project),
  region: patternOf(defs.Cloud.properties.region),
  repo: patternOf(defs.Source.properties.repo),
  branch: patternOf(defs.Source.properties.branch),
  version: patternOf(defs.Build.properties.version),
  command: patternOf(defs.Build.properties.command),
  domain: patternOf(defs.Infrastructure.properties.domain),
  envName: patternOf(defs.EnvVar.properties.name),
};
