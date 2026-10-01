import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next", "node_modules", "_old", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  eslintPluginPrettier,
  { rules: { "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }] } },
];
export default config;
