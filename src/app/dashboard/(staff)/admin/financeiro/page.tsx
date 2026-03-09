import { createAdminClient } from "@/lib/supabase/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialPayable } from "../_components/financial-payable";
import { FinancialReceivable } from "../_components/financial-receivable";
import { BarChart3, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export const metadata = {
    title: "Módulo Financeiro - Admin | COMPETIR.pay",
};

export default async function FinanceiroPage() {
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
            payment_links(token, status, created_at),
            payment_batches(
                id, 
                asaas_installment_id, 
                status,
                payment_installments(
                    id,
                    installment_number,
                    status,
                    amount,
                    due_date
                )
            ),
            organizer_payment_status,
            organizer_payment_date,
            organizer_payment_proof_url
        `)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3 uppercase">
                        <BarChart3 className="size-8 text-brand-600" />
                        Módulo Financeiro
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Controle centralizado de pagamentos e recebimentos.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="receber" className="space-y-6">
                <TabsList className="bg-gray-100 p-1 rounded-xl h-auto">
                    <TabsTrigger
                        value="receber"
                        className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-xs tracking-wider"
                    >
                        <ArrowUpCircle className="size-4 mr-2 text-emerald-600" />
                        Contas a Receber
                    </TabsTrigger>
                    <TabsTrigger
                        value="pagar"
                        className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-xs tracking-wider"
                    >
                        <ArrowDownCircle className="size-4 mr-2 text-amber-600" />
                        Contas a Pagar (Repasses)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="receber" className="mt-6">
                    <FinancialReceivable requests={requests as any || []} />
                </TabsContent>

                <TabsContent value="pagar" className="mt-6">
                    <FinancialPayable requests={requests as any || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
