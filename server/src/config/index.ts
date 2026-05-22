import { z } from "zod";
import logger from "../utils/logger";

const configSchema = z.object({
  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),

  // JWT
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  REFRESH_TOKEN_SECRET: z.string().min(1).optional(),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("CardPortal <noreply@cardportal.eu>"),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  // Cache
  REDIS_URL: z.string().optional(),

  // Card APIs
  POKEMON_TCG_API_KEY: z.string().optional(),
  EBAY_APP_ID: z.string().optional(),

  // Currency rates (fallback values)
  EUR_TO_CZK: z.coerce.number().default(25.3),
  USD_TO_CZK: z.coerce.number().default(23.2),
  GBP_TO_CZK: z.coerce.number().default(29.5),
});

export type Config = z.infer<typeof configSchema>;

let config: Config | null = null;

export function getConfig(): Config {
  if (config) return config;

  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.flatten();
    logger.fatal({ fieldErrors: errors.fieldErrors }, "Invalid environment configuration");
    throw new Error(
      `Configuration validation failed:\n${Object.entries(errors.fieldErrors)
        .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
        .join("\n")}`
    );
  }

  config = parsed.data;
  logger.info({ nodeEnv: config.NODE_ENV }, "Configuration loaded");
  return config;
}

// Shorthandy pro běžný přístup
export const isDev = () => getConfig().NODE_ENV !== "production";
export const isTest = () => getConfig().NODE_ENV === "test";
export const isProd = () => getConfig().NODE_ENV === "production";
