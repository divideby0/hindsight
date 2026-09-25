import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { expect, it } from "vitest";

it("generates paragraph, heading and list styles for rendered Markdown", async () => {
  const stylesheet = fileURLToPath(new URL("../../src/app/globals.css", import.meta.url));
  const base = fileURLToPath(new URL("../../", import.meta.url));
  const result = await postcss([tailwind({ base })]).process(await readFile(stylesheet, "utf8"), {
    from: stylesheet,
  });

  // Check the compiled output: registering typography only in an unloaded
  // Tailwind v3 config leaves the prose class names present but inert in v4.
  const declarations = new Map<string, Set<string>>();
  result.root.walkRules((rule) => {
    for (const element of ["p", "h2", "ol", "ul"]) {
      if (!rule.selector.includes(`:where(${element})`)) continue;
      rule.walkDecls((declaration) => {
        const properties = declarations.get(element) ?? new Set<string>();
        properties.add(declaration.prop);
        declarations.set(element, properties);
      });
    }
  });
  expect(declarations.get("p")).toContain("margin-top");
  expect(declarations.get("h2")).toContain("font-size");
  expect(declarations.get("ol")).toContain("list-style-type");
  expect(declarations.get("ul")).toContain("list-style-type");
});
