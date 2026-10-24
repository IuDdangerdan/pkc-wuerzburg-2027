/** Compare two local working copies without network access or modifications.
 * Application code, tests, migrations, and assets must be byte-identical.
 * Only explicitly documented hosting and handover differences are allowed.
 * Usage: node scripts/compare-versions.mjs <private-copy> <github-copy>
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
const [privateArgument, githubArgument] = process.argv.slice(2);
if (!privateArgument || !githubArgument) {
  console.error(
    "Aufruf: node scripts/compare-versions.mjs <private-Kopie> <GitHub-Kopie>",
  );
  process.exit(2);
}
const privateRoot = path.resolve(privateArgument),
  githubRoot = path.resolve(githubArgument);
assert.notEqual(
  privateRoot,
  githubRoot,
  "Zwei unterschiedliche Arbeitskopien angeben.",
);
function inventory(root) {
  return new Set(
    execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { cwd: root, encoding: "utf8" },
    )
      .split("\0")
      .filter((file) => file && existsSync(path.join(root, file))),
  );
}
const privateFiles = inventory(privateRoot),
  githubFiles = inventory(githubRoot);
const read = (root, file) => readFileSync(path.join(root, file));
const allowedGithubOnly = new Set([
  "UEBERGABE.md",
  "docs/usability/PKC_Usability_Auswertung_2026-10-19.xlsx",
]);
const errors = [],
  differences = [];
let identical = 0;
for (const file of new Set([...privateFiles, ...githubFiles])) {
  if (!privateFiles.has(file)) {
    (allowedGithubOnly.has(file) ? differences : errors).push(file);
    continue;
  }
  if (!githubFiles.has(file)) {
    errors.push(file);
    continue;
  }
  const a = read(privateRoot, file),
    b = read(githubRoot, file);
  if (a.equals(b)) {
    identical++;
    continue;
  }
  try {
    if (file === ".openai/hosting.json") {
      const privateConfig = JSON.parse(a),
        githubConfig = JSON.parse(b);
      assert.equal(typeof privateConfig.project_id, "string");
      assert.equal(githubConfig.project_id, undefined);
      delete privateConfig.project_id;
      assert.deepEqual(privateConfig, githubConfig);
    } else if (file === "README.md") {
      // Exclude only the known GitHub-specific introduction and feedback sections.
      const common = b
        .toString()
        .replace(/^\*\*GitHub-Übergabekopie:\*\*[^\n]*\n\n/m, "")
        .replace(
          /^## Feedback und Usability\n\n[\s\S]*?(?=^## Orientierung im Code)/m,
          "",
        );
      assert.equal(a.toString(), common);
    } else if (file === "MARTIN_INTEGRATION.md") {
      const common = b
        .toString()
        .replace(/^Grundlage: \[Feedback-Auswertung[^\n]*\n\n/m, "");
      assert.equal(a.toString(), common);
    } else throw Error("Keine erlaubte Ausnahme");
    differences.push(file);
  } catch {
    errors.push(file);
  }
}
if (errors.length) {
  console.error("Unerwartete Unterschiede:\n" + errors.sort().join("\n"));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      identical_files: identical,
      intentional_differences: differences.sort(),
      unexpected_differences: [],
    },
    null,
    2,
  ),
);
