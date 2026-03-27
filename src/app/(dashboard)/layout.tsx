import SideNav from "@/components/SideNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg)" }}>
      <SideNav />
      <main className="flex-1 ml-64 min-h-screen relative overflow-y-auto">
        {/* Subtle ambient glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none -z-10" />
        {children}
      </main>
    </div>
  );
}
