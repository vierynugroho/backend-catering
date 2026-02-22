import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.node, // ← ganti browser → node (fix process.env, __dirname, dll)
      },
      ecmaVersion: "latest",
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-undef": "error",
    },
  },
  {
    // Ignore folder yang tidak perlu di-lint
    ignores: ["node_modules/**", "prisma/**", "dist/**"],
  },
]);
