import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Fuel } from "lucide-react";
import { siteConfig } from "@/config/site";
import ThemeToggle from "@/components/ThemeToggle";

export default async function LoginPage() {
  const { userId } = await auth();
  if (userId) redirect("/overview");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div
        className="w-full max-w-sm rounded-2xl border p-8 text-center"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <Fuel className="w-8 h-8 text-indigo-500" />
          </div>
        </div>

        <h1 className="font-outfit font-bold text-2xl mb-1" style={{ color: "var(--fg)" }}>
          {siteConfig.name}
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--fg-muted)" }}>
          {siteConfig.tagline}
        </p>

        <Link
          href="/sign-in"
          className="flex items-center justify-center w-full h-11 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
        >
          Iniciar sesión
        </Link>

        <p className="mt-5 text-xs" style={{ color: "var(--fg-muted)" }}>
          Acceso solo por invitación.
          <br />
          Contacta al administrador para obtener acceso.
        </p>
      </div>

      <p className="mt-8 text-xs" style={{ color: "var(--fg-muted)" }}>
        {siteConfig.name} · v{siteConfig.version}
      </p>
    </div>
  );
}
