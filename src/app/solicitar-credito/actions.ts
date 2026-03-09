"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export interface ChampionshipOption {
    id: string;
    name: string;
    simulation_base: number;
    boletos: { plan_n: number; asaas_unit_cost: number; markup_pct: number; markup_fixed: number }[];
    cards: { installments: number; asaas_pct: number; asaas_fixed: number; markup_pct: number; markup_fixed: number }[];
}

const getAdminSupabase = () => createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAvailableChampionships(): Promise<ChampionshipOption[]> {
    const supabase = getAdminSupabase();

    const { data, error } = await supabase.from("credit_tables").select("*").order("name");
    const tables = data as any[] | null;

    if (error || !tables) {
        console.error("Error fetching credit_tables", error);
        return [];
    }

    // We fetch boletos and cards for all at once to minimize queries (or per table, but let's do a join or in filter)
    const tableIds = tables.map(t => t.id);

    const [boletosRes, cardsRes] = await Promise.all([
        supabase.from("credit_table_boleto").select("*").in("table_id", tableIds).order("plan_n"),
        supabase.from("credit_table_card").select("*").in("table_id", tableIds).order("installments"),
    ]);

    const boletos = boletosRes.data as any[] | null;
    const cards = cardsRes.data as any[] | null;

    return tables.map(t => ({
        id: t.id,
        name: t.name,
        simulation_base: t.simulation_base,
        boletos: (boletos || []).filter(b => b.table_id === t.id).map(b => ({
            plan_n: b.plan_n,
            asaas_unit_cost: b.asaas_unit_cost,
            markup_pct: b.markup_pct,
            markup_fixed: b.markup_fixed
        })),
        cards: (cards || []).filter(c => c.table_id === t.id).map(c => ({
            installments: c.installments,
            asaas_pct: c.asaas_pct,
            asaas_fixed: c.asaas_fixed,
            markup_pct: c.markup_pct,
            markup_fixed: c.markup_fixed
        }))
    }));
}

import { simulateBoleto, simulateCard } from "@/lib/asaas-rates";

export async function createCreditRequest(formData: any) {
    const supabase = getAdminSupabase();

    const championshipId = formData.championshipId;
    const amount = Number(formData.amount);
    const installments = formData.installments || 1;
    const paymentMethod = formData.paymentMethod;

    // 1. Recalculate final_amount on server (Integrity check)
    let final_amount = amount;

    if (paymentMethod === "credit_card") {
        const { data: cardRate } = await supabase
            .from("credit_table_card")
            .select("markup_pct, markup_fixed")
            .eq("table_id", championshipId)
            .eq("installments", installments)
            .single();

        if (cardRate) {
            final_amount = simulateCard(amount, installments, cardRate.markup_pct, cardRate.markup_fixed, "simples").total;
        }
    } else {
        const planN = installments - 1;
        const { data: boletoRate } = await supabase
            .from("credit_table_boleto")
            .select("markup_pct, markup_fixed")
            .eq("table_id", championshipId)
            .eq("plan_n", planN)
            .single();

        if (boletoRate) {
            final_amount = simulateBoleto(amount, planN, boletoRate.markup_pct, boletoRate.markup_fixed, "simples").total;
        }
    }

    const payload = {
        name: formData.name,
        cpf: formData.cpf,
        phone: formData.phone,
        championship_id: championshipId,
        amount: amount,
        final_amount: final_amount,
        payment_method: paymentMethod,
        installments: installments,
        status: "pending"
    };

    const { data, error } = await supabase.from("credit_requests").insert(payload).select().single();

    if (error) {
        console.error("Error inserting credit request:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}
