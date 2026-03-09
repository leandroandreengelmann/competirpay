import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TaxasClient from "./taxas-client";

export default async function TaxasPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const role = user.user_metadata?.role;
    if (role !== "admin" && role !== "financeiro") {
        redirect(`/dashboard/${role === "analista_credito" ? "analista" : role}`);
    }

    // Fetch tables with counts from child tables
    const { data: tables } = await supabase
        .from("credit_tables")
        .select(`
            id,
            name,
            simulation_base,
            created_at,
            credit_table_boleto(count),
            credit_table_card(count)
        `)
        .order("created_at", { ascending: false });

    // Flatten the counts
    const formatted = (tables ?? []).map(t => ({
        id: t.id,
        name: t.name,
        simulation_base: t.simulation_base,
        created_at: t.created_at,
        boleto_count: (t.credit_table_boleto as unknown as { count: number }[])?.[0]?.count ?? 0,
        card_count: (t.credit_table_card as unknown as { count: number }[])?.[0]?.count ?? 0,
    }));

    return <TaxasClient tables={formatted} />;
}
