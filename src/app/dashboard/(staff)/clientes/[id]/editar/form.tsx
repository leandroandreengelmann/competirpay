"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Save } from "lucide-react";
import { updateClientAccount } from "./actions";

export function EditClientForm({ user }: { user: any }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            try {
                const result = await updateClientAccount(user.id, formData);
                if (result?.error) {
                    setError(result.error);
                }
            } catch (e) {
                // Next.js redirect
            }
        });
    };

    // Obter dados do metadata caso existam, ou do próprio profile (fallback)
    const meta = user.user_metadata || {};

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
                        {/* Informações Pessoais */}
                        <div className="sm:col-span-2">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 mb-2">Informações Pessoais</h3>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="fullName" className="text-sm font-medium text-zinc-700">Nome Completo</Label>
                            <Input id="fullName" name="fullName" defaultValue={user.full_name || meta.full_name} required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cpf" className="text-sm font-medium text-zinc-700">CPF</Label>
                            <Input id="cpf" name="cpf" defaultValue={user.cpf || meta.cpf} required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-zinc-700">Celular / Telefone</Label>
                            <Input id="phone" name="phone" defaultValue={user.phone || meta.phone} required disabled={isPending} />
                        </div>

                        {/* Endereço */}
                        <div className="sm:col-span-2 mt-2">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 mb-2">Endereço</h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cep" className="text-sm font-medium text-zinc-700">CEP</Label>
                            <Input id="cep" name="cep" defaultValue={meta.cep} required disabled={isPending} />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="street" className="text-sm font-medium text-zinc-700">Rua / Logradouro</Label>
                            <Input id="street" name="street" defaultValue={meta.street} required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="number" className="text-sm font-medium text-zinc-700">Número</Label>
                            <Input id="number" name="number" defaultValue={meta.address_number} required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="neighborhood" className="text-sm font-medium text-zinc-700">Bairro</Label>
                            <Input id="neighborhood" name="neighborhood" defaultValue={meta.neighborhood} required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city" className="text-sm font-medium text-zinc-700">Cidade</Label>
                            <Input id="city" name="city" defaultValue={meta.city} required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state" className="text-sm font-medium text-zinc-700">Estado</Label>
                            <Input id="state" name="state" defaultValue={meta.state} maxLength={2} required disabled={isPending} />
                        </div>

                        {/* Credenciais (readonly) */}
                        <div className="sm:col-span-2 mt-2">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 mb-2">Credenciais</h3>
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
