"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, Save } from "lucide-react";
import { createClientAccount } from "./actions";

export function RegisterClientForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            try {
                const result = await createClientAccount(formData);
                if (result?.error) {
                    setError(result.error);
                }
            } catch (e) {
                // Next.js redirections throw an error here, which is expected
            }
        });
    };

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
                            <Input id="fullName" name="fullName" placeholder="Ex: João da Silva" required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cpf" className="text-sm font-medium text-zinc-700">CPF</Label>
                            <Input id="cpf" name="cpf" placeholder="000.000.000-00" required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-zinc-700">Celular / Telefone</Label>
                            <Input id="phone" name="phone" placeholder="(00) 00000-0000" required disabled={isPending} />
                        </div>

                        {/* Endereço */}
                        <div className="sm:col-span-2 mt-2">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 mb-2">Endereço</h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cep" className="text-sm font-medium text-zinc-700">CEP</Label>
                            <Input id="cep" name="cep" placeholder="00000-000" required disabled={isPending} />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="street" className="text-sm font-medium text-zinc-700">Rua / Logradouro</Label>
                            <Input id="street" name="street" placeholder="Ex: Rua das Flores" required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="number" className="text-sm font-medium text-zinc-700">Número</Label>
                            <Input id="number" name="number" placeholder="Ex: 123" required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="neighborhood" className="text-sm font-medium text-zinc-700">Bairro</Label>
                            <Input id="neighborhood" name="neighborhood" placeholder="Ex: Centro" required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city" className="text-sm font-medium text-zinc-700">Cidade</Label>
                            <Input id="city" name="city" placeholder="Ex: São Paulo" required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state" className="text-sm font-medium text-zinc-700">Estado</Label>
                            <Input id="state" name="state" placeholder="Ex: SP" maxLength={2} required disabled={isPending} />
                        </div>

                        {/* Credenciais */}
                        <div className="sm:col-span-2 mt-2">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 mb-2">Credenciais de Acesso</h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-zinc-700">E-mail de Acesso</Label>
                            <Input id="email" name="email" type="email" placeholder="nome@exemplo.com.br" required disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-zinc-700">Senha Inicial</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="pr-10"
                                    disabled={isPending}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                                    disabled={isPending}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-50 border-t px-6 py-4 flex items-center justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Cadastrando..." : (
                            <>
                                <Save className="size-4 mr-2" />
                                Cadastrar Cliente
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
