import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/lib/rate-limit.mjs", "src/lib/rate-limit.test.mjs"],
    languageOptions: {
      globals: {
        AbortSignal: "readonly",
        fetch: "readonly",
        process: "readonly",
        URL: "readonly",
        Request: "readonly",
        Response: "readonly"
      }
    }
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"])
]);

export default eslintConfig;
