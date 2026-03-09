"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    simulateBoleto,
    simulateCard,
    fmt,
    type SimulationResult,
} from "@/lib/asaas-rates";
import { TrendingUp, Wallet, CreditCard, ChevronDown, CheckCircle2, Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BoletoRow {
    planN: number;
    asaasUnitCost: string;
    markupPct: string;
    markupFixed: string;
}

interface CardRow {
    installments: number;
    asaasPct: string;
    asaasFixed: string;
    markupPct: string;
    markupFixed: string;
}

type SimMode = "simples" | "completo";
type BoletoField = keyof BoletoRow;
type CardField = keyof CardRow;

function toNum(v: string) { return parseFloat(v.replace(",", ".")) || 0; }
function toStr(v: number) { return v.toString(); }

const DEFAULT_BOLETO_COST = "3.50";
function defaultCardPct(inst: number) { return inst === 1 ? "2.99" : inst <= 6 ? "3.49" : "3.99"; }
const DEFAULT_CARD_FIXED = "0.49";

// ─── BOLETO BLOCK ─────────────────────────────────────────────────────────────

function BoletoBlock({
    rows, base, mode, onChange, onApplyAll,
}: {
    rows: BoletoRow[];
    base: number;
    mode: SimMode;
    onChange: (i: number, field: BoletoField, value: string) => void;
    onApplyAll: (field: "markupPct" | "markupFixed", value: string) => void;
}) {
    const [applyPct, setApplyPct] = useState("");
    const [applyFixed, setApplyFixed] = useState("");

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex-wrap">
                <span className="text-xs font-semibold text-amber-700 shrink-0">Aplicar em todos:</span>
                <Input className="h-7 w-24 text-xs" placeholder="Markup %" value={applyPct} onChange={e => setApplyPct(e.target.value)} />
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onApplyAll("markupPct", applyPct)}>Aplicar %</Button>
                <Input className="h-7 w-24 text-xs" placeholder="Taxa R$" value={applyFixed} onChange={e => setApplyFixed(e.target.value)} />
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onApplyAll("markupFixed", applyFixed)}>Aplicar R$</Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Plano</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-amber-600">Custo Asaas/boleto</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Markup %</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Taxa R$</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Total</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Entrada = Parcela</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-fuchsia-600">A mais</th>
                            {mode === "completo" && (
                                <>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-red-500">Custo Asaas Total</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-600">Líquido</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-700">Lucro</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((row, i) => {
                            const sim: SimulationResult = simulateBoleto(
                                base, row.planN,
                                toNum(row.markupPct), toNum(row.markupFixed),
                                mode,
                                toNum(row.asaasUnitCost)
                            );
                            return (
                                <tr key={row.planN} className="hover:bg-gray-50/50">
                                    <td className="px-3 py-2">
                                        <Badge variant="outline" className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border-blue-200">
                                            1+{row.planN}
                                        </Badge>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-400">R$</span>
                                            <Input
                                                className="h-7 w-20 text-xs font-mono border-amber-200 bg-amber-50/50"
                                                placeholder="3.50"
                                                value={row.asaasUnitCost}
                                                onChange={e => onChange(i, "asaasUnitCost", e.target.value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2"><Input className="h-7 w-20 text-xs font-mono" placeholder="0,00" value={row.markupPct} onChange={e => onChange(i, "markupPct", e.target.value)} /></td>
                                    <td className="px-3 py-2"><Input className="h-7 w-20 text-xs font-mono" placeholder="0,00" value={row.markupFixed} onChange={e => onChange(i, "markupFixed", e.target.value)} /></td>
                                    <td className="px-3 py-2 font-bold text-gray-900">R$ {fmt(sim.total)}</td>
                                    <td className="px-3 py-2 text-gray-700">R$ {fmt(sim.parcela)}</td>
                                    <td className="px-3 py-2 font-bold text-fuchsia-600">+R$ {fmt(sim.aMore)}</td>
                                    {mode === "completo" && (
                                        <>
                                            <td className="px-3 py-2 text-red-500 text-xs">R$ {fmt(sim.asaasCost)}</td>
                                            <td className="px-3 py-2 text-emerald-600 font-semibold">R$ {fmt(sim.liquido)}</td>
                                            <td className="px-3 py-2 text-emerald-700 font-bold">R$ {fmt(sim.lucro)}</td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── CARD BLOCK ─────────────────────────────────────────────────────────────

function CardBlock({
    rows, base, mode, onChange, onApplyAll,
}: {
    rows: CardRow[];
    base: number;
    mode: SimMode;
    onChange: (i: number, field: CardField, value: string) => void;
    onApplyAll: (field: "markupPct" | "markupFixed", value: string) => void;
}) {
    const [applyPct, setApplyPct] = useState("");
    const [applyFixed, setApplyFixed] = useState("");

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex-wrap">
                <span className="text-xs font-semibold text-amber-700 shrink-0">Aplicar em todos:</span>
                <Input className="h-7 w-24 text-xs" placeholder="Markup %" value={applyPct} onChange={e => setApplyPct(e.target.value)} />
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onApplyAll("markupPct", applyPct)}>Aplicar %</Button>
                <Input className="h-7 w-24 text-xs" placeholder="Taxa R$" value={applyFixed} onChange={e => setApplyFixed(e.target.value)} />
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onApplyAll("markupFixed", applyFixed)}>Aplicar R$</Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Parcelas</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-amber-600">Taxa Asaas %</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-amber-600">Fixo Asaas R$</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Markup %</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Taxa R$</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Total</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Parcela</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-fuchsia-600">A mais</th>
                            {mode === "completo" && (
                                <>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-red-500">Custo Asaas</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-600">Líquido</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-700">Lucro</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((row, i) => {
                            const sim = simulateCard(
                                base, row.installments,
                                toNum(row.markupPct), toNum(row.markupFixed),
                                mode,
                                toNum(row.asaasPct), toNum(row.asaasFixed)
                            );
                            return (
                                <tr key={row.installments} className="hover:bg-gray-50/50">
                                    <td className="px-3 py-2">
                                        <Badge variant="outline" className="font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                            {row.installments}x
                                        </Badge>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-1">
                                            <Input
                                                className="h-7 w-16 text-xs font-mono border-amber-200 bg-amber-50/50"
                                                placeholder="2.99"
                                                value={row.asaasPct}
                                                onChange={e => onChange(i, "asaasPct", e.target.value)}
                                            />
                                            <span className="text-xs text-gray-400">%</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-400">R$</span>
                                            <Input
                                                className="h-7 w-16 text-xs font-mono border-amber-200 bg-amber-50/50"
                                                placeholder="0.49"
                                                value={row.asaasFixed}
                                                onChange={e => onChange(i, "asaasFixed", e.target.value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2"><Input className="h-7 w-20 text-xs font-mono" placeholder="0,00" value={row.markupPct} onChange={e => onChange(i, "markupPct", e.target.value)} /></td>
                                    <td className="px-3 py-2"><Input className="h-7 w-20 text-xs font-mono" placeholder="0,00" value={row.markupFixed} onChange={e => onChange(i, "markupFixed", e.target.value)} /></td>
                                    <td className="px-3 py-2 font-bold text-gray-900">R$ {fmt(sim.total)}</td>
                                    <td className="px-3 py-2 text-gray-700">R$ {fmt(sim.parcela)}</td>
                                    <td className="px-3 py-2 font-bold text-fuchsia-600">+R$ {fmt(sim.aMore)}</td>
                                    {mode === "completo" && (
                                        <>
                                            <td className="px-3 py-2 text-red-500 text-xs">R$ {fmt(sim.asaasCost)}</td>
                                            <td className="px-3 py-2 text-emerald-600 font-semibold">R$ {fmt(sim.liquido)}</td>
                                            <td className="px-3 py-2 text-emerald-700 font-bold">R$ {fmt(sim.lucro)}</td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── MAIN BUILDER ─────────────────────────────────────────────────────────────

interface Props {
    editTableId?: string; // If provided, load this table for editing
    onSaved: () => void;
}

export default function CreditTableBuilder({ editTableId, onSaved }: Props) {
    const supabase = createClient();

    const [step, setStep] = useState<"config" | "edit">("config");
    const [name, setName] = useState("");
    const [boletoMax, setBoletoMax] = useState("6");
    const [cardMax, setCardMax] = useState("10");
    const [base, setBase] = useState("100");

    const [boletoRows, setBoletoRows] = useState<BoletoRow[]>([]);
    const [cardRows, setCardRows] = useState<CardRow[]>([]);

    const [mode, setMode] = useState<SimMode>("simples");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    // Load data if editTableId is provided
    useEffect(() => {
        if (!editTableId) return;

        async function load() {
            setLoading(true);
            const [{ data: master }, { data: boletos }, { data: cards }] = await Promise.all([
                supabase.from("credit_tables").select("*").eq("id", editTableId).single(),
                supabase.from("credit_table_boleto").select("*").eq("table_id", editTableId).order("plan_n"),
                supabase.from("credit_table_card").select("*").eq("table_id", editTableId).order("installments")
            ]);

            if (master) {
                setName(master.name);
                setBase(toStr(master.simulation_base));
            }

            if (boletos) {
                setBoletoRows(boletos.map(b => ({
                    planN: b.plan_n,
                    asaasUnitCost: toStr(b.asaas_unit_cost),
                    markupPct: toStr(b.markup_pct),
                    markupFixed: toStr(b.markup_fixed)
                })));
            }
            if (cards) {
                setCardRows(cards.map(c => ({
                    installments: c.installments,
                    asaasPct: toStr(c.asaas_pct),
                    asaasFixed: toStr(c.asaas_fixed),
                    markupPct: toStr(c.markup_pct),
                    markupFixed: toStr(c.markup_fixed)
                })));
            }

            setStep("edit");
            setLoading(false);
        }
        load();
    }, [editTableId, supabase]);

    const handleGenerate = () => {
        const bMax = Math.min(Math.max(parseInt(boletoMax) || 2, 2), 12);
        const cMax = Math.min(Math.max(parseInt(cardMax) || 1, 1), 10);

        setBoletoRows(Array.from({ length: bMax - 1 }, (_, i) => ({
            planN: i + 2,
            asaasUnitCost: DEFAULT_BOLETO_COST,
            markupPct: "",
            markupFixed: "",
        })));
        setCardRows(Array.from({ length: cMax }, (_, i) => ({
            installments: i + 1,
            asaasPct: defaultCardPct(i + 1),
            asaasFixed: DEFAULT_CARD_FIXED,
            markupPct: "",
            markupFixed: "",
        })));
        setStep("edit");
    };

    const updateBoleto = useCallback((i: number, field: BoletoField, value: string) => {
        setBoletoRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
    }, []);

    const updateCard = useCallback((i: number, field: CardField, value: string) => {
        setCardRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
    }, []);

    const applyAllBoleto = useCallback((field: "markupPct" | "markupFixed", value: string) => {
        setBoletoRows(prev => prev.map(r => ({ ...r, [field]: value })));
    }, []);

    const applyAllCard = useCallback((field: "markupPct" | "markupFixed", value: string) => {
        setCardRows(prev => prev.map(r => ({ ...r, [field]: value })));
    }, []);

    const handleSave = async () => {
        if (!name.trim()) { setError("Informe o nome do campeonato."); return; }
        setSaving(true);
        setError("");

        let tableId = editTableId;

        // Either Update existing or Insert new
        if (tableId) {
            const { error: updateErr } = await supabase
                .from("credit_tables")
                .update({ name: name.trim(), simulation_base: parseFloat(base) || 100 })
                .eq("id", tableId);
            if (updateErr) { setError(updateErr.message); setSaving(false); return; }
        } else {
            const { data: newTable, error: insertErr } = await supabase
                .from("credit_tables")
                .insert({ name: name.trim(), simulation_base: parseFloat(base) || 100 })
                .select("id").single();
            if (insertErr || !newTable) { setError(insertErr?.message ?? "Erro ao salvar."); setSaving(false); return; }
            tableId = newTable.id;
        }

        // Delete existing rows so we can insert fresh ones without constraint violations
        if (editTableId) {
            await Promise.all([
                supabase.from("credit_table_boleto").delete().eq("table_id", tableId),
                supabase.from("credit_table_card").delete().eq("table_id", tableId)
            ]);
        }

        const [{ error: bErr }, { error: cErr }] = await Promise.all([
            // Only insert if there are rows (prevent empty array errors)
            boletoRows.length > 0 ? supabase.from("credit_table_boleto").insert(boletoRows.map(r => ({
                table_id: tableId!,
                plan_n: r.planN,
                asaas_unit_cost: toNum(r.asaasUnitCost),
                markup_pct: toNum(r.markupPct),
                markup_fixed: toNum(r.markupFixed),
            }))) : Promise.resolve({ error: null }),

            cardRows.length > 0 ? supabase.from("credit_table_card").insert(cardRows.map(r => ({
                table_id: tableId!,
                installments: r.installments,
                asaas_pct: toNum(r.asaasPct),
                asaas_fixed: toNum(r.asaasFixed),
                markup_pct: toNum(r.markupPct),
                markup_fixed: toNum(r.markupFixed),
            }))) : Promise.resolve({ error: null }),
        ]);

        if (bErr || cErr) { setError(bErr?.message ?? cErr?.message ?? "Erro ao salvar linhas."); setSaving(false); return; }

        setSaved(true);
        setSaving(false);
        setTimeout(() => { setSaved(false); onSaved(); }, 1500);
    };

    const numBase = parseFloat(base) || 100;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <Loader2 className="size-6 animate-spin mb-4" />
                <p>Carregando tabela...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {step === "config" && !editTableId && (
                <div className="max-w-lg space-y-5 p-6 border border-gray-200 rounded-xl bg-gray-50/50">
                    <h2 className="text-base font-black text-gray-900">Nova tabela de crédito</h2>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600">Nome do campeonato</label>
                        <Input placeholder="Ex.: Copa Gaúcha 2025" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                <Wallet className="size-3" /> Boleto — opções máx (1+N)
                            </label>
                            <Input type="number" min={2} max={12} value={boletoMax} onChange={e => setBoletoMax(e.target.value)} />
                            <p className="text-[10px] text-gray-400">Gera 1+2 até 1+{boletoMax}</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                <CreditCard className="size-3" /> Cartão — parcelas máx
                            </label>
                            <Input type="number" min={1} max={10} value={cardMax} onChange={e => setCardMax(e.target.value)} />
                            <p className="text-[10px] text-gray-400">Gera 1x até {cardMax}x</p>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600">Base de simulação (R$)</label>
                        <Input type="number" placeholder="100" value={base} onChange={e => setBase(e.target.value)} />
                    </div>
                    <Button className="w-full" onClick={handleGenerate} disabled={!name.trim()}>
                        Gerar tabela <ChevronDown className="size-4 ml-1" />
                    </Button>
                </div>
            )}

            {step === "edit" && (
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Tabela</p>
                                {/* Make name editable here too */}
                                <Input
                                    className="h-8 text-sm font-black w-64 border-transparent hover:border-gray-200 focus:border-gray-300 px-2 -ml-2"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Nome do campeonato"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-500 font-semibold">Base:</span>
                                <Input type="number" className="h-8 w-24 text-xs font-mono" value={base} onChange={e => setBase(e.target.value)} />
                            </div>
                            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                                <button className={`px-3 py-1.5 font-semibold transition-colors ${mode === "simples" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`} onClick={() => setMode("simples")}>Simples</button>
                                <button className={`px-3 py-1.5 font-semibold transition-colors ${mode === "completo" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`} onClick={() => setMode("completo")}>+ Custo Asaas</button>
                            </div>
                            {!editTableId && <Button variant="outline" size="sm" onClick={() => setStep("config")}>← Voltar</Button>}
                        </div>
                    </div>

                    <Tabs defaultValue="boleto">
                        <TabsList className="mb-4">
                            <TabsTrigger value="boleto" className="gap-1.5"><Wallet className="size-3.5" /> Boleto ({boletoRows.length} planos)</TabsTrigger>
                            <TabsTrigger value="card" className="gap-1.5"><CreditCard className="size-3.5" /> Cartão ({cardRows.length}x)</TabsTrigger>
                        </TabsList>
                        <TabsContent value="boleto">
                            <BoletoBlock rows={boletoRows} base={numBase} mode={mode} onChange={updateBoleto} onApplyAll={applyAllBoleto} />
                        </TabsContent>
                        <TabsContent value="card">
                            <CardBlock rows={cardRows} base={numBase} mode={mode} onChange={updateCard} onApplyAll={applyAllCard} />
                        </TabsContent>
                    </Tabs>

                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
                    <div className="flex justify-end">
                        <Button className="gap-2 min-w-36" onClick={handleSave} disabled={saving || saved}>
                            {saved ? <><CheckCircle2 className="size-4" /> Salvo!</> : saving ? "Salvando..." : <><TrendingUp className="size-4" /> Salvar tabela</>}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
