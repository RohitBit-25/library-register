import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Third-party agent skills installed via `npx skills add` and
    // `npx impeccable install`. Vendored tooling, not this project's source —
    // linting it reported 400+ problems nobody here can act on.
    ".claude/**",
    ".agents/**",
  ]),
]);

export default eslintConfig;
