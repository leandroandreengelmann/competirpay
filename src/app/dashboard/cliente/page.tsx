import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ClienteDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const roleMap: Record<string, { label: string; color: string }> = {
        admin: { label: "Administrador", color: "bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400" },
        financeiro: { label: "Financeiro", color: "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400" },
        analista_credito: { label: "Analista de Crédito", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
        cliente: { label: "Cliente", color: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300" },
    };
    const roleKey = user.user_metadata?.role as string ?? "cliente";
    const { label: roleLabel, color: roleColor } = roleMap[roleKey] ?? roleMap.cliente;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-800 dark:text-brand-300">Meu Painel - COMPETIR PAY</h1>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{user.user_metadata?.full_name ?? "—"}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor}`}>
                            {roleLabel}
                        </span>
                    </div>
                    <form action="/auth/signout" method="post">
                        <Button variant="outline" type="submit" className="gap-2">
                            <LogOut size={16} /> Sair
                        </Button>
                    </form>
                </header>

                <section className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Minhas Inscrições</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Acompanhe o status dos seus pagamentos e inscrições em eventos.
                    </p>
                </section>
            </div>
        </div>
    );
}
