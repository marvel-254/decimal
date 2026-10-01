import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * Block everything that is not a public marketing/docs page. The listed
 * prefixes mirror `protectedPaths` in src/lib/auth-config.ts plus the API and
 * auth surfaces, which must never be indexed.
 */
const DISALLOWED = [
  "/api/",
  "/auth/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/mfa",
  "/oauth",
  "/school-picker",
  "/onboarding",
  "/dashboard",
  "/platform",
  "/super-admin",
  "/principal",
  "/teacher",
  "/parent",
  "/finance",
  "/secretary",
  "/admissions-officer",
  "/tuition",
  "/no-access",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}