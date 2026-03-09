"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Search,
    ArrowUpCircle,
    CheckCircle2,
    Clock,
    Trophy,
    CreditCard,
    FileText,
    Calendar,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Info,
    DollarSign,
    User
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditRequest } from "./request-card";
import { cn } from "@/lib/utils";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FinancialReceivableProps {
    requests: CreditRequest[];
}

export function FinancialReceivable({ requests }: FinancialReceivableProps) {
    const [search, setSearch] = useState("");
    const [methodFilter, setMethodFilter] = useState<string>("all");
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedIds(next);
    };

    const receivableRequests = useMemo(() => {
        return requests
            .filter(r => r.status === "approved" || r.status === "paid" || r.status === "pending" || r.status === "in_service")
            .filter(r => {
                const matchesSearch =
                    r.name.toLowerCase().includes(search.toLowerCase()) ||
                    (r.cpf && r.cpf.includes(search));
                const matchesMethod = methodFilter === "all" || r.payment_method === methodFilter;
                return matchesSearch && matchesMethod;
            });
    }, [requests, search, methodFilter]);

    const stats = useMemo(() => {
        const total = receivableRequests.reduce((acc, r) => acc + (r.final_amount || r.amount), 0);
        const paid = receivableRequests.reduce((acc, r) => {
            if (r.payment_method === "credit_card" && r.status === "paid") return acc + (r.final_amount || r.amount);
            if (r.payment_method === "boleto") {
                const paidAmount = r.payment_batches?.[0]?.payment_installments
                    ?.filter(i => i.status === "RECEIVED" || i.status === "CONFIRMED")
                    ?.reduce((sum, i) => sum + i.amount, 0) || 0;
                return acc + paidAmount;
            }
            return acc;
        }, 0);
        return { total, paid, pending: total - paid };
    }, [receivableRequests]);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-l-brand-500 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
                            <ArrowUpCircle className="size-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Faturamento Total</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                R$ {stats.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                            <CheckCircle2 className="size-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Recebido</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                R$ {stats.paid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-amber-500 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                            <Clock className="size-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aguardando Webhook</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                R$ {stats.pending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nome ou CPF..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 rounded-lg text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <Button
                        variant={methodFilter === "all" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setMethodFilter("all")}
                        className="h-8 text-[11px] font-bold uppercase tracking-wider px-4"
                    >
                        Tudo
                    </Button>
                    <Button
                        variant={methodFilter === "credit_card" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setMethodFilter("credit_card")}
                        className="h-8 text-[11px] font-bold uppercase tracking-wider px-4"
                    >
                        Cartão
                    </Button>
                    <Button
                        variant={methodFilter === "boleto" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setMethodFilter("boleto")}
                        className="h-8 text-[11px] font-bold uppercase tracking-wider px-4"
                    >
                        Boleto
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {receivableRequests.map(req => {
                    const isExpanded = expandedIds.has(req.id);
                    const installments = req.payment_batches?.[0]?.payment_installments || [];
                    const paidCount = installments.filter(i => i.status === "RECEIVED" || i.status === "CONFIRMED").length;
                    const totalCount = req.installments || 1;
                    const isFullyPaid = req.status === "paid" || (totalCount > 0 && paidCount === totalCount);

                    return (
                        <Collapsible
                            key={req.id}
                            open={isExpanded}
                            onOpenChange={() => toggleExpand(req.id)}
                        >
                            <Card className={cn(
                                "p-5 flex flex-col gap-4 border-l-4 hover:shadow-md transition-shadow",
                                isFullyPaid ? "border-l-emerald-500" : "border-l-amber-500"
                            )}>
                                {/* Header */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="font-bold text-lg text-gray-900">{req.name}</h3>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] font-semibold uppercase px-2 py-0",
                                            isFullyPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                        )}>
                                            {isFullyPaid ? "Recebido" : "Aguardando"}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] font-semibold uppercase px-2 py-0 bg-gray-50 text-gray-600 border-gray-200">
                                            {req.payment_method === "credit_card" ? "Cartão" : "Boleto"}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Valor Líquido</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                R$ {(req.final_amount || req.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="size-4 text-gray-400" />
                                        <span className="font-medium truncate">{req.credit_tables?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="size-4 text-gray-400" />
                                        <span>{format(new Date(req.created_at), "dd/MM/yyyy")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="size-4 text-gray-400" />
                                        <span>{req.cpf}</span>
                                    </div>
                                    {totalCount > 1 && (
                                        <div className="flex items-center gap-2 text-brand-600 font-semibold">
                                            <Info className="size-4" />
                                            <span>{paidCount} de {totalCount} parcelas</span>
                                        </div>
                                    )}
                                </div>

                                <CollapsibleContent className="pt-4 border-t border-gray-100">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {installments.length > 0 ? installments.map((inst) => (
                                            <div key={inst.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Parc. {inst.installment_number}</span>
                                                    <div className={cn(
                                                        "size-2 rounded-full",
                                                        (inst.status === "RECEIVED" || inst.status === "CONFIRMED") ? "bg-emerald-500" : "bg-gray-300"
                                                    )} />
                                                </div>
                                                <p className="text-sm font-bold text-gray-900">R$ {inst.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                                <p className="text-[10px] text-gray-500">{format(new Date(inst.due_date), "dd/MM/yyyy")}</p>
                                            </div>
                                        )) : (
                                            <div className="col-span-full py-2 text-center text-xs text-gray-400 italic">
                                                Cobrança única ou processada via Cartão.
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    );
                })}

                {receivableRequests.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <AlertCircle className="size-8 text-gray-200 mx-auto mb-2" />
                        <h5 className="text-gray-400 font-bold uppercase text-sm">Nenhum movimento encontrado</h5>
                    </div>
                )}
            </div>
        </div>
    );
}
