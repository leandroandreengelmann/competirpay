import { createAdminClient } from "@/lib/supabase/admin";
import { FinancialOverview } from "./_components/financial-overview";

export const metadata = {
    title: "Visão Geral - Admin | COMPETIR.pay",
};

export default async function AdminDashboardPage() {
    const supabase = createAdminClient();

    // Fetch all requests to calculate financial stats
    const { data: requests } = await supabase
        .from("credit_requests")
        .select(`
            id,
            name,
            cpf,
            phone,
            amount,
            final_amount,
            payment_method,
            installments,
            status,
            created_at,
            credit_tables(name),
            organizer_payment_status,
            organizer_payment_date,
            organizer_payment_proof_url
        `)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        Visão Geral Financeira
                    </h1>
                    <p className="text-gray-500">
                        Resumo de repasses, recebimentos e pendências do sistema.
                    </p>
                </div>
                <a
                    href="/dashboard/admin/todas"
                    className="text-sm font-medium text-brand-600 hover:underline shrink-0 mt-1"
                >
                    Lista de Solicitações →
                </a>
            </div>

            <FinancialOverview requests={requests as any || []} />
        </div>
    );
}
