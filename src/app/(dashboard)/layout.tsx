import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";
const ADMIN_SESSION_COOKIE = "admin_session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isAuthenticated =
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value === "authenticated";

  if (!isAuthenticated) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 space-y-8 p-6 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
