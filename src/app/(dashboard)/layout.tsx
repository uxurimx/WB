import SideNav, { MobileHeader } from "@/components/SideNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <SideNav />

      {/* Mobile top header */}
      <MobileHeader />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen relative overflow-y-auto">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none -z-10" />
        {/* Mobile top padding */}
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
