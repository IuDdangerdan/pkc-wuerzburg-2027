/** Isolated application checks. No access to live data or deployment. */
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
for (const file of readdirSync("public")
  .filter((file) => file.endsWith(".js"))
  .sort()) {
  run(["--check", "public/" + file]);
}
for (const file of [
  "content-ui",
  "planning-draft",
  "car-passengers",
  "theme",
  "notifications",
  "access",
]) {
  run(["tests/" + file + ".mjs"]);
}
run(["node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false"]);
