import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "src/generated/**/*",
      ".next/**/*",
      "node_modules/**/*",
      "public/**/*",
      "api/**/*",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.ts"
    ]
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react/display-name": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "prefer-const": "warn"
    }
  }
];

export default eslintConfig;
