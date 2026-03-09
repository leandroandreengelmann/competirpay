"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { Plus, Wallet, CreditCard, X, Edit2, Trash2 } from "lucide-react";
import CreditTableBuilder from "./credit-table-builder";

interface CreditTable {
    id: string;
    name: string;
    simulation_base: number;
    created_at: string;
    boleto_count?: number;
    card_count?: number;
}

interface Props {
    tables: CreditTable[];
}

export default function TaxasClient({ tables }: Props) {
    const router = useRouter();
    const supabase = createClient();
    const [, startTransition] = useTransition();

    const [editId, setEditId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleSaved = () => {
        setEditId(null);
        startTransition(() => router.refresh());
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        await supabase.from("credit_tables").delete().eq("id", id);
        setIsDeleting(null);
        startTransition(() => router.refresh());
    };

    if (editId !== null) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setEditId(null)}>
                        <X className="size-4 mr-1" /> Cancelar
                    </Button>
                    <h2 className="text-sm text-gray-500">
                        {editId === "new" ? "Nova tabela de crédito" : "Editar tabela"}
                    </h2>
                </div>
                <CreditTableBuilder editTableId={editId === "new" ? undefined : editId} onSaved={handleSaved} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">Taxas e Simulador</h1>
                    <p className="text-sm text-muted-foreground">
                        Tabelas de crédito por campeonato com simulação em tempo real.
                    </p>
                </div>
                <Button onClick={() => setEditId("new")} className="gap-2">
                    <Plus className="size-4" /> Criar nova tabela
                </Button>
            </div>

            {tables.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-14 text-center bg-gray-50/50 space-y-3">
                    <p className="text-gray-400 font-semibold">Nenhuma tabela criada ainda.</p>
                    <p className="text-sm text-gray-400">Clique em &quot;Criar nova tabela&quot; para começar.</p>
                    <Button variant="outline" size="sm" onClick={() => setEditId("new")} className="mt-2 gap-1">
                        <Plus className="size-4" /> Criar tabela
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {tables.map(t => (
                        <div
                            key={t.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50/50 hover:border-gray-300 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-lg font-black text-gray-900">{t.name}</p>
                                    <p className="text-sm font-medium text-gray-500 mt-0.5">
                                        Base de simulação: R$ {t.simulation_base.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    {(t.boleto_count ?? 0) > 0 && (
                                        <Badge variant="outline" className="text-sm px-3 py-1.5 gap-1.5 bg-blue-50 text-blue-700 border-blue-200">
                                            <Wallet className="size-4" /> {t.boleto_count} planos boleto
                                        </Badge>
                                    )}
                                    {(t.card_count ?? 0) > 0 && (
                                        <Badge variant="outline" className="text-sm px-3 py-1.5 gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                                            <CreditCard className="size-4" /> até {t.card_count}x cartão
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1"
                                    onClick={() => setEditId(t.id)}
                                >
                                    <Edit2 className="size-3" /> Editar
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8 gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                                            <Trash2 className="size-3" /> Excluir
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir Tabela?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Isso excluirá a tabela "{t.name}" e todos os planos de boleto e taxas de cartão configuradas nela. Esta ação não pode ser desfeita.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                onClick={() => handleDelete(t.id)}
                                            >
                                                {isDeleting === t.id ? "Excluindo..." : "Sim, excluir"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
