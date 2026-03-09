import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { Separator } from "@/components/ui/separator";

type UserRole = "admin" | "financeiro" | "analista_credito";
const validStaffRoles: UserRole[] = ["admin", "financeiro", "analista_credito"];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const role = user.user_metadata?.role as string;
    if (!validStaffRoles.includes(role as UserRole)) redirect("/dashboard/cliente");

    const userRole = role as UserRole;
    const userName = (user.user_metadata?.full_name as string) ?? user.email ?? "Usuário";
    const userEmail = user.email ?? "";

    return (
        <SidebarProvider>
            <StaffSidebar userRole={userRole} userName={userName} userEmail={userEmail} />
            <div className="flex flex-1 flex-col min-w-0">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                </header>
                <main className="flex flex-1 flex-col gap-4 p-6">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
