"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, CreditCard, Barcode, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

import { creditRequestSchema, type CreditRequestValues } from "@/lib/validations/credit-request";
import { createCreditRequest, type ChampionshipOption } from "../actions";
import { simulateBoleto, simulateCard, fmt } from "@/lib/asaas-rates";

export function CreditRequestForm({ championships }: { championships: ChampionshipOption[] }) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const form = useForm<CreditRequestValues>({
        resolver: zodResolver(creditRequestSchema),
        defaultValues: {
            name: "",
            cpf: "",
            phone: "",
            championshipId: "",
            amount: 100,
            paymentMethod: "credit_card",
            installments: 1
        },
    });

    const watchChamp = form.watch("championshipId");
    const watchAmount = form.watch("amount") || 0;
    const watchPayment = form.watch("paymentMethod");
    const watchInstallments = form.watch("installments");

    const selectedChamp = championships.find(c => c.id === watchChamp);

    // Apply CPF mask
    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11);
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        form.setValue("cpf", v, { shouldValidate: true });
    };

    // Apply Phone mask
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11);
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        form.setValue("phone", v, { shouldValidate: true });
    };



    const onSubmit = async (values: CreditRequestValues) => {
        setIsSubmitting(true);
        setErrorMsg("");

        let final_amount = values.amount;
        if (selectedChamp) {
            if (values.paymentMethod === "credit_card") {
                const card = selectedChamp.cards.find(c => c.installments === values.installments);
                if (card) {
                    final_amount = simulateCard(values.amount, card.installments, card.markup_pct, card.markup_fixed, "simples").total;
                }
            } else {
                const planN = (values.installments ?? 1) - 1;
                const boleto = selectedChamp.boletos.find(b => b.plan_n === planN);
                if (boleto) {
                    final_amount = simulateBoleto(values.amount, boleto.plan_n, boleto.markup_pct, boleto.markup_fixed, "simples").total;
                }
            }
        }

        const payload = { ...values, final_amount };
        const res = await createCreditRequest(payload);
        if (res.success) {
            setStep(4); // Success page
        } else {
            setErrorMsg(res.error || "Ocorreu um erro ao processar sua solicitação.");
        }
        setIsSubmitting(false);
    };

    return (
        <div>
            {step === 4 ? (
                <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-center">
                        <CheckCircle2 className="size-16 text-emerald-500 mb-4 animate-[bounce_1s_ease-in-out_infinite]" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">Solicitação Enviada!</h2>
                    <p className="text-gray-600">
                        Recebemos a sua solicitação, em breve alguém da nossa equipe entrará em contato para finalizar o processo. Fique no aguardo.
                    </p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="mt-6">Nova Solicitação</Button>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* STEP 1 */}
                        <div className={step !== 1 ? "hidden" : "space-y-6 animate-in fade-in"}>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome Completo</FormLabel>
                                            <FormControl><Input placeholder="João da Silva" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="cpf"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CPF</FormLabel>
                                                <FormControl><Input placeholder="000.000.000-00" {...field} onChange={handleCpfChange} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>WhatsApp</FormLabel>
                                                <FormControl><Input placeholder="(00) 00000-0000" {...field} onChange={handlePhoneChange} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="championshipId"
                                    render={({ field }) => (
                                        <FormItem className="space-y-4">
                                            <div className="flex flex-col gap-1">
                                                <FormLabel className="text-gray-950 dark:text-white font-bold">Selecione o Campeonato</FormLabel>
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-black animate-pulse">
                                                    Clique no card para selecionar
                                                </p>
                                            </div>
                                            <FormControl>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 py-2">
                                                    {championships.map((champ) => {
                                                        const isSelected = field.value === champ.id;
                                                        return (
                                                            <div key={champ.id} className="relative group">
                                                                {/* Kinetic Shadow Layer */}
                                                                <div className={`absolute inset-0 bg-primary/10 rounded-xl transition-transform duration-300 ${isSelected ? 'translate-x-0 translate-y-0 opacity-0' : 'translate-x-2 translate-y-2 group-hover:translate-x-1 group-hover:translate-y-1'}`} />

                                                                <button
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        field.onChange(champ.id);
                                                                        const isValid = await form.trigger(["name", "cpf", "phone"]);
                                                                        if (isValid) setStep(2);
                                                                    }}
                                                                    className={`relative w-full flex flex-col items-start p-5 border-2 rounded-xl transition-all text-left h-full ${isSelected
                                                                        ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(0,78,235,0.1)] scale-[0.98]"
                                                                        : "border-gray-100 hover:border-primary/40 hover:bg-white bg-white shadow-sm group-active:scale-95"
                                                                        }`}
                                                                >
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">
                                                                        Campeonato
                                                                    </span>

                                                                    <span className={`text-base font-bold leading-tight ${isSelected ? "text-primary" : "text-gray-900"}`}>
                                                                        {champ.name}
                                                                    </span>

                                                                    {isSelected && (
                                                                        <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
                                                                            <CheckCircle2 className="size-5 text-primary" />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </FormControl>
                                            {championships.length === 0 && <p className="text-gray-500 text-sm mt-1">Nenhum campeonato disponível.</p>}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </div>

                        {/* STEP 2 */}
                        <div className={step !== 2 ? "hidden" : "space-y-6 animate-in fade-in slide-in-from-right-8"}>
                            <div className="flex flex-col items-start gap-3 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-primary hover:text-primary/80 font-bold flex items-center gap-1.5 transition-colors text-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    Voltar
                                </button>
                                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                    {selectedChamp?.name}
                                </h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Digite o valor de crédito que você deseja</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                                                <Input
                                                    type="number"
                                                    className="pl-9 text-lg font-bold py-6"
                                                    placeholder="100.00"
                                                    value={field.value || ""}
                                                    onChange={e => {
                                                        const val = parseFloat(e.target.value);
                                                        field.onChange(isNaN(val) ? 0 : val);
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-3">
                                <FormLabel>Forma de Pagamento</FormLabel>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => form.setValue("paymentMethod", "credit_card")}
                                        className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 transition-all ${watchPayment === "credit_card" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-gray-200 hover:bg-gray-50"}`}
                                    >
                                        <CreditCard className={`size-6 ${watchPayment === "credit_card" ? "text-primary" : "text-gray-400"}`} />
                                        <span className={`text-sm font-semibold ${watchPayment === "credit_card" ? "text-primary" : "text-gray-600"}`}>Cartão de Crédito</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => form.setValue("paymentMethod", "boleto")}
                                        className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 transition-all ${watchPayment === "boleto" ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/20" : "border-gray-200 hover:bg-gray-50"}`}
                                    >
                                        <Barcode className={`size-6 ${watchPayment === "boleto" ? "text-amber-600" : "text-gray-400"}`} />
                                        <span className={`text-sm font-semibold ${watchPayment === "boleto" ? "text-amber-700" : "text-gray-600"}`}>Boleto</span>
                                    </button>
                                </div>
                            </div>

                            {/* Options calculation logic based on selected method and champ rates */}
                            {watchAmount >= 10 && selectedChamp && (
                                <div className="p-4 border border-gray-100 bg-gray-50/50 rounded-xl space-y-3">
                                    <FormLabel className="text-xs uppercase tracking-wide text-gray-500">Opções de Parcelamento</FormLabel>

                                    {watchPayment === "credit_card" ? (
                                        <div className="grid gap-2">
                                            {selectedChamp.cards.map((c) => {
                                                const sim = simulateCard(watchAmount, c.installments, c.markup_pct, c.markup_fixed, "simples");
                                                return (
                                                    <label key={c.installments} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${watchInstallments === c.installments ? "border-primary bg-white ring-1 ring-primary" : "border-gray-200 bg-white hover:border-gray-100"}`}>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="radio"
                                                                name="installment"
                                                                className="text-primary focus:ring-primary w-4 h-4 accent-primary cursor-pointer"
                                                                checked={watchInstallments === c.installments}
                                                                onChange={() => form.setValue("installments", c.installments)}
                                                            />
                                                            <span className="font-semibold text-gray-900">{c.installments}x de R$ {fmt(sim.parcela)}</span>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-400">Total: R$ {fmt(sim.total)}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="grid gap-2">
                                            {selectedChamp.boletos.map((b) => {
                                                const sim = simulateBoleto(watchAmount, b.plan_n, b.markup_pct, b.markup_fixed, "simples");
                                                const totalInstallments = 1 + b.plan_n; // Entrada + N
                                                return (
                                                    <label key={b.plan_n} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${watchInstallments === totalInstallments ? "border-amber-500 bg-white ring-1 ring-amber-500" : "border-gray-200 bg-white hover:border-gray-100"}`}>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="radio"
                                                                name="installment"
                                                                className="text-amber-500 focus:ring-amber-500 w-4 h-4 accent-amber-500 cursor-pointer"
                                                                checked={watchInstallments === totalInstallments}
                                                                onChange={() => form.setValue("installments", totalInstallments)}
                                                            />
                                                            <div>
                                                                <span className="font-semibold text-gray-900 text-sm leading-none">Entrada + {b.plan_n}</span>
                                                                <p className="text-xs text-gray-500 mt-0.5">parcelas de R$ {fmt(sim.parcela)}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-400">Total: R$ {fmt(sim.total)}</span>
                                                    </label>
                                                );
                                            })}
                                            {selectedChamp.boletos.length === 0 && (
                                                <p className="text-sm text-gray-500 py-3 text-center border border-dashed border-gray-200 rounded-lg">Nenhuma opção de boleto cadastrada para este campeonato.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {errorMsg && <p className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded-lg">{errorMsg}</p>}

                            <Button type="button" className="w-full gap-2 text-lg h-12" disabled={!watchInstallments || watchAmount < 10} onClick={() => setStep(3)}>
                                Revisar Pedido
                            </Button>
                        </div>

                        {/* STEP 3 — Review */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Confirme seu pedido</h3>
                                </div>

                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    {/* Info pessoal */}
                                    <div className="p-4 flex flex-col gap-1">
                                        <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Solicitante</p>
                                        <p className="text-base font-bold text-gray-900">{form.getValues("name")}</p>
                                        <div className="text-sm text-gray-500 mt-1 flex flex-col gap-0.5">
                                            <p>CPF: {form.getValues("cpf")}</p>
                                            <p>Telefone: {form.getValues("phone")}</p>
                                        </div>
                                    </div>

                                    {/* Campeonato */}
                                    <div className="p-4 flex flex-col gap-1">
                                        <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Campeonato</p>
                                        <p className="text-base font-bold text-gray-900">{selectedChamp?.name}</p>
                                    </div>

                                    {/* Pagamento */}
                                    <div className="p-4 flex flex-col gap-1">
                                        <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Forma de Pagamento</p>
                                        <p className="text-base font-bold text-gray-900">
                                            {watchPayment === "credit_card" ? "Cartão de Crédito" : "Boleto"}
                                        </p>
                                    </div>

                                    {/* Parcelamento */}
                                    <div className="p-4 flex flex-col gap-1">
                                        <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Parcelamento</p>
                                        {watchPayment === "credit_card" ? (() => {
                                            const card = selectedChamp?.cards.find(c => c.installments === watchInstallments);
                                            if (!card) return null;
                                            const sim = simulateCard(watchAmount, card.installments, card.markup_pct, card.markup_fixed, "simples");
                                            return (
                                                <div className="flex items-end justify-between">
                                                    <p className="text-base font-bold text-gray-900">{card.installments}x de R$ {fmt(sim.parcela)}</p>
                                                    <p className="text-sm text-gray-400">Total: R$ {fmt(sim.total)}</p>
                                                </div>
                                            );
                                        })() : (() => {
                                            const planN = (watchInstallments ?? 0) - 1;
                                            const boleto = selectedChamp?.boletos.find(b => b.plan_n === planN);
                                            if (!boleto) return null;
                                            const sim = simulateBoleto(watchAmount, boleto.plan_n, boleto.markup_pct, boleto.markup_fixed, "simples");
                                            return (
                                                <div className="flex items-end justify-between">
                                                    <p className="text-base font-bold text-gray-900">Entrada + {boleto.plan_n} parcelas de R$ {fmt(sim.parcela)}</p>
                                                    <p className="text-sm text-gray-400">Total: R$ {fmt(sim.total)}</p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {errorMsg && <p className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded-lg">{errorMsg}</p>}

                                <div className="grid grid-cols-2 gap-3">
                                    <Button type="button" variant="outline" className="h-12 text-base font-bold" onClick={() => setStep(2)}>
                                        Voltar
                                    </Button>
                                    <Button type="submit" className="h-12 text-base gap-2" disabled={isSubmitting}>
                                        {isSubmitting ? <><Loader2 className="animate-spin size-5" /> Enviando...</> : "Enviar"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </Form>
            )}
        </div>
    );
}
