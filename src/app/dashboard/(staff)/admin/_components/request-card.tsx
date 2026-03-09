"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    User,
    Calendar,
    DollarSign,
    MessageSquarePlus,
    ChevronDown,
    ChevronUp,
    Send,
    Loader2,
    ImageIcon,
    FileText,
    Edit2,
    Trash2,
    X,
    Paperclip,
    Copy,
    Check,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    updateRequestStatus,
    addRequestNoteWithAttachments,
    updateRequestNoteWithAttachments,
    deleteRequestNote,
    deleteNoteAttachment,
    generatePaymentLink,
    markAsPaidToOrganizer,
} from "../actions";
import { BoletoConfigModal } from "./boleto-config-modal";
import { InstallmentsModal } from "./installments-modal";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Settings2, Receipt, ExternalLink, AlertTriangle } from "lucide-react";
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

export interface CreditRequestNoteAttachment {
    name: string;
    url: string;
    type: string;
}

export interface CreditRequestNote {
    id: string;
    content: string;
    created_at: string;
    attachments?: CreditRequestNoteAttachment[];
    image_url?: string; // Legacy
}

export interface CreditRequest {
    id: string;
    name: string;
    cpf: string;
    phone: string;
    amount: number;
    final_amount?: number | null;
    payment_method: string;
    installments: number;
    status: string;
    created_at: string;
    credit_tables: { name: string } | null;
    credit_request_notes?: CreditRequestNote[];
    payment_links?: { token: string; status: string; created_at: string }[];
    payment_batches?: {
        id: string;
        asaas_payment_book_url?: string | null;
        status?: string;
        payment_installments: {
            id: string;
            installment_number: number;
            status: string;
            amount: number;
            due_date: string;
        }[];
    }[];
    organizer_payment_status?: "PENDING" | "PAID";
    organizer_payment_date?: string | null;
    organizer_payment_proof_url?: string | null;
}

export const STATUS_CONFIG: Record<string, { label: string; borderClass: string; badgeClass: string }> = {
    pending: {
        label: "Pendente",
        borderClass: "border-l-amber-400",
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    },
    in_service: {
        label: "Em Atendimento",
        borderClass: "border-l-blue-500",
        badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    },
    approved: {
        label: "Aprovado",
        borderClass: "border-l-emerald-500",
        badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    refused: {
        label: "Recusado",
        borderClass: "border-l-rose-500",
        badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    },
    withdrawn: {
        label: "Desistência",
        borderClass: "border-l-slate-400",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    },
};

interface RequestCardProps {
    request: CreditRequest;
}

export function RequestCard({ request }: RequestCardProps) {
    const config = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;
    const [showNotes, setShowNotes] = useState(false);

    // Add Note State
    const [noteText, setNoteText] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDraggingAdd, setIsDraggingAdd] = useState(false);

    // Edit Note State
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editNoteText, setEditNoteText] = useState("");
    const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
    const [editKeptAttachments, setEditKeptAttachments] = useState<CreditRequestNoteAttachment[]>([]);
    const [isDraggingEdit, setIsDraggingEdit] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false);
    const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [organizerPaymentFile, setOrganizerPaymentFile] = useState<File | null>(null);
    const [isRepassePending, setIsRepassePending] = useState(false);
    const [showConfirmRepasse, setShowConfirmRepasse] = useState(false);

    useEffect(() => {
        if (copiedId) {
            const timeout = setTimeout(() => setCopiedId(null), 2000);
            return () => clearTimeout(timeout);
        }
    }, [copiedId]);

    const handleStatusChange = (newStatus: string) => {
        startTransition(async () => {
            const result = await updateRequestStatus(request.id, newStatus);
            if (!result.success) {
                console.error("Erro ao atualizar status: " + result.error);
            }
        });
    };

    const handleGenerateLink = () => {
        startTransition(async () => {
            const result = await generatePaymentLink(request.id, request.final_amount || request.amount, request.installments);
            if (!result.success) {
                console.error("Erro ao gerar link de pagamento: " + result.error);
                alert("Erro ao gerar link de pagamento");
            }
        });
    };

    const handleAddNote = () => {
        if (!noteText.trim() && selectedFiles.length === 0) return;
        startTransition(async () => {
            const formData = new FormData();
            formData.append("requestId", request.id);
            formData.append("content", noteText.trim());
            selectedFiles.forEach(file => {
                formData.append("attachments", file);
            });

            const result = await addRequestNoteWithAttachments(formData);
            if (result.success) {
                setNoteText("");
                setSelectedFiles([]);
            } else {
                console.error("Erro ao adicionar nota: " + result.error);
            }
        });
    };

    const handleUpdateNote = (noteId: string) => {
        if (!editNoteText.trim() && editNewFiles.length === 0 && editKeptAttachments.length === 0) return;
        startTransition(async () => {
            const formData = new FormData();
            formData.append("noteId", noteId);
            formData.append("content", editNoteText.trim());

            editNewFiles.forEach(file => {
                formData.append("newAttachments", file);
            });
            formData.append("keptAttachments", JSON.stringify(editKeptAttachments));

            const result = await updateRequestNoteWithAttachments(formData);
            if (result.success) {
                cancelEditing();
            } else {
                console.error("Erro ao atualizar nota: " + result.error);
            }
        });
    };

    const handleDeleteNote = (noteId: string) => {
        if (!confirm("Tem certeza que deseja excluir esta observação inteira?")) return;
        startTransition(async () => {
            const result = await deleteRequestNote(noteId);
            if (!result.success) {
                console.error("Erro ao excluir nota: " + result.error);
            }
        });
    };

    const handleDeleteAttachment = (noteId: string, url: string) => {
        if (!confirm("Remover este anexo?")) return;
        startTransition(async () => {
            const result = await deleteNoteAttachment(noteId, url);
            if (!result.success) {
                console.error("Erro ao deletar anexo:", result.error);
            }
        });
    };

    const startEditing = (note: CreditRequestNote) => {
        setEditingNoteId(note.id);
        setEditNoteText(note.content);
        setEditNewFiles([]);

        let initialAttachments = note.attachments || [];
        // Support legacy image_url if present
        if (note.image_url && initialAttachments.length === 0) {
            initialAttachments = [{ name: "Imagem Anexada", url: note.image_url, type: "image/jpeg" }];
        }
        setEditKeptAttachments(initialAttachments);
    };

    const cancelEditing = () => {
        setEditingNoteId(null);
        setEditNoteText("");
        setEditNewFiles([]);
        setEditKeptAttachments([]);
    };

    const handleMarkAsPaidToOrganizer = () => {
        if (!organizerPaymentFile) return;
        setIsRepassePending(true);
        startTransition(async () => {
            const formData = new FormData();
            formData.append("requestId", request.id);
            formData.append("proof", organizerPaymentFile);

            const result = await markAsPaidToOrganizer(formData);
            if (result.success) {
                setOrganizerPaymentFile(null);
                setShowConfirmRepasse(false);
            } else {
                console.error("Erro ao marcar como pago:", result.error);
                alert("Erro ao marcar como pago: " + (result.error || "Tente novamente mais tarde."));
            }
            setIsRepassePending(false);
        });
    };

    const notes = request.credit_request_notes ?? [];
    const whatsappText = encodeURIComponent(
        `Olá ${request.name.split(" ")[0]}, recebemos sua solicitação de crédito para o campeonato ${request.credit_tables?.name ?? ""}.`
    );
    const whatsappHref = `https://wa.me/55${request.phone.replace(/\D/g, "")}?text=${whatsappText}`;

    const handleDragEvent = useCallback((e: React.DragEvent, setDragging: (val: boolean) => void) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragging(true);
        } else if (e.type === 'dragleave' || e.type === 'drop') {
            setDragging(false);
        }
    }, []);

    const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => {
        const [url, setUrl] = useState<string>("");
        const isPdf = file.type.includes('pdf');

        useEffect(() => {
            const objectUrl = URL.createObjectURL(file);
            setUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }, [file]);

        if (!url) return <div className="animate-pulse bg-gray-100 w-32 h-32 rounded-md"></div>;

        return (
            <div className="relative group rounded-md border border-gray-200 bg-white overflow-hidden inline-block align-top shadow-sm max-w-full">
                {isPdf ? (
                    <div className="w-full sm:w-[500px] h-[500px] flex flex-col pt-10 relative">
                        <div className="absolute top-0 left-0 w-full h-10 bg-red-50 text-red-700 flex items-center px-4 font-medium text-sm border-b border-red-100 z-10 truncate">
                            <FileText className="size-4 mr-2" />
                            {file.name}
                        </div>
                        <iframe src={url} className="w-full h-full border-0 bg-gray-50 -mt-10 pt-10" title={file.name} />
                    </div>
                ) : (
                    <div className="p-1">
                        <img src={url} alt={file.name} className="w-auto max-w-full max-h-[500px] object-contain block rounded-sm" />
                    </div>
                )}
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md backdrop-blur-sm z-20"
                    title="Remover arquivo"
                >
                    <X className="size-3.5" />
                </button>
            </div>
        );
    };

    return (
        <Card
            className={cn(
                "p-5 flex flex-col gap-4 border-l-4 hover:shadow-md transition-shadow border-gray-200",
                config.borderClass
            )}
        >
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-bold text-lg text-gray-900">{request.name}</h3>
                    <span
                        className={cn(
                            "text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full border",
                            config.badgeClass
                        )}
                    >
                        {config.label}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Status select */}
                    <Select
                        defaultValue={request.status}
                        onValueChange={handleStatusChange}
                        disabled={isPending}
                    >
                        <SelectTrigger className="h-8 w-44 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                                <SelectItem key={value} value={value} className="text-xs">
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* WhatsApp */}
                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-bold text-sm transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                        </svg>
                        WhatsApp
                    </a>
                </div>
            </div>

            {/* ── Info Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <User className="size-4 text-gray-400" />
                    <span>{request.cpf}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-gray-400" />
                    <span>
                        {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <DollarSign className="size-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">
                            R$ {Number(request.final_amount ?? request.amount).toFixed(2).replace(".", ",")}
                        </span>
                    </div>
                    {request.final_amount && request.final_amount !== request.amount ? (
                        <span className="text-[10px] text-gray-400 pl-6 -mt-1 leading-tight">
                            Solicitado: R$ {Number(request.amount).toFixed(2).replace(".", ",")}
                        </span>
                    ) : null}
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium">
                        {request.payment_method === "credit_card" ? "Cartão" : "Boleto"}
                    </span>
                    {request.installments && (
                        <span className="text-gray-400">({request.installments}x)</span>
                    )}
                </div>
            </div>

            <div className="text-sm">
                <span className="text-gray-500">Campeonato: </span>
                <span className="font-semibold text-gray-900">{request.credit_tables?.name}</span>
            </div>

            {/* ── Payment Link (If Approved & Credit Card) ── */}
            {request.status === "approved" && request.payment_method === "credit_card" && (
                <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h4 className="font-semibold text-emerald-900">Link de Pagamento (Cartão)</h4>
                            <p className="text-sm text-emerald-700">
                                {request.payment_links && request.payment_links.length > 0
                                    ? "O link já foi gerado e está pronto para ser enviado ao cliente."
                                    : "Gere o link único para o cliente realizar o pagamento."}
                            </p>
                        </div>
                        {request.payment_links?.some(l => l.status === "ACTIVE") ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "transition-all duration-200 gap-2",
                                    copiedId === request.id
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                        : "bg-white hover:bg-emerald-600 hover:text-white border-emerald-200 hover:border-emerald-600"
                                )}
                                onClick={() => {
                                    const link = request.payment_links!.find(l => l.status === "ACTIVE");
                                    if (link) {
                                        const url = `${window.location.origin}/pagamento/cartao/${link.token}`;
                                        navigator.clipboard.writeText(url);
                                        setCopiedId(request.id);
                                    }
                                }}
                            >
                                {copiedId === request.id ? (
                                    <>
                                        <Check className="size-3.5" />
                                        <span>Copiado!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-3.5" />
                                        <span>Copiar Link</span>
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleGenerateLink}
                                disabled={isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isPending ? <Loader2 className="size-4 animate-spin" /> : "Gerar Link"}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Pagamento da Inscrição (Repasse ao Organizador) ── */}
            {request.status === "approved" && (
                <div className="mt-2 bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <Receipt className="size-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900 leading-tight">Pagamento da Inscrição</h4>
                                <p className="text-sm text-blue-700/80">
                                    {request.organizer_payment_status === "PAID"
                                        ? `Pago em ${format(new Date(request.organizer_payment_date!), "dd/MM/yyyy", { locale: ptBR })}`
                                        : "Repasse do valor da inscrição para o organizador do evento."}
                                </p>
                            </div>
                        </div>

                        {request.organizer_payment_status === "PAID" ? (
                            <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold uppercase py-1 px-3">
                                    Pagamento Realizado
                                </Badge>
                                {request.organizer_payment_proof_url && (
                                    <a
                                        href={request.organizer_payment_proof_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                        title="Ver Comprovante"
                                    >
                                        <ExternalLink className="size-5" />
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50 min-w-[150px]">
                                    {isRepassePending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : organizerPaymentFile ? (
                                        <>
                                            <Check className="size-4" />
                                            <span>Pronto p/ Enviar</span>
                                        </>
                                    ) : (
                                        <>
                                            <Paperclip className="size-4" />
                                            <span>Marcar como Pago</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setOrganizerPaymentFile(file);
                                        }}
                                        disabled={isRepassePending}
                                    />
                                </label>
                                {organizerPaymentFile && (
                                    <AlertDialog open={showConfirmRepasse} onOpenChange={setShowConfirmRepasse}>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                                disabled={isRepassePending}
                                            >
                                                Confirmar Repasse
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <div className="flex items-center gap-2 text-amber-600 mb-2">
                                                    <AlertTriangle className="size-5" />
                                                    <AlertDialogTitle>Confirmar Repasse de Valor</AlertDialogTitle>
                                                </div>
                                                <AlertDialogDescription className="text-gray-600">
                                                    Você está confirmando que repassou o valor da inscrição para o organizador.
                                                    <br /><br />
                                                    <span className="font-bold text-gray-900">Importante:</span> Uma vez confirmado, este registro <span className="text-red-600 font-bold underline text-base">não poderá ser desmarcado</span> ou alterado.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={isRepassePending}>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleMarkAsPaidToOrganizer();
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                                    disabled={isRepassePending}
                                                >
                                                    {isRepassePending ? <Loader2 className="size-4 animate-spin" /> : "Sim, confirmar repasse"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Notes toggle ── */}
            <div className="border-t border-gray-100 pt-3">
                <button
                    onClick={() => setShowNotes((v) => !v)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <MessageSquarePlus className="size-4" />
                    <span>Observações ({notes.length})</span>
                    {showNotes ? (
                        <ChevronUp className="size-4" />
                    ) : (
                        <ChevronDown className="size-4" />
                    )}
                </button>

                {showNotes && (
                    <div className="mt-3 space-y-3">
                        {/* Existing notes */}
                        {notes.length > 0 ? (
                            <ul className="space-y-3">
                                {notes.map((note) => {
                                    const noteAttachments = note.attachments || [];
                                    const hasLegacyImage = !!note.image_url;

                                    return (
                                        <li
                                            key={note.id}
                                            className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm flex flex-col gap-2 relative group"
                                        >
                                            {editingNoteId === note.id ? (
                                                <div
                                                    className={cn(
                                                        "space-y-3 rounded-md p-2 transition-colors border",
                                                        isDraggingEdit ? "bg-brand-50/50 border-brand-400 border-dashed" : "border-transparent"
                                                    )}
                                                    onDragEnter={(e) => handleDragEvent(e, setIsDraggingEdit)}
                                                    onDragOver={(e) => handleDragEvent(e, setIsDraggingEdit)}
                                                    onDragLeave={(e) => handleDragEvent(e, setIsDraggingEdit)}
                                                    onDrop={(e) => {
                                                        handleDragEvent(e, setIsDraggingEdit);
                                                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                                            setEditNewFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                                                        }
                                                    }}
                                                >
                                                    <textarea
                                                        value={editNoteText}
                                                        onChange={(e) => setEditNoteText(e.target.value)}
                                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 resize-y"
                                                        disabled={isPending}
                                                    />

                                                    {/* Existing Kept Files */}
                                                    {editKeptAttachments.length > 0 && (
                                                        <div className="flex flex-wrap gap-4 mt-4">
                                                            {editKeptAttachments.map((att, i) => {
                                                                const isPdf = att.type?.includes('pdf') || att.name?.toLowerCase().endsWith(".pdf");
                                                                return (
                                                                    <div key={'kept-' + i} className="relative group rounded-md border border-gray-200 bg-white overflow-hidden inline-block align-top shadow-md max-w-full">
                                                                        {isPdf ? (
                                                                            <div className="w-full sm:w-[500px] h-[500px] flex flex-col pt-10 relative">
                                                                                <div className="absolute top-0 left-0 w-full h-10 bg-red-50 text-red-700 flex items-center px-4 font-medium text-sm border-b border-red-100 z-10 truncate">
                                                                                    <FileText className="size-4 mr-2" />
                                                                                    {att.name}
                                                                                </div>
                                                                                <iframe src={att.url} className="w-full h-full border-0 bg-gray-50 pointer-events-none -mt-10 pt-10" title={att.name} />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="p-1">
                                                                                <img src={att.url} alt={att.name} className="w-auto max-w-full max-h-[500px] object-contain block rounded-sm opacity-80" />
                                                                            </div>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setEditKeptAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                                            className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md backdrop-blur-sm z-20"
                                                                            title="Remover anexo selecionado na edição"
                                                                        >
                                                                            <X className="size-3.5" />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* New Added Files */}
                                                    {editNewFiles.length > 0 && (
                                                        <div className="flex flex-wrap gap-4 mt-4">
                                                            {editNewFiles.map((file, i) => (
                                                                <FilePreview
                                                                    key={'new-' + i}
                                                                    file={file}
                                                                    onRemove={() => setEditNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 items-center justify-between mt-2">
                                                        <div>
                                                            <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                                                <Paperclip className="size-3.5 text-gray-500" />
                                                                Adicionar Anexos
                                                                <input
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*,application/pdf"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        if (e.target.files && e.target.files.length > 0) {
                                                                            setEditNewFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                                                        }
                                                                        e.target.value = ''; // Reset input to allow adding same file again if deleted
                                                                    }}
                                                                    disabled={isPending}
                                                                />
                                                            </label>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="ghost" onClick={cancelEditing} disabled={isPending}>Cancelar</Button>
                                                            <Button size="sm" onClick={() => handleUpdateNote(note.id)} disabled={isPending}>
                                                                {isPending ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Actions menu (visible on hover) */}
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                        <button onClick={() => startEditing(note)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar">
                                                            <Edit2 className="size-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDeleteNote(note.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir">
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>

                                                    <p className="text-gray-800 whitespace-pre-wrap pr-12 leading-relaxed">{note.content}</p>

                                                    {(noteAttachments.length > 0 || hasLegacyImage) && (
                                                        <div className="mt-4 flex gap-4 flex-wrap">
                                                            {noteAttachments.length > 0 ? (
                                                                noteAttachments.map((att, i) => {
                                                                    const isPdf = att.type?.includes('pdf') || att.name?.toLowerCase().endsWith(".pdf");
                                                                    return (
                                                                        <div key={i} className="relative group border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm inline-block max-w-full align-top">
                                                                            <a href={att.url} target="_blank" rel="noreferrer" className="block relative h-full">
                                                                                {isPdf ? (
                                                                                    <div className="w-full sm:w-[500px] h-[500px] flex flex-col pt-10">
                                                                                        <div className="absolute top-0 left-0 w-full h-10 bg-red-50 text-red-700 flex items-center px-4 font-medium text-sm border-b border-red-100 z-10 truncate">
                                                                                            <FileText className="size-4 mr-2" />
                                                                                            {att.name}
                                                                                        </div>
                                                                                        <iframe src={att.url} className="w-full h-full border-0 bg-gray-50 pointer-events-none -mt-10 pt-10" title={att.name} />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="p-1">
                                                                                        <img src={att.url} alt={att.name} className="w-auto max-w-full max-h-[500px] object-contain block rounded-sm" />
                                                                                    </div>
                                                                                )}
                                                                            </a>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteAttachment(note.id, att.url); }}
                                                                                className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md backdrop-blur-sm z-20"
                                                                                title="Deletar anexo definitivamente"
                                                                            >
                                                                                <Trash2 className="size-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                // Legacy image_url display
                                                                <div className="relative group border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm inline-block max-w-full align-top p-1">
                                                                    <a href={note.image_url} target="_blank" rel="noreferrer" className="block relative h-full">
                                                                        <img src={note.image_url!} alt="Anexo da observação" className="w-auto max-w-full max-h-[500px] object-contain block rounded-sm" />
                                                                    </a>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteAttachment(note.id, note.image_url!); }}
                                                                        className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md backdrop-blur-sm z-20"
                                                                        title="Deletar anexo definitivamente"
                                                                    >
                                                                        <Trash2 className="size-3.5" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {format(
                                                            new Date(note.created_at),
                                                            "dd/MM/yyyy 'às' HH:mm",
                                                            { locale: ptBR }
                                                        )}
                                                    </p>
                                                </>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-xs text-gray-400 italic">
                                Nenhuma observação ainda.
                            </p>
                        )}

                        {/* Add note */}
                        <div
                            className={cn(
                                "relative rounded-md border bg-background focus-within:ring-2 focus-within:ring-brand-500 overflow-hidden transition-all shadow-sm",
                                isDraggingAdd ? "border-brand-500 bg-brand-50/20 border-dashed" : "border-input"
                            )}
                            onDragEnter={(e) => handleDragEvent(e, setIsDraggingAdd)}
                            onDragOver={(e) => handleDragEvent(e, setIsDraggingAdd)}
                            onDragLeave={(e) => handleDragEvent(e, setIsDraggingAdd)}
                            onDrop={(e) => {
                                handleDragEvent(e, setIsDraggingAdd);
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                                }
                            }}
                        >
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Arraste arquivos aqui ou digite uma observação..."
                                className="w-full min-h-[80px] p-3 text-sm bg-transparent border-0 focus:ring-0 resize-y outline-none"
                                disabled={isPending}
                            />

                            {selectedFiles.length > 0 && (
                                <div className="px-3 pb-4 pt-2">
                                    <div className="flex flex-wrap gap-4">
                                        {selectedFiles.map((file, i) => (
                                            <FilePreview
                                                key={i}
                                                file={file}
                                                onRemove={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex bg-gray-50/50 border-t items-center justify-between p-2 mt-auto">
                                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors">
                                    <Paperclip className="size-4" />
                                    <span>Anexar Arquivos</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                            }
                                            e.target.value = ''; // Reset to allow adding same file again
                                        }}
                                        disabled={isPending}
                                    />
                                </label>

                                <Button
                                    size="sm"
                                    onClick={handleAddNote}
                                    disabled={isPending || (!noteText.trim() && selectedFiles.length === 0)}
                                    className="gap-2 px-4 shadow-sm"
                                >
                                    {isPending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="size-4" />
                                            <span>Enviar</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {request.status === "approved" && request.payment_method === "boleto" && (
                    <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                                <Settings2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                {request.payment_batches && request.payment_batches.length > 0 ? (
                                    <>
                                        <h4 className="text-sm font-bold text-blue-900 mb-1">
                                            Gerenciar Pagamentos
                                        </h4>
                                        <p className="text-xs text-blue-700 mb-3">
                                            Os boletos já foram gerados. Visualize as parcelas e o status de pagamento.
                                        </p>
                                        <Button
                                            size="sm"
                                            onClick={() => setIsInstallmentsModalOpen(true)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                        >
                                            Ver Parcelas
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="text-sm font-bold text-blue-900 mb-1">
                                            Configuração de Boletos
                                        </h4>
                                        <p className="text-xs text-blue-700 mb-3">
                                            A solicitação foi aprovada. Configure o vencimento para gerar o parcelamento no Asaas e baixar o carnê.
                                        </p>
                                        <Button
                                            size="sm"
                                            onClick={() => setIsBoletoModalOpen(true)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                        >
                                            Configurar Pagamento
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <BoletoConfigModal
                    isOpen={isBoletoModalOpen}
                    onClose={() => setIsBoletoModalOpen(false)}
                    request={request}
                />

                {request.payment_batches && request.payment_batches.length > 0 && (
                    <InstallmentsModal
                        isOpen={isInstallmentsModalOpen}
                        onClose={() => setIsInstallmentsModalOpen(false)}
                        batchId={request.payment_batches[0].id}
                        asaasPaymentBookUrl={request.payment_batches[0].asaas_payment_book_url}
                        requestName={request.name}
                    />
                )}
            </div>
        </Card>
    );
}
