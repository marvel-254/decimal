/**
 * Canonical site URL used for SEO metadata, sitemap.xml and robots.txt.
 *
 * NEXT_PUBLIC_SITE_URL is the source of truth (it is already used for
 * auth redirects). In production on Vercel we fall back to the deployment
 * URL so a missing env var never produces localhost links in the sitemap.
 */
function isLocal(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\/?$/.test(url);
}

function resolveSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter((value): value is string => Boolean(value));

  // A leftover localhost value in production would poison the sitemap, so the
  // real deployment URL wins over it.
  const configured = candidates.find((value) => !isLocal(value));

  return (configured ?? candidates[0] ?? "http://localhost:3000").replace(/\/+$/, "");
}

export const siteUrl = resolveSiteUrl();

export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}