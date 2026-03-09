"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Save } from "lucide-react";
import { updateStaffAccount } from "./actions";

export function EditStaffForm({ user }: { user: any }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            try {
                const result = await updateStaffAccount(user.id, formData);
                if (result?.error) {
                    setError(result.error);
                }
            } catch (e) {
                // Next.js redirections throw an error here, which is expected
            }
        });
    };

    // Extrai metadata do usuário direto do auth admin API
    const meta = user.user_metadata || {};
    const initialRole = (meta.role as string) || "financeiro";
    const [selectedRole, setSelectedRole] = useState(initialRole);

    return (
        <div className="bg-white border rounded-lg shadow-xs overflow-hidden">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                            <AlertCircle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 mb-2">Informações da Equipe</h3>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="fullName" className="text-sm font-medium text-zinc-700">Nome Completo</Label>
                            <Input id="fullName" name="fullName" defaultValue={meta.full_name || ""} required disabled={isPending} />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="role" className="text-sm font-medium text-zinc-700">Perfil de Acesso</Label>
                            {/* Hidden input to ensure value is always submitted */}
                            <input type="hidden" name="role" value={selectedRole} />
                            <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isPending}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="financeiro">Financeiro</SelectItem>
                                    <SelectItem value="analista_credito">Analista de Crédito</SelectItem>
                                    <SelectItem value="admin">Administrador (Total)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label className="text-sm font-medium text-zinc-700">E-mail (Não Editável)</Label>
                            <Input value={user.email} disabled className="bg-zinc-50 text-zinc-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-50 border-t px-6 py-4 flex items-center justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Salvando..." : (
                            <>
                                <Save className="size-4 mr-2" />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
