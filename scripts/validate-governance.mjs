import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "SECURITY.md",
  "REVIEW.md",
  "docs/PRODUCT.md",
  "docs/ARCHITECTURE.md",
  "docs/STATUS.md",
  "docs/GLOSSARY.md",
  "docs/WORKFLOW.md",
  "docs/decisions/README.md",
  "docs/decisions/ADR-000-template.md",
  "docs/decisions/ADR-002-nextjs-pwa-shell.md",
  "docs/decisions/ADR-003-deterministic-career-engine.md",
  "docs/runbooks/RECOVERY.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/engine/index.ts",
  "src/engine/types.ts",
  "src/engine/rng.ts",
  "src/engine/career.ts",
  "public/sw.js",
  "scripts/run-e2e.mjs",
];

const errors = [];

for (const file of requiredFiles) {
  try {
    const content = readFileSync(file, "utf8").trim();
    if (!content) {
      errors.push(`${file} is empty`);
    }
  } catch {
    errors.push(`${file} is missing`);
  }
}

try {
  const claudeInstructions = readFileSync("CLAUDE.md", "utf8");
  if (!claudeInstructions.includes("@AGENTS.md")) {
    errors.push("CLAUDE.md must import @AGENTS.md");
  }
} catch {
  // Missing file is reported above.
}

const trackedFiles = execFileSync("git", ["ls-files"], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean);

for (const file of trackedFiles) {
  if (/^\.env(?:\.|$)/.test(file) && file !== ".env.example") {
    errors.push(`Tracked environment file is forbidden: ${file}`);
  }
}

const secretPatterns = [
  /ghp_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{40,}/,
  /sk_live_[A-Za-z0-9]{20,}/,
  /sbp_[A-Za-z0-9]{20,}/,
];

for (const file of trackedFiles) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  if (secretPatterns.some((pattern) => pattern.test(content))) {
    errors.push(`Possible secret detected in ${file}`);
  }
}

if (errors.length > 0) {
  console.error("Governance validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Governance validation passed.");
