import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";


export default defineConfig([
  {
    ignores: ["**/*.js", "**/*.mjs", "**/*.cjs"],
  },
  tseslint.configs.recommended,
  // Add TypeScript-specific rules
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-undef": "off",
      "no-useless-constructor": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "_",
          "varsIgnorePattern": "_"
        }
      ],
      "@typescript-eslint/array-type": "error",
      "semi": ["error", "never"],
      "max-len": ["error", { "code": 120 }]
    },
  },
  // Specific configuration for test files
  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
]);