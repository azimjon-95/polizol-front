import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

export default defineConfig({
  files: ["**/*.{js,jsx}"],
  ignores: ["dist/**", "build/**"],

  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    globals: {
      ...globals.browser,
      ...globals.node,
    },
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },

  plugins: {
    react: reactPlugin,
    "react-hooks": reactHooks,
  },

  extends: [
    js.configs.recommended,
    reactPlugin.configs.flat.recommended,
    reactHooks.configs.recommended,
  ],

  rules: {
    "react/prop-types": "off",
    "react/display-name": "off",
    "react/react-in-jsx-scope": "off",
  },
});
