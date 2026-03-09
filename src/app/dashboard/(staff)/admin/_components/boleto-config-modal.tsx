"use client";

import { useState } from "react";
import { format, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Note: We use window.alert if toast is not available, or assume it's global if defined in layout
const toast = {
    success: (msg: string) => console.log("Success:", msg),
    error: (msg: string) => console.error("Error:", msg)
};
import { Loader2, Calendar as CalendarIcon, FileDown, CheckCircle2 } from "lucide-react";
import { generateBoletoBatch, generateCarnet } from "../actions";

interface BoletoConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: any;
}

export function BoletoConfigModal({ isOpen, onClose, request }: BoletoConfigModalProps) {
    const [firstDueDate, setFirstDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedBatchId, setGeneratedBatchId] = useState<string | null>(null);
    const [carnetUrl, setCarnetUrl] = useState<string | null>(null);
    const [isGeneratingCarnet, setIsGeneratingCarnet] = useState(false);

    const installments = request.installments || 1;
    const finalAmount = request.final_amount ?? request.amount;
    const valuePerInstallment = finalAmount / installments;

    // Calculate preview dates
    const previewDates = Array.from({ length: installments }).map((_, i) => {
        const date = addMonths(parseISO(firstDueDate), i);
        return date;
    });

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await generateBoletoBatch(request.id, firstDueDate);
            if (res.success) {
                toast.success("Boletos gerados com sucesso!");
                setGeneratedBatchId(res.batchId || null);
            } else {
                toast.error(res.error || "Erro ao gerar boletos.");
            }
        } catch (error) {
            toast.error("Erro inesperado ao processar geração.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateCarnet = async () => {
        if (!generatedBatchId) return;
        setIsGeneratingCarnet(true);
        try {
            const res = await generateCarnet(generatedBatchId);
            if (res.success) {
                setCarnetUrl(res.pdfUrl || null);
                toast.success("Carnê PDF gerado!");
            } else {
                toast.error(res.error || "Erro ao gerar PDF.");
            }
        } catch (error) {
            toast.error("Erro ao gerar carnê.");
        } finally {
            setIsGeneratingCarnet(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Configurar Pagamento (Boleto)</DialogTitle>
                    <DialogDescription>
                        Defina a data do primeiro vencimento para gerar o parcelamento.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Summary Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                        <div>
                            <p className="text-muted-foreground">Cliente</p>
                            <p className="font-semibold">{request.name}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Valor Total</p>
                            <p className="font-semibold">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(finalAmount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Parcelas</p>
                            <p className="font-semibold">{installments}x de {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valuePerInstallment)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Método</p>
                            <p className="font-semibold uppercase">{request.payment_method}</p>
                        </div>
                    </div>

                    {!generatedBatchId ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="firstDueDate">Vencimento da 1ª Parcela</Label>
                                <div className="relative">
                                    <Input
                                        id="firstDueDate"
                                        type="date"
                                        value={firstDueDate}
                                        onChange={(e) => setFirstDueDate(e.target.value)}
                                        className="pl-10"
                                    />
                                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Prévia das Parcelas</Label>
                                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                                    {previewDates.map((date, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 text-sm">
                                            <span className="font-medium text-muted-foreground">Parcela {i + 1}</span>
                                            <span className="font-semibold">{format(date, "dd/MM/yyyy", { locale: ptBR })}</span>
                                            <span className="text-brand-600 font-bold">
                                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valuePerInstallment)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Boletos Gerados com Sucesso!</h3>
                                <p className="text-muted-foreground text-sm">O parcelamento já está registrado no Asaas.</p>
                            </div>

                            {carnetUrl ? (
                                <Button asChild variant="outline" className="w-full sm:w-auto border-brand-200">
                                    <a href={carnetUrl} target="_blank" rel="noreferrer">
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Visualizar/Baixar Carnê PDF
                                    </a>
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleGenerateCarnet}
                                    disabled={isGeneratingCarnet}
                                    className="bg-brand-600 hover:bg-brand-700"
                                >
                                    {isGeneratingCarnet ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileDown className="mr-2 h-4 w-4" />
                                    )}
                                    Gerar Carnê em PDF
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {!generatedBatchId ? (
                        <>
                            <Button variant="ghost" onClick={onClose} disabled={isGenerating}>Cancelar</Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="bg-brand-600 hover:bg-brand-700"
                            >
                                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar e Gerar Boletos
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={onClose}>Fechar</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
