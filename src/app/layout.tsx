import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { siteConfig } from "@/config/site";
import SwRegister from "@/components/SwRegister";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <body className={`${inter.variable} ${outfit.variable} antialiased font-sans`}>
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <SwRegister />
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
