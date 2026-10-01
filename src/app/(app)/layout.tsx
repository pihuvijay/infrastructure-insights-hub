import { AppSidebar } from "@/components/AppSidebar";
import { AgentPanel } from "@/components/AgentPanel";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="min-w-0 flex-1 px-10 py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <AgentPanel />
    </div>
  );
}
