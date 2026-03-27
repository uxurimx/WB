import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Layers, ShieldCheck, Database, Zap, ArrowRight, LayoutDashboard } from "lucide-react";
import { siteConfig } from "@/config/site";
import ThemeToggle from "@/components/ThemeToggle";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
    >
      {/* Subtle background glows */}
      <div className="absolute top-0 -left-32 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-[0.06] animate-blob pointer-events-none" />
      <div className="absolute top-20 -right-32 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-[0.06] animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-[0.04] animate-blob animation-delay-4000 pointer-events-none" />

      {/* Header */}
      <header
        className="fixed top-0 w-full z-50 backdrop-blur-md border-b"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg) 80%, transparent)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Layers className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="font-outfit font-bold text-lg" style={{ color: "var(--fg)" }}>
              {siteConfig.name}
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
            <Link href="#features" className="hover:text-[var(--fg)] transition-colors">Features</Link>
            <Link href="#stack" className="hover:text-[var(--fg)] transition-colors">Stack</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {userId ? (
              <Link
                href="/overview"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Dashboard <LayoutDashboard className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--fg)",
                }}
              >
                Sign in <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 max-w-5xl mx-auto w-full">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-8 border animate-fade-in"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--fg-muted)",
          }}
        >
          <Zap className="w-3.5 h-3.5 text-indigo-500" />
          Reusable Template
        </div>

        <h1 className="font-outfit font-bold text-5xl md:text-7xl tracking-tight leading-[1.1] mb-6 animate-fade-in">
          Build your product
          <br />
          <span className="text-indigo-500">faster.</span>
        </h1>

        <p className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed animate-fade-in" style={{ color: "var(--fg-muted)" }}>
          {siteConfig.description}
        </p>

        {/* Feature cards */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mb-14">
          {[
            {
              icon: ShieldCheck,
              color: "indigo",
              title: "Authentication",
              description: "Clerk handles sign-in, sign-up, and session management with role-based access control.",
            },
            {
              icon: Database,
              color: "violet",
              title: "Database Ready",
              description: "PostgreSQL via Neon + Drizzle ORM. Migrations, type-safe queries, and a clean schema.",
            },
            {
              icon: Layers,
              color: "purple",
              title: "Modular Layout",
              description: "Protected dashboard with sidebar navigation. Add your modules and remove what you don't need.",
            },
          ].map(({ icon: Icon, color, title, description }) => (
            <div
              key={title}
              className="p-7 rounded-2xl border text-left group hover:border-indigo-500/30 transition-all"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 border bg-${color}-500/10 border-${color}-500/20`}
              >
                <Icon className={`w-5 h-5 text-${color}-500`} />
              </div>
              <h3 className="font-outfit font-bold text-lg mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>{description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href={userId ? "/overview" : "/sign-up"}
            className="px-7 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
          >
            {userId ? "Go to Dashboard" : "Get Started"}
          </Link>
          <Link
            href="/sign-in"
            className="px-7 py-3.5 rounded-xl font-semibold border transition-colors"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--fg)",
            }}
          >
            Sign In
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-6 text-center text-xs border-t"
        style={{ color: "var(--fg-muted)", borderColor: "var(--border)" }}
      >
        Built with Next.js · Clerk · Drizzle ORM · Tailwind CSS
      </footer>
    </div>
  );
}
