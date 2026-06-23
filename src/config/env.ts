import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_BACKEND_API_URL: z.string().url(),
});

const parsedEnv = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
});

if (!parsedEnv.success) {
  // Avoid crashing build pipelines before .env.local is configured.
  console.warn("Environment variables are not fully configured for admin-panel.");
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_BACKEND_API_URL: "",
    };
