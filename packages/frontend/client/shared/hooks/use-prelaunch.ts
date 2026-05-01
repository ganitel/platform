import { env } from "@/shared/lib/env";

export function usePrelaunch(): boolean {
  return env.prelaunchMode;
}
