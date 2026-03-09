"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Eye, EyeOff, Save } from "lucide-react";
import { createStaffAccount } from "./actions";

export function RegisterStaffForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState("financeiro");

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            try {
                const result = await createStaffAccount(formData);
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
                        {/* Informações Profissionais */}
                        <div className="sm:col-span-2">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 mb-2">Informações da Equipe</h3>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="fullName" className="text-sm font-medium text-zinc-700">Nome Completo</Label>
                            <Input id="fullName" name="fullName" placeholder="Ex: Maria da Silva" required disabled={isPending} />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="role" className="text-sm font-medium text-zinc-700">Perfil de Acesso</Label>
                            {/* Hidden input garante que o valor é enviado via FormData */}
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

                        {/* Credenciais */}
                        <div className="sm:col-span-2 mt-2">
                            <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 mb-2">Credenciais de Acesso</h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-zinc-700">E-mail Corporativo</Label>
                            <Input id="email" name="email" type="email" placeholder="nome@competir.pay" required disabled={isPending} />
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
                                Cadastrar Membro
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
