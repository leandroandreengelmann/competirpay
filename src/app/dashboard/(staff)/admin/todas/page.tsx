import { createAdminClient } from "@/lib/supabase/admin";
import { RequestCard } from "../_components/request-card";
import { StatusDashboard } from "../_components/status-dashboard";

export const metadata = {
    title: "Todas as Solicitações - Admin | COMPETIR.pay",
};

export default async function TodasSolicitacoesPage() {
    const supabase = createAdminClient();

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
            credit_request_notes(id, content, created_at, image_url, attachments),
            payment_links(token, status, created_at),
            payment_batches(id, asaas_payment_book_url),
            organizer_payment_status,
            organizer_payment_date,
            organizer_payment_proof_url
        `)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    Todas as Solicitações
                </h1>
                <p className="text-gray-500">
                    Histórico completo de todas as solicitações de crédito.
                </p>
            </div>

            <StatusDashboard requests={requests as any || []} />
        </div>
    );
}
