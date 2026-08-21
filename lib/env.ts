import { z } from "zod";

const envSchema = z.object({
  LYZR_API_KEY: z.string().min(1, "LYZR_API_KEY is required"),
  LYZR_AGENT_ID: z.string().min(1, "LYZR_AGENT_ID is required"),
  LYZR_API_URL: z.string().url().default("https://agent-prod.studio.lyzr.ai/v3/inference/chat/"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse({
    LYZR_API_KEY: process.env.LYZR_API_KEY,
    LYZR_AGENT_ID: process.env.LYZR_AGENT_ID,
    LYZR_API_URL: process.env.LYZR_API_URL || "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Missing/invalid env: ${msg}`);
  }
  cached = parsed.data;
  return cached;
}

export function hasDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
