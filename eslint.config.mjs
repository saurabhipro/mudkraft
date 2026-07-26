import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".next", "out", "next-env.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextCoreWebVitals,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      // Product imagery is served from remote, Lovable-hosted URLs alongside local
      // files; a plain <img> keeps both on one code path.
      "@next/next/no-img-element": "off",
    },
  },
  eslintPluginPrettier,
);
