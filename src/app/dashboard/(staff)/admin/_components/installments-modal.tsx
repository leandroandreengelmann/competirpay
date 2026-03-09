"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPaymentInstallments, updateInstallmentDueDate, getInstallmentPixQrCode } from "../actions";
import { Loader2, ExternalLink, Calendar as CalendarIcon, DollarSign, Download, Copy, AlertCircle, Edit2, MessageCircle, QrCode } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Installment {
    id: string;
    installment_number: number;
    due_date: string;
    amount: number;
    status: string;
    asaas_bank_slip_url: string;
    payment_date: string | null;
}

interface InstallmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    batchId: string;
    asaasPaymentBookUrl?: string | null;
    requestName: string;
}

const INSTALLMENT_STATUS: Record<string, { label: string; badgeClass: string }> = {
    PENDING: { label: "Pendente", badgeClass: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
    RECEIVED: { label: "Recebido", badgeClass: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
    OVERDUE: { label: "Atrasado", badgeClass: "bg-rose-100 text-rose-700 hover:bg-rose-100" },
    RECEIVED_IN_CASH: { label: "Recebido em Dinheiro", badgeClass: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
    REFUNDED: { label: "Estornado", badgeClass: "bg-slate-100 text-slate-700 hover:bg-slate-100" },
    REFUND_REQUESTED: { label: "Estorno Solicitado", badgeClass: "bg-slate-100 text-slate-700 hover:bg-slate-100" },
    CHARGEBACK_REQUESTED: { label: "Chargeback Solicitado", badgeClass: "bg-rose-100 text-rose-700 hover:bg-rose-100" },
    CHARGEBACK_DISPUTE: { label: "Em Disputa", badgeClass: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
    AWAITING_CHARGEBACK_REVERSAL: { label: "Aguardando Reversão", badgeClass: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
    DUNNING_REQUESTED: { label: "Em Negativação", badgeClass: "bg-rose-100 text-rose-700 hover:bg-rose-100" },
    DUNNING_RECEIVED: { label: "Recuperado", badgeClass: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
    AWAITING_RISK_ANALYSIS: { label: "Em Análise", badgeClass: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
};

export function InstallmentsModal({ isOpen, onClose, batchId, asaasPaymentBookUrl, requestName }: InstallmentsModalProps) {
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit Date State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newDueDate, setNewDueDate] = useState<string>("");
    const [isUpdatingDate, setIsUpdatingDate] = useState(false);

    // PIX State
    const [pixModalOpenId, setPixModalOpenId] = useState<string>("");
    const [pixData, setPixData] = useState<{ encodedImage: string; payload: string } | null>(null);
    const [isPixLoading, setIsPixLoading] = useState(false);

    useEffect(() => {
        if (isOpen && batchId) {
            loadInstallments();
        }
    }, [isOpen, batchId]);

    const loadInstallments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getPaymentInstallments(batchId);
            if (result.success) {
                setInstallments(result.installments || []);
            } else {
                setError(result.error || "Erro ao carregar parcelas.");
            }
        } catch (e: any) {
            setError(e.message || "Erro inesperado.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateDueDate = async (installmentId: string) => {
        if (!newDueDate) return;
        setIsUpdatingDate(true);
        try {
            const result = await updateInstallmentDueDate(installmentId, newDueDate);
            if (result.success) {
                setEditingId(null);
                setNewDueDate("");
                await loadInstallments();
            } else {
                alert(result.error || "Erro ao atualizar vencimento.");
            }
        } catch (e: any) {
            alert("Erro inesperado.");
        } finally {
            setIsUpdatingDate(false);
        }
    };

    const generateWhatsAppLink = (inst: Installment) => {
        const value = Number(inst.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        const date = format(parseISO(inst.due_date), "dd/MM/yyyy");
        const text = `Olá! O seu boleto da parcela ${inst.installment_number}/${installments.length} no valor de ${value} com vencimento para ${date} já está disponível. Você pode acessá-lo por este link: ${inst.asaas_bank_slip_url}`;
        return `https://wa.me/?text=${encodeURIComponent(text)}`;
    };

    const handleOpenPix = async (installmentId: string) => {
        setPixModalOpenId(installmentId);
        setPixData(null);
        setIsPixLoading(true);
        try {
            const res = await getInstallmentPixQrCode(installmentId);
            if (res.success && res.pix) {
                setPixData(res.pix);
            } else {
                alert(res.error || "Erro ao gerar PIX");
                setPixModalOpenId("");
            }
        } catch (e) {
            alert("Erro inesperado");
            setPixModalOpenId("");
        } finally {
            setIsPixLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 bg-white">
                <DialogHeader className="p-6 pb-4 bg-white border-b border-gray-100">
                    <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                        Gerenciar Pagamentos
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 mt-1.5">
                        Parcelas da solicitação de <span className="font-semibold text-gray-700">{requestName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Carnet Actions */}
                    {asaasPaymentBookUrl && (
                        <div className="mb-6 p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-semibold text-blue-900">Carnê Completo</h4>
                                <p className="text-sm text-blue-700 mt-0.5">
                                    Baixe o PDF único contendo todos os boletos desta solicitação.
                                </p>
                            </div>
                            <Button
                                asChild
                                variant="outline"
                                className="bg-white hover:bg-blue-50 text-blue-700 border-blue-200 gap-2 shrink-0"
                            >
                                <a href={asaasPaymentBookUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="size-4" />
                                    Baixar Carnê
                                </a>
                            </Button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader2 className="size-8 animate-spin mb-4 text-brand-500" />
                            <p>Carregando parcelas...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-start gap-3">
                            <AlertCircle className="size-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    ) : installments.length === 0 ? (
                        <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-white">
                            <p className="text-gray-500 font-medium">
                                Nenhuma parcela encontrada para este lote.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {installments.map((inst) => {
                                const statusConfig = INSTALLMENT_STATUS[inst.status] || { label: inst.status, badgeClass: "bg-gray-100 text-gray-700" };

                                return (
                                    <div key={inst.id} className="bg-white border text-sm border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-300 hover:shadow-sm transition-all">

                                        {/* Info block */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 shrink-0 font-bold text-gray-700">
                                                {inst.installment_number}/{installments.length}
                                            </div>

                                            <div className="space-y-1 my-auto">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 text-base">
                                                        R$ {Number(inst.amount).toFixed(2).replace(".", ",")}
                                                    </span>
                                                    <Badge className={`font-semibold text-[10px] px-2 py-0.5 uppercase tracking-wide border-0 ${statusConfig.badgeClass} shadow-none`}>
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-4 text-gray-500 text-xs">
                                                    <div className="flex items-center gap-1.5" title="Data de vencimento">
                                                        <CalendarIcon className="size-3.5 opacity-70" />
                                                        <span>
                                                            Vence: <strong className="font-semibold text-gray-700">{format(parseISO(inst.due_date), "dd/MM/yyyy")}</strong>
                                                        </span>
                                                    </div>

                                                    {inst.payment_date && (
                                                        <div className="flex items-center gap-1.5 text-emerald-600" title="Data de pagamento">
                                                            < DollarSign className="size-3.5 opacity-70" />
                                                            <span>
                                                                Pago: <strong className="font-semibold">{format(new Date(inst.payment_date), "dd/MM/yyyy")}</strong>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions block */}
                                        <div className="flex items-center gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                                            {inst.asaas_bank_slip_url && (
                                                <>
                                                    {(inst.status === "PENDING" || inst.status === "OVERDUE") && (
                                                        <Button size="icon" variant="secondary" className="bg-[#00B4D8]/10 hover:bg-[#00B4D8]/20 text-[#00B4D8]" onClick={() => handleOpenPix(inst.id)} title="Pagar com PIX">
                                                            <QrCode className="size-4" />
                                                        </Button>
                                                    )}
                                                    <Button size="icon" variant="secondary" className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366]" asChild title="Enviar por WhatsApp">
                                                        <a href={generateWhatsAppLink(inst)} target="_blank" rel="noopener noreferrer">
                                                            <MessageCircle className="size-4" />
                                                        </a>
                                                    </Button>
                                                    <Button size="sm" variant="secondary" className="gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700" asChild>
                                                        <a href={inst.asaas_bank_slip_url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="size-3.5" />
                                                            <span className="hidden sm:inline">Ver Boleto</span>
                                                        </a>
                                                    </Button>
                                                </>
                                            )}

                                            {/* Edit Date Button (only for PENDING/OVERDUE) */}
                                            {(inst.status === "PENDING" || inst.status === "OVERDUE") && (
                                                <Popover
                                                    open={editingId === inst.id}
                                                    onOpenChange={(open: boolean) => {
                                                        if (open) {
                                                            setEditingId(inst.id);
                                                            setNewDueDate(inst.due_date);
                                                        } else {
                                                            setEditingId(null);
                                                        }
                                                    }}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button size="icon" variant="outline" className="text-gray-500 hover:text-blue-600 border-gray-200 ml-1" title="Alterar Vencimento">
                                                            <Edit2 className="size-3.5" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent align="end" className="w-64 p-4">
                                                        <div className="space-y-4">
                                                            <div className="space-y-1">
                                                                <h4 className="font-medium text-sm text-gray-900 border-b pb-1">Novo Vencimento</h4>
                                                                <p className="text-xs text-gray-500">Apenas altere a data se necessário.</p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor={`date-${inst.id}`} className="text-xs">Data de Vencimento</Label>
                                                                <Input
                                                                    id={`date-${inst.id}`}
                                                                    type="date"
                                                                    value={newDueDate}
                                                                    onChange={(e) => setNewDueDate(e.target.value)}
                                                                    min={format(new Date(), "yyyy-MM-dd")}
                                                                    className="h-8 text-sm"
                                                                />
                                                            </div>
                                                            <div className="flex justify-end gap-2 pt-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 text-xs"
                                                                    onClick={() => setEditingId(null)}
                                                                    disabled={isUpdatingDate}
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                                                    disabled={isUpdatingDate || !newDueDate || newDueDate === inst.due_date}
                                                                    onClick={() => handleUpdateDueDate(inst.id)}
                                                                >
                                                                    {isUpdatingDate ? <Loader2 className="size-3 animate-spin" /> : "Salvar"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>

            {/* PIX Dialog */}
            <Dialog open={!!pixModalOpenId} onOpenChange={(open) => !open && setPixModalOpenId("")}>
                <DialogContent className="sm:max-w-md text-center">
                    <DialogHeader>
                        <DialogTitle className="text-center">Pagamento via PIX</DialogTitle>
                        <DialogDescription className="text-center">
                            Escaneie o QR Code abaixo ou copie o código PIX Copia e Cola.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl my-4 min-h-[250px]">
                        {isPixLoading ? (
                            <div className="flex flex-col items-center text-gray-400">
                                <Loader2 className="size-8 animate-spin mb-4 text-[#00B4D8]" />
                                <p className="text-sm font-medium">Gerando PIX...</p>
                            </div>
                        ) : pixData ? (
                            <div className="flex flex-col items-center w-full">
                                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 mb-6">
                                    <img src={`data:image/png;base64,${pixData.encodedImage}`} alt="PIX QR Code" className="w-48 h-48" />
                                </div>
                                <div className="w-full">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-left">PIX Copia e Cola</p>
                                    <div className="flex items-center gap-2">
                                        <Input readOnly value={pixData.payload} className="bg-white font-mono text-xs" />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="shrink-0 group"
                                            onClick={() => {
                                                navigator.clipboard.writeText(pixData.payload);
                                                alert("Código copiado!");
                                            }}
                                        >
                                            <Copy className="size-4 text-gray-500 group-hover:text-blue-600" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-red-500 text-sm">Não foi possível carregar o PIX.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
