// ESLint (config « flat ») : règles recommandées + garde-fous de sécurité et de style. Aucune dépendance d'exécution.
import js from "@eslint/js";
import globals from "globals";

const strict = {
  eqeqeq: ["error", "always", { null: "ignore" }],
  "no-var": "error",
  "prefer-const": "error",
  "no-eval": "error",
  "no-implied-eval": "error",
  "no-new-func": "error",
  "no-script-url": "error",
  "no-unused-vars": ["error", { args: "after-used", caughtErrors: "none", ignoreRestSiblings: true }],
  "no-console": ["error", { allow: ["error", "warn", "log"] }]
};

export default [
  { ignores: ["node_modules/**", "vendor/**", "data/**", "library/**", "playwright-report/**", "test-results/**", "lighthouse-report/**"] },
  js.configs.recommended,
  // Code exécuté dans le navigateur
  {
    files: ["js/**/*.js", "docs.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...globals.browser } },
    rules: strict
  },
  // Outils, tests et serveur : Node.js
  {
    files: ["scripts/**/*.mjs", "tests/**/*.mjs", "e2e/**/*.mjs", "*.config.mjs"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...globals.node, ...globals.browser } },
    rules: strict
  }
];
