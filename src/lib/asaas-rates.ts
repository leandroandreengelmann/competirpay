// Asaas fee schedule — read-only reference values
// These are never stored in the DB; they are hardcoded here and used for simulation only.

export const BOLETO_UNIT_COST = 3.50; // R$ per boleto paid

export interface AsaasCardRate {
    pct: number;   // e.g. 2.99 means 2.99%
    fixed: number; // R$ per transaction
}

// Rate tiers by number of installments
export function getAsaasCardRate(installments: number): AsaasCardRate {
    if (installments === 1) return { pct: 2.99, fixed: 0.49 };
    if (installments <= 6) return { pct: 3.49, fixed: 0.49 };
    return { pct: 3.99, fixed: 0.49 }; // 7-10
}

// ─── Simulation helpers ────────────────────────────────────────────────────

export interface SimulationResult {
    total: number;         // total charged to client
    parcela: number;       // instalment amount
    aMore: number;         // "a mais" = total - base
    asaasCost: number;     // Asaas cost (0 in simple mode)
    liquido: number;       // net to admin after Asaas
    lucro: number;         // liquido - base
}

/**
 * Boleto simulation — entrada = parcelas (all equal)
 * planN = N from "1+N"
 * asaasUnitCost: editable cost per boleto (defaults to BOLETO_UNIT_COST)
 */
export function simulateBoleto(
    base: number,
    planN: number,
    markupPct: number,
    markupFixed: number,
    mode: "simples" | "completo",
    asaasUnitCost: number = BOLETO_UNIT_COST
): SimulationResult {
    const total = base * (1 + markupPct / 100) + markupFixed;
    const numPayments = 1 + planN;
    const parcela = Math.ceil((total / numPayments) * 100) / 100;
    const aMore = total - base;

    const asaasCost = mode === "completo" ? numPayments * asaasUnitCost : 0;
    const liquido = total - asaasCost;
    const lucro = liquido - base;

    return { total, parcela, aMore, asaasCost, liquido, lucro };
}

/**
 * Card simulation
 * asaasPct / asaasFixed: editable Asaas rate (defaults to hardcoded tier)
 */
export function simulateCard(
    base: number,
    installments: number,
    markupPct: number,
    markupFixed: number,
    mode: "simples" | "completo",
    asaasPct?: number,
    asaasFixed?: number
): SimulationResult {
    const total = base * (1 + markupPct / 100) + markupFixed;
    const parcela = Math.round((total / installments) * 100) / 100;
    const aMore = total - base;

    let asaasCost = 0;
    if (mode === "completo") {
        const rate = getAsaasCardRate(installments);
        const pct = asaasPct ?? rate.pct;
        const fixed = asaasFixed ?? rate.fixed;
        asaasCost = total * (pct / 100) + fixed;
    }
    const liquido = total - asaasCost;
    const lucro = liquido - base;

    return { total, parcela, aMore, asaasCost, liquido, lucro };
}

export function fmt(value: number): string {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
