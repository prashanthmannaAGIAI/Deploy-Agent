import { expect, test } from "vitest";

import { safeCallback } from "./safe-callback";

test.each([
  ["/new", "/new"],
  ["/deployments?x=1", "/deployments?x=1"],
  ["https://evil.example", "/new"],
  ["//evil.example", "/new"],
  ["/\\evil.example", "/new"],
  ["/ok\r\nSet-Cookie: x", "/new"],
  [undefined, "/new"],
  ["http://localhost:3000/deployments?x=1", "/deployments?x=1"],
  ["http://localhost:3000.evil.example/x", "/new"],
  ["http://evil.example/deployments", "/new"],
  ["javascript:alert(1)", "/new"],
  ["", "/new"],
])("safeCallback(%j) is %j", (input, expected) => {
  expect(safeCallback(input, "http://localhost:3000")).toBe(expected);
});
