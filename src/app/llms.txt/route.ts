import { docsNavigation } from "@/lib/docs/docs-data";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

function buildLlmsTxt(): string {
  const lines: string[] = [
    "# Decimal",
    "",
    "> Decimal is a school management platform for African schools: students,",
    "> staff, academics, attendance, examinations, timetables, admissions,",
    "> finance and parent communication in one connected system, with an",
    "> offline-capable Android, Windows, Linux and web app.",
    "",
    "Documentation is the canonical reference. Start with the overview, then",
    "the quickstart guide for setup.",
    "",
    "## Docs",
    "",
  ];

  for (const section of docsNavigation) {
    lines.push(`### ${section.title}`);
    lines.push("");
    for (const item of section.items) {
      const url = absoluteUrl(`/docs/${item.slug}`);
      const suffix = item.description ? `: ${item.description}` : "";
      lines.push(`- [${item.title}](${url})${suffix}`);
    }
    lines.push("");
  }

  lines.push(
    "## Pages",
    "",
    `- [Home](${absoluteUrl("/")}): Product overview for the Decimal school management platform.`,
    `- [Documentation](${absoluteUrl("/docs")}): Full guides, references and tutorials.`,
    `- [Download](${absoluteUrl("/download")}): Desktop and Android builds of Decimal.`,
    `- [Security](${absoluteUrl("/security")}): How Decimal protects school data.`,
    `- [Privacy Policy](${absoluteUrl("/privacy")}): Data handling and processing terms.`,
    `- [Terms of Service](${absoluteUrl("/terms")}): Terms governing use of Decimal.`,
    "",
    "## Optional",
    "",
    `- [Full sitemap](${absoluteUrl("/sitemap.xml")}): Every indexable URL.`,
    ""
  );

  return lines.join("\n");
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}