import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        vars: "all",
        args: "none",
        ignoreRestSiblings: true,
        varsIgnorePattern: "^_",
      }],
      "no-restricted-globals": ["error",
        { name: "confirm", message: "Use useConfirm() from @/components/ui/confirm-dialog instead." },
        { name: "alert",   message: "Do not use native alert() — use toast() from sonner instead." },
        { name: "prompt",  message: "Do not use native prompt()." },
      ],
    },
  },
]);

export default eslintConfig;
