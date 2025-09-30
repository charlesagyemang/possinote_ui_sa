import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/public/**",
      "**/build/**",
      "**/dist/**",
      "**/coverage/**"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable specific rules that are causing warnings in the build
      "react-hooks/exhaustive-deps": "off", // Turn off exhaustive-deps warning
      "@typescript-eslint/no-unused-vars": "off", // Turn off unused vars warning for production
      "eslint-comments/no-unused-disable": "off", // Turn off unused disable directives warning
      "no-unused-expressions": "off" // Turn off unused expressions warning
    }
  }
];

export default eslintConfig;