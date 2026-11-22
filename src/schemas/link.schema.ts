import { z } from "zod";

export const RESERVED_WORDS = new Set([
  "api",
  "dashboard",
  "analytics",
  "health",
  "static",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "login",
  "signup",
  "logout",
  "admin",
  "assets",
  "public",
]);

export const createLinkSchema = z.object({
  url: z
    .string({ required_error: "URL is required" })
    .trim()
    .url("Must be a valid URL starting with http:// or https://")
    .max(2048, "URL cannot exceed 2048 characters")
    .refine(
      (val) => {
        try {
          const parsed = new URL(val);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Only HTTP and HTTPS URLs are supported" }
    ),
  alias: z
    .string()
    .trim()
    .min(3, "Custom alias must be at least 3 characters")
    .max(50, "Custom alias must not exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Custom alias can only contain letters, numbers, hyphens, and underscores"
    )
    .refine((val) => !RESERVED_WORDS.has(val.toLowerCase()), {
      message: "This alias is reserved by the system",
    })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  expiresAt: z
    .string()
    .datetime({ message: "expiresAt must be a valid ISO 8601 date string" })
    .refine((val) => new Date(val).getTime() > Date.now(), {
      message: "Expiration date must be in the future",
    })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type CreateLinkSchema = z.infer<typeof createLinkSchema>;
