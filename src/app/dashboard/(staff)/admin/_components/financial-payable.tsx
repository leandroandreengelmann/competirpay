"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Search,
    FileText,
    CheckCircle2,
    Clock,
    User,
    Trophy,
    DollarSign,
    Upload,
    AlertTriangle,
    Eye,
    ArrowDownCircle,
    ArrowUpCircle,
    Calendar
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { markAsPaidToOrganizer } from "../actions";
import { CreditRequest } from "./request-card";
import { cn } from "@/lib/utils";

interface FinancialPayableProps {
    requests: CreditRequest[];
}

export function FinancialPayable({ requests }: FinancialPayableProps) {
    const [search, setSearch] = useState("");
    const [isPending, startTransition] = useTransition();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("pending");

    const filteredRequests = useMemo(() => {
        return requests
            .filter(r => r.status === "approved" || r.status === "paid")
            .filter(r => {
                const isPaid = r.organizer_payment_status === "PAID";
                const tabMatch = activeTab === "pending" ? !isPaid : isPaid;
                const searchMatch =
                    r.name.toLowerCase().includes(search.toLowerCase()) ||
                    (r.cpf && r.cpf.includes(search)) ||
                    (r.credit_tables?.name?.toLowerCase().includes(search.toLowerCase()));
                return tabMatch && searchMatch;
            });
    }, [requests, search, activeTab]);

    const stats = useMemo(() => {
        const approved = requests.filter(r => (r.status === "approved" || r.status === "paid"));
        const pendingValue = approved
            .filter(r => r.organizer_payment_status !== "PAID")
            .reduce((acc, r) => acc + r.amount, 0);
        const paidValue = approved
            .filter(r => r.organizer_payment_status === "PAID")
            .reduce((acc, r) => acc + r.amount, 0);

        return {
            pendingCount: approved.filter(r => r.organizer_payment_status !== "PAID").length,
            paidCount: approved.filter(r => r.organizer_payment_status === "PAID").length,
            pendingValue,
            paidValue
        };
    }, [requests]);

    const handleMarkAsPaid = async (requestId: string) => {
        if (!selectedFile) return;

        setProcessingId(requestId);

        const formData = new FormData();
        formData.append("requestId", requestId);
        formData.append("proof", selectedFile);

        startTransition(async () => {
            const result = await markAsPaidToOrganizer(formData);
            setProcessingId(null);
            setSelectedFile(null);

            if (!result.success) {
                alert("Erro ao confirmar repasse: " + result.error);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 border-l-4 border-l-amber-500 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                                <ArrowDownCircle className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total a Pagar</p>
                                <h3 className="text-xl font-bold text-gray-900">
                                    R$ {stats.pendingValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </h3>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {stats.pendingCount} pendentes
                        </Badge>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Repassado</p>
                                <h3 className="text-xl font-bold text-gray-900">
                                    R$ {stats.paidValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </h3>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {stats.paidCount} realizados
                        </Badge>
                    </div>
                </Card>
            </div>

            {/* Content with Tabs */}
            <Tabs defaultValue="pending" className="space-y-6" onValueChange={setActiveTab}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="bg-gray-100 p-1 rounded-xl h-auto self-start">
                        <TabsTrigger
                            value="pending"
                            className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold uppercase text-[10px] tracking-wider transition-all"
                        >
                            Pendentes
                        </TabsTrigger>
                        <TabsTrigger
                            value="paid"
                            className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold uppercase text-[10px] tracking-wider transition-all"
                        >
                            Histórico
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative flex-1 max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            placeholder="Buscar organizador..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-10 rounded-lg text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredRequests.map(req => (
                        <Card key={req.id} className={cn(
                            "p-5 flex flex-col gap-4 border-l-4 hover:shadow-md transition-shadow",
                            req.organizer_payment_status === "PAID" ? "border-l-emerald-500" : "border-l-amber-500"
                        )}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h4 className="font-bold text-lg text-gray-900">{req.name}</h4>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] font-semibold uppercase px-2 py-0",
                                            req.organizer_payment_status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                        )}>
                                            {req.organizer_payment_status === "PAID" ? "Repasse Realizado" : "Pendente Repasse"}
                                        </Badge>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="size-4 text-gray-400" />
                                            <span className="font-medium truncate">{req.credit_tables?.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-4 text-gray-400" />
                                            <span>
                                                {req.organizer_payment_status === "PAID" ? "Pago em:" : "Aprovado:"} {format(new Date(req.organizer_payment_date || req.created_at), "dd/MM/yyyy")}
                                            </span>
                                        </div>
                                        {req.cpf && (
                                            <div className="flex items-center gap-2">
                                                <User className="size-4 text-gray-400" />
                                                <span>{req.cpf}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col md:items-end gap-3 min-w-[200px]">
                                    <div className="text-right">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Valor do Repasse</p>
                                        <p className="text-xl font-bold text-brand-600">
                                            R$ {req.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    {req.organizer_payment_status !== "PAID" ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <div className="relative flex-1">
                                                <input
                                                    type="file"
                                                    id={`receipt-${req.id}`}
                                                    className="hidden"
                                                    accept="image/*,application/pdf"
                                                    onChange={(e) => {
                                                        setSelectedFile(e.target.files?.[0] || null);
                                                        setProcessingId(req.id);
                                                    }}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className={cn(
                                                        "w-full cursor-pointer font-semibold h-8 text-[11px] uppercase tracking-wider",
                                                        selectedFile && processingId === req.id ? "bg-emerald-50 border-emerald-400 text-emerald-800" : ""
                                                    )}
                                                >
                                                    <label htmlFor={`receipt-${req.id}`}>
                                                        <Upload className="size-3.5 mr-2" />
                                                        {selectedFile && processingId === req.id ? "PDF/IMG OK" : "Anexar Comprovante"}
                                                    </label>
                                                </Button>
                                            </div>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        disabled={!selectedFile || processingId !== req.id || isPending}
                                                        className="h-8 bg-brand-600 hover:bg-brand-700 text-white font-bold"
                                                    >
                                                        {isPending && processingId === req.id ? (
                                                            <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="size-3.5" />
                                                        )}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-xl border-none shadow-2xl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                                            <AlertTriangle className="size-5 text-amber-500" />
                                                            Confirmar Repasse?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription className="text-sm text-gray-600">
                                                            Você está marcando o repasse para <span className="font-bold text-gray-900">"{req.name}"</span> no valor de <span className="font-bold text-gray-900">R$ {req.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span> como realizado.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="mt-4">
                                                        <AlertDialogCancel className="h-9 text-xs font-bold uppercase tracking-wider">Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleMarkAsPaid(req.id)}
                                                            className="h-9 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold uppercase tracking-wider border-none"
                                                        >
                                                            Sim, Confirmar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-8 text-[11px] font-bold uppercase tracking-wider border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            asChild
                                        >
                                            <a href={req.organizer_payment_proof_url || "#"} target="_blank" rel="noopener noreferrer">
                                                <Eye className="size-3.5 mr-2" />
                                                Comprovante
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredRequests.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <DollarSign className="size-8 text-gray-200 mx-auto mb-2" />
                            <h5 className="text-gray-400 font-bold uppercase text-xs">Sem repasses no momento</h5>
                        </div>
                    )}
                </div>
            </Tabs>
        </div>
    );
}
