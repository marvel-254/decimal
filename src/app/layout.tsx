import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/platform/theme-provider";
import { Toaster } from "@/components/platform/toast";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";

const WORKOS_TEST_ENABLED = process.env.NEXT_PUBLIC_ENABLE_WORKOS_TEST === "true";

export const metadata: Metadata = {
  title: "Decimal — The School Management Platform",
  description:
    "Run your school with clarity. Administration, academics, attendance, finance, admissions, communication and intelligent scheduling in one platform.",
  other: {
    "google-site-verification": "googled3a1c2771becc781.html",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Decimal",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom must stay enabled for accessibility (WCAG 1.4.4).
  // Layout is responsive; zooming is safe.
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/app-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Decimal" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7XT9MTJH55"
          strategy="afterInteractive"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-7XT9MTJH55');
`,
          }}
        />
        {WORKOS_TEST_ENABLED ? (
          <AuthKitProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </AuthKitProvider>
        ) : (
          <ThemeProvider>{children}</ThemeProvider>
        )}
        <Toaster />
      </body>
    </html>
  );
}
