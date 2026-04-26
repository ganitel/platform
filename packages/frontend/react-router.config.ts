import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "client",
  ssr: true,
  future: {
    // Required for `clerkMiddleware()` in @clerk/react-router. Will become
    // the default in RR v8 — opting in early.
    v8_middleware: true,
  },
} satisfies Config;
