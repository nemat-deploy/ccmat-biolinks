// eslint.config.js
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    ignores: ["node_modules", ".next", "out", "dist", "**/.*"]
  },
  js.configs.recommended,
  nextPlugin.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    settings: {
      "import/resolver": {
        typescript: {} // ✅ Adicionado aqui
      }
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: 2021,
        sourceType: "module"
      },
      globals: {
        React: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,

      // Regras customizadas
      "no-console": ["warn"],
      "@typescript-eslint/no-explicit-any": ["warn"],
      "@typescript-eslint/no-empty-function": ["off"],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/exhaustive-deps": ["warn"]
      "no-unused-vars": "error",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  }
];